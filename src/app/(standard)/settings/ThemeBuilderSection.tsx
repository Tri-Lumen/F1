"use client";

import { useState, useCallback } from "react";
import { useTheme, type AccentTheme, type CustomTheme } from "@/lib/ThemeContext";
import { CURRENT_TEAMS, RETRO_THEMES, TEAM_THEMES, type TeamThemeColors } from "@/lib/teamThemes";

// ── Default starting colors for a new builder ──────────────────────────────
const DEFAULT_COLORS: TeamThemeColors = {
  bg:              "#101010",
  dark:            "#1a1a1a",
  card:            "#242424",
  cardHover:       "#2e2e2e",
  border:          "#363636",
  text:            "#f5f5f5",
  textMuted:       "#949494",
  accent:          "#e10600",
  accentDark:      "#a50500",
  accentSecondary: "#ffffff",
};

// ── Color adjustment helper ────────────────────────────────────────────────
function adjustColor(hex: string, amount: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const adj = (v: number) => Math.max(0, Math.min(255, Math.round(amount > 0 ? v + (255 - v) * amount : v + v * amount)));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`;
}

// ── Color row component ────────────────────────────────────────────────────
function ColorRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(value);

  const handleText = (v: string) => {
    setText(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
  };

  // Sync text when value changes externally (e.g. seeding from preset)
  if (text !== value && /^#[0-9a-fA-F]{6}$/.test(value)) {
    setText(value);
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-f1-border/30 last:border-0">
      {/* Color swatch + native picker */}
      <label
        className="relative h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer ring-1 ring-f1-border hover:ring-f1-accent transition-all"
        title="Click to open color picker"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => { onChange(e.target.value); setText(e.target.value); }}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </label>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-none">{label}</p>
        {description && <p className="text-[10px] text-f1-text-muted mt-0.5">{description}</p>}
      </div>

      <input
        type="text"
        value={text}
        onChange={(e) => handleText(e.target.value)}
        maxLength={7}
        spellCheck={false}
        className="w-20 rounded-md bg-f1-dark border border-f1-border px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-f1-accent"
      />
    </div>
  );
}

// ── Live mini-preview ──────────────────────────────────────────────────────
function ThemePreview({ colors, name }: { colors: TeamThemeColors; name: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden border text-[11px] font-sans"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      {/* Accent bar */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentSecondary})` }}
      />
      <div className="p-3 space-y-2">
        {/* Nav strip */}
        <div
          className="rounded-lg px-2 py-1.5 flex items-center gap-2"
          style={{ backgroundColor: colors.dark, borderColor: colors.border, border: `1px solid ${colors.border}` }}
        >
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: colors.textMuted }} />
          <div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.text }} />
        </div>
        {/* Card */}
        <div
          className="rounded-lg p-2 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <div className="h-2 w-20 rounded-full mb-1.5" style={{ backgroundColor: colors.text }} />
          <div className="h-1.5 w-28 rounded-full" style={{ backgroundColor: colors.textMuted }} />
          <div className="mt-2 flex gap-1">
            <div className="flex-1 rounded-md flex items-center justify-center py-1" style={{ backgroundColor: colors.accent }}>
              <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>Button</span>
            </div>
            <div
              className="flex-1 rounded-md flex items-center justify-center py-1 border"
              style={{ borderColor: colors.border, backgroundColor: colors.dark }}
            >
              <span style={{ color: colors.textMuted, fontSize: 9 }}>Ghost</span>
            </div>
          </div>
        </div>
        <p className="text-center font-bold" style={{ color: colors.textMuted, fontSize: 9 }}>{name || "Untitled"}</p>
      </div>
    </div>
  );
}

