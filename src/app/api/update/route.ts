import { NextResponse } from "next/server";
import { exec } from "child_process";

function run(cmd: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) reject({ ...err, stdout, stderr });
      else resolve({ stdout, stderr });
    });
  });
}

export async function POST() {
  const cwd = process.cwd();
  const steps: { step: string; output: string }[] = [];

  try {
    // 1. Pull latest from remote.
    // Pass safe.directory inline so git doesn't reject /app due to the WORKDIR
    // being owned by root while the container process runs as the nextjs user.
    const pull = await run(`git -c safe.directory=${cwd} pull --ff-only 2>&1`, cwd);
    steps.push({ step: "git pull", output: pull.stdout.trim() || pull.stderr.trim() });

    const alreadyUpToDate = pull.stdout.includes("Already up to date");

    if (!alreadyUpToDate) {
      // 2. Install any new/changed dependencies
      const install = await run("npm ci --omit=dev 2>&1", cwd);
      steps.push({ step: "npm install", output: install.stdout.trim().slice(-500) });

      // 3. Rebuild the app
      const build = await run("npm run build 2>&1", cwd);
      steps.push({ step: "npm build", output: build.stdout.trim().slice(-500) });
    }

    return NextResponse.json({
      success: true,
      updated: !alreadyUpToDate,
      steps,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; stdout?: string; stderr?: string };
    steps.push({
      step: "error",
      output: error.stderr || error.stdout || error.message || "Unknown error",
    });
    return NextResponse.json({ success: false, steps }, { status: 500 });
  }
}
