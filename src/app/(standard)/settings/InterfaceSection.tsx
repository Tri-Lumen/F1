"use client";

import { useTheme, type BorderRadius } from "@/lib/ThemeContext";

const RADIUS_OPTIONS: { id: BorderRadius; label: string; desc: string; preview: string }[] = [
  { id: "sharp",   label: "Sharp",    desc: "Minimal radius — technical, data-dense",  preview: "2px" },
  { id: "default", label: "Default",  desc: "Balanced — the standard F1 dashboard look", preview: "12px" },
  { id: "rounded", label: "Rounded",  desc: "Soft corners — easier on the eyes",        preview: "20px" },
];

function RadiusPreview({ radius }: { radius: string }) {
  return (
    <div
      className="flex items-center justify-center h-8 w-8 border-2 border-f1-accent/60 bg-f1-accent/10"
      style={{ borderRadius: radius }}
    >
      <div
        className="h-3 w-3 bg-f1-accent"
        style={{ borderRadius: `calc(${radius} / 2)` }}
      />
    </div>
  );
}

export default function InterfaceSection() {
  const {
    glowIntensity, setGlowIntensity,
    reduceMotion, setReduceMotion,
    borderRadius, setBorderRadius,
  } = useTheme();

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-1">Interface</h2>
      <p className="text-sm text-f1-text-muted mb-6">
        Fine-tune how the dashboard looks and behaves.
      </p>

      {/* Border Radius */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-f1-text-muted mb-3 font-semibold">Corner Style</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {RADIUS_OPTIONS.map((opt) => {
            const active = borderRadius === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setBorderRadius(opt.id)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  active ? "border-f1-accent bg-f1-accent/5" : "border-f1-border bg-f1-card hover:border-f1-text-muted"
                }`}
              >
                <div className="mb-3">
                  <RadiusPreview radius={opt.preview} />
                </div>
                <p className="font-bold text-sm">{opt.label}</p>
                <p className="text-xs text-f1-text-muted mt-0.5">{opt.desc}</p>
                {active && (
                  <span className="absolute top-3 right-3 h-5 w-5 flex items-center justify-center rounded-full bg-f1-accent text-white text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Glow Intensity */}
      <div className="mb-6 rounded-xl border border-f1-border bg-f1-card p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold">Ambient Glow</p>
          <span className="text-sm font-mono text-f1-text-muted">{glowIntensity}%</span>
        </div>
        <p className="text-xs text-f1-text-muted mb-4">
          Controls the intensity of the accent color radial gradients in the background.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-f1-text-muted w-6 text-center">0</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={glowIntensity}
            onChange={(e) => setGlowIntensity(parseInt(e.target.value, 10))}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-f1-accent"
            style={{
              background: `linear-gradient(90deg, var(--color-f1-accent) ${glowIntensity}%, var(--color-f1-border) ${glowIntensity}%)`,
            }}
          />
          <span className="text-xs text-f1-text-muted w-8 text-center">100</span>
        </div>
        <div className="flex justify-between mt-2">
          {[0, 25, 50, 75, 100].map((v) => (
            <button
              key={v}
              onClick={() => setGlowIntensity(v)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                glowIntensity === v
                  ? "text-f1-accent font-bold"
                  : "text-f1-text-muted hover:text-f1-text"
              }`}
            >
              {v === 0 ? "Off" : v === 100 ? "Max" : `${v}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Reduce Motion */}
      <div className="rounded-xl border border-f1-border bg-f1-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Reduce Animations</p>
            <p className="text-xs text-f1-text-muted mt-0.5">
              Disables all transitions, animations, and the live pulse indicator.
              Recommended for accessibility or low-power devices.
            </p>
          </div>
          <button
            onClick={() => setReduceMotion(!reduceMotion)}
            className={`relative flex-shrink-0 ml-4 h-6 w-11 rounded-full transition-colors ${
              reduceMotion ? "bg-f1-accent" : "bg-f1-border"
            }`}
            role="switch"
            aria-checked={reduceMotion}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                reduceMotion ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
