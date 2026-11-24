/**
 * Block-letter DELTA wordmark. Always in the DOM but hidden by ascii.css unless the
 * ASCII visual style is active, so server and client render the same markup.
 */
const LETTERS: Record<string, string[]> = {
  D: ["██████╗ ", "██╔══██╗", "██║  ██║", "██║  ██║", "██████╔╝", "╚═════╝ "],
  E: ["███████╗", "██╔════╝", "█████╗  ", "██╔══╝  ", "███████╗", "╚══════╝"],
  L: ["██╗     ", "██║     ", "██║     ", "██║     ", "███████╗", "╚══════╝"],
  T: ["████████╗", "╚══██╔══╝", "   ██║   ", "   ██║   ", "   ██║   ", "   ╚═╝   "],
  A: [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
};

const LOGO = Array.from({ length: 6 }, (_, row) =>
  "DELTA".split("").map((ch) => LETTERS[ch][row]).join(""),
);

export default function AsciiLogo({ className = "" }: { className?: string }) {
  return (
    <pre className={`f1-ascii-only f1-ascii-logo ${className}`} aria-hidden="true">
      {LOGO.map((line, i) => (
        <span key={i}>
          {line.split("").map((ch, j) => (
            <span key={j} className={ch === "█" ? "f1-logo-solid" : "f1-logo-shade"}>
              {ch}
            </span>
          ))}
          {"\n"}
        </span>
      ))}
    </pre>
  );
}
