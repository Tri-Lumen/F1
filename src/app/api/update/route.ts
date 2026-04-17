import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { timingSafeEqual } from "crypto";

/**
 * When UPDATE_SECRET is set, POSTs must include a matching bearer token.
 * Without a secret the endpoint is open — fine for local Docker on a private
 * network, but anyone hosting this on a LAN or beyond should set one to
 * prevent unauthenticated remote `git pull` + `npm ci` + `npm run build`
 * triggers from anything that can reach the port.
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.UPDATE_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const provided = Buffer.from(match[1]);
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

function run(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(args[0], args.slice(1), {
      cwd,
      timeout: 120_000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    }, (err, stdout, stderr) => {
      if (err) reject({ ...err, stdout, stderr });
      else resolve({ stdout, stderr });
    });
  });
}

/**
 * When running inside Docker, 127.0.0.1 in the git remote URL refers to the
 * container itself rather than the host machine. Replace it with
 * host.docker.internal so git can reach the host's git server.
 * The docker-compose.yml adds the host.docker.internal → host-gateway mapping.
 */
async function fixRemoteForDocker(cwd: string): Promise<void> {
  try {
    const { stdout } = await run(
      ["git", "-c", `safe.directory=${cwd}`, "remote", "get-url", "origin"],
      cwd
    );
    const url = stdout.trim();
    if (url.includes("127.0.0.1") || url.includes("localhost")) {
      const fixed = url
        .replace(/127\.0\.0\.1/g, "host.docker.internal")
        .replace(/\blocalhost\b/g, "host.docker.internal");
      await run(
        ["git", "-c", `safe.directory=${cwd}`, "remote", "set-url", "origin", fixed],
        cwd
      );
    }
  } catch {
    // Non-fatal — git pull will surface the real error if it fails
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // When running inside an Electron packaged app the source tree, git history,
  // and devDependencies are not present — git pull / npm build cannot work.
  // The Electron main process sets ELECTRON_RUN=1 before spawning this server.
  if (process.env.ELECTRON_RUN === "1") {
    return NextResponse.json(
      {
        success: false,
        electron: true,
        message:
          "Self-update via git is not available in the desktop app. " +
          "Use Help → Check for Updates to install a new release.",
      },
      { status: 409 }
    );
  }

  const cwd = process.cwd();
  const steps: { step: string; output: string }[] = [];

  try {
    // Rewrite localhost remote URL so git pull works from inside Docker
    await fixRemoteForDocker(cwd);

    // 1. Pull latest from remote.
    // Pass safe.directory inline so git doesn't reject /app due to the WORKDIR
    // being owned by root while the container process runs as the nextjs user.
    // Resolve the current branch name first so we can pass it explicitly to
    // `git pull origin <branch>` — this avoids the "no tracking information"
    // error that occurs when the local branch has no upstream configured.
    let branch: string;
    try {
      const branchResult = await run(
        ["git", "-c", `safe.directory=${cwd}`, "rev-parse", "--abbrev-ref", "HEAD"],
        cwd
      );
      branch = branchResult.stdout.trim();
    } catch {
      // HEAD is unresolvable (empty repo from docker init) — fetch and set up main
      await run(
        ["git", "-c", `safe.directory=${cwd}`, "fetch", "origin", "main"],
        cwd
      );
      await run(
        ["git", "-c", `safe.directory=${cwd}`, "reset", "--mixed", "origin/main"],
        cwd
      );
      branch = "main";
      steps.push({ step: "init", output: "Initialized repository from remote" });
    }
    const pull = await run(
      ["git", "-c", `safe.directory=${cwd}`, "pull", "--ff-only", "origin", branch],
      cwd
    );
    steps.push({ step: "git pull", output: pull.stdout.trim() || pull.stderr.trim() });

    const alreadyUpToDate = pull.stdout.includes("Already up to date");

    if (!alreadyUpToDate) {
      // 2. Install any new/changed dependencies
      const install = await run(["npm", "ci", "--omit=dev"], cwd);
      steps.push({ step: "npm install", output: install.stdout.trim().slice(-500) });

      // 3. Rebuild the app
      const build = await run(["npm", "run", "build"], cwd);
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
