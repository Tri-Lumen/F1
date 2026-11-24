/** Five-row block digits (3 wide) for the ASCII style, hidden unless that style is active. */
const GLYPHS: Record<string, string[]> = {
  "0": ["███", "█ █", "█ █", "█ █", "███"],
  "1": [" █ ", "██ ", " █ ", " █ ", "███"],
  "2": ["███", "  █", "███", "█  ", "███"],
  "3": ["███", "  █", "███", "  █", "███"],
  "4": ["█ █", "█ █", "███", "  █", "  █"],
  "5": ["███", "█  ", "███", "  █", "███"],
  "6": ["███", "█  ", "███", "█ █", "███"],
  "7": ["███", "  █", "  █", "  █", "  █"],
  "8": ["███", "█ █", "███", "█ █", "███"],
  "9": ["███", "█ █", "███", "  █", "███"],
};

export function bigDigitLines(text: string): string[] {
  const rows = ["", "", "", "", ""];
  [...text].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    for (let r = 0; r < 5; r++) rows[r] += (i ? " " : "") + g[r];
  });
  return rows;
}

export default function BigDigits({ text, className = "" }: { text: string; className?: string }) {
  return (
    <pre className={`f1-ascii-only f1-big-digits ${className}`} aria-hidden="true">
      {bigDigitLines(text).join("\n")}
    </pre>
  );
}