// ── Saved custom theme card ────────────────────────────────────────────────
function SavedThemeCard({
  theme,
  active,
  onApply,
  onEdit,
  onDelete,
}: {
  theme: CustomTheme;
  active: boolean;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { colors } = theme;
  return (
    <div
      className="relative rounded-xl border-2 overflow-hidden transition-all"
      style={active ? { borderColor: colors.accent, backgroundColor: colors.card } : {}}
    >
      {!active && <div className="absolute inset-0 rounded-xl border-2 border-f1-border pointer-events-none" />}
      {/* Color bar */}
      <div
        className="h-8 w-full"
        style={{
          background: `linear-gradient(90deg, ${colors.bg} 20%, ${colors.card} 40%, ${colors.border} 60%, ${colors.accent} 80%, ${colors.accentSecondary} 100%)`,
        }}
      />
      <div className="p-3">
        <p className="font-bold text-sm truncate">{theme.name}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10" style={{ backgroundColor: colors.accent }} />
          <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10" style={{ backgroundColor: colors.accentSecondary }} />
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <button
            onClick={onApply}
            className="flex-1 rounded-md py-1 text-xs font-bold transition-colors"
            style={active ? { backgroundColor: colors.accent, color: "#fff" } : {}}
          >
            {active ? "Applied" : "Apply"}
          </button>
          <button
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs text-f1-text-muted hover:text-f1-text border border-f1-border/50 hover:border-f1-border transition-colors"
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-md px-2 py-1 text-xs text-red-400/70 hover:text-red-400 border border-f1-border/50 hover:border-red-400/30 transition-colors"
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
      {active && (
        <span
          className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-full text-white shadow text-xs"
          style={{ backgroundColor: colors.accent }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function ThemeBuilderSection() {
  const { accentTheme, setAccentTheme, customThemes, saveCustomTheme, updateCustomTheme, deleteCustomTheme } = useTheme();

  // Builder state
  const [colors, setColors] = useState<TeamThemeColors>(DEFAULT_COLORS);
  const [themeName, setThemeName] = useState("My Theme");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [seedOpen, setSeedOpen] = useState(false);

  const updateColor = useCallback(
    (key: keyof TeamThemeColors, value: string) => {
      setColors((prev) => {
        const next = { ...prev, [key]: value };
        // Auto-derive related values
        if (key === "accent") next.accentDark = adjustColor(value, -0.25);
        if (key === "card") next.cardHover = adjustColor(value, 0.12);
        return next;
      });
    },
    []
  );

  function seedFromPreset(theme: { colors: TeamThemeColors; name: string } | null) {
    if (theme) {
      setColors({ ...theme.colors });
      if (!editingId) setThemeName(`${theme.name} (custom)`);
    } else {
      setColors({ ...DEFAULT_COLORS });
      setThemeName("My Theme");
    }
    setSeedOpen(false);
  }

  function handleSave() {
    if (!themeName.trim()) return;
    if (editingId) {
      updateCustomTheme(editingId, themeName.trim(), colors);
    } else {
      const saved = saveCustomTheme(themeName.trim(), colors);
      setAccentTheme(saved.id as AccentTheme);
    }
    setEditingId(null);
  }

  function handleEdit(theme: CustomTheme) {
    setColors({ ...theme.colors });
    setThemeName(theme.name);
    setEditingId(theme.id);
    // Scroll builder into view
    document.getElementById("theme-builder-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleDelete(id: string) {
    deleteCustomTheme(id);
    if (editingId === id) setEditingId(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setColors({ ...DEFAULT_COLORS });
    setThemeName("My Theme");
  }

  const colorFields: { key: keyof TeamThemeColors; label: string; desc?: string }[] = [
    { key: "bg",              label: "Page Background",    desc: "Main page background" },
    { key: "dark",            label: "Surface",            desc: "Inputs, secondary surfaces" },
    { key: "card",            label: "Card",               desc: "Card backgrounds" },
    { key: "border",          label: "Border",             desc: "All border and divider lines" },
    { key: "text",            label: "Primary Text" },
    { key: "textMuted",       label: "Secondary Text",     desc: "Labels, subtitles, metadata" },
    { key: "accent",          label: "Accent",             desc: "Buttons, links, active states" },
    { key: "accentSecondary", label: "Secondary Accent",   desc: "Ambient glow, secondary highlights" },
  ];

  const allPresets = [...CURRENT_TEAMS, ...RETRO_THEMES];

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-1">Custom Themes</h2>
      <p className="text-sm text-f1-text-muted mb-6">
        Build your own color palette from scratch or start from any preset livery.
      </p>

      {/* Saved custom themes */}
      {customThemes.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-f1-text-muted mb-3 font-semibold">Saved Themes</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customThemes.map((t) => (
              <SavedThemeCard
                key={t.id}
                theme={t}
                active={accentTheme === t.id}
                onApply={() => setAccentTheme(accentTheme === t.id ? "none" : (t.id as AccentTheme))}
                onEdit={() => handleEdit(t)}
                onDelete={() => handleDelete(t.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Builder form */}
      <div id="theme-builder-form" className="rounded-xl border border-f1-border bg-f1-card overflow-hidden">
        <div className="border-b border-f1-border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">
              {editingId ? `Editing: ${themeName}` : "New Theme"}
            </p>
            <p className="text-xs text-f1-text-muted">
              {editingId ? "Changes apply to the saved theme" : "Configure colors then save as a preset"}
            </p>
          </div>

          {/* Seed from preset dropdown */}
          <div className="relative">
            <button
              onClick={() => setSeedOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-f1-border bg-f1-dark px-3 py-1.5 text-xs font-medium hover:border-f1-text-muted transition-colors"
            >
              Seed from preset
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {seedOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-f1-border bg-f1-card shadow-xl overflow-hidden">
                <button
                  onClick={() => seedFromPreset(null)}
                  className="w-full px-3 py-2 text-xs text-left hover:bg-f1-dark transition-colors text-f1-text-muted"
                >
                  Reset to defaults
                </button>
                <div className="border-t border-f1-border/50 py-1">
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-f1-text-muted/60 font-semibold">2026 Teams</p>
                  {CURRENT_TEAMS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => seedFromPreset(t)}
                      className="w-full px-3 py-2 text-xs text-left hover:bg-f1-dark transition-colors flex items-center gap-2"
                    >
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.colors.accent }} />
                      {t.name}
                    </button>
                  ))}
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-f1-text-muted/60 font-semibold mt-1">Retro</p>
                  {RETRO_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => seedFromPreset(t)}
                      className="w-full px-3 py-2 text-xs text-left hover:bg-f1-dark transition-colors flex items-center gap-2"
                    >
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.colors.accent }} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_220px] divide-y md:divide-y-0 md:divide-x divide-f1-border/50">
          {/* Color pickers */}
          <div className="p-4">
            {colorFields.map((f) => (
              <ColorRow
                key={f.key}
                label={f.label}
                description={f.desc}
                value={colors[f.key]}
                onChange={(v) => updateColor(f.key, v)}
              />
            ))}
          </div>

          {/* Preview + save */}
          <div className="p-4 flex flex-col gap-4">
            <div>
              <p className="text-xs text-f1-text-muted mb-2 font-semibold">Live Preview</p>
              <ThemePreview colors={colors} name={themeName} />
            </div>

            <div>
              <label className="block text-xs text-f1-text-muted mb-1 font-semibold">Theme Name</label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="My Theme"
                maxLength={30}
                className="w-full rounded-lg border border-f1-border bg-f1-dark px-3 py-2 text-sm focus:outline-none focus:border-f1-accent"
              />
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={handleSave}
                disabled={!themeName.trim()}
                className="w-full rounded-lg bg-f1-accent px-4 py-2 text-sm font-bold text-white hover:bg-f1-red-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editingId ? "Save Changes" : "Save & Apply"}
              </button>
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="w-full rounded-lg border border-f1-border px-4 py-2 text-sm text-f1-text-muted hover:text-f1-text hover:border-f1-text-muted transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
