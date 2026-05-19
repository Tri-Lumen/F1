"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DriverStanding } from "@/lib/types";
import { getTeamColor } from "@/lib/api";
import { getDriverConstructorId } from "@/lib/driverOverrides";

const BC = "'Barlow Condensed', sans-serif";
const DM = "'DM Sans', sans-serif";

interface Props {
  drivers: DriverStanding[];
  value: string;
  onChange: (driverId: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
}

export default function DriverPicker({
  drivers,
  value,
  onChange,
  disabled,
  allowEmpty,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = useMemo(
    () => drivers.find((d) => d.Driver.driverId === value),
    [drivers, value],
  );

  const filtered = useMemo(() => {
    if (!query) return drivers;
    const q = query.toLowerCase();
    return drivers.filter((d) => {
      const name = `${d.Driver.givenName} ${d.Driver.familyName}`.toLowerCase();
      const code = (d.Driver.code ?? "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [drivers, query]);

  const constructorId = selected
    ? getDriverConstructorId(
        selected.Driver.driverId,
        selected.Constructors[0]?.constructorId,
      ) ?? ""
    : "";
  const color = constructorId ? getTeamColor(constructorId) : "var(--color-f1-border)";

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "var(--color-f1-card)",
          border: "1px solid var(--color-f1-border)",
          borderRadius: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 3,
            height: 20,
            borderRadius: 2,
            background: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: BC,
            fontWeight: 800,
            fontSize: 14,
            color: selected ? "var(--color-f1-text)" : "var(--color-f1-text-muted)",
            flex: 1,
            letterSpacing: "0.02em",
          }}
        >
          {selected
            ? `${selected.Driver.code ?? ""} ${selected.Driver.familyName.toUpperCase()}`.trim()
            : "Choose a driver"}
        </span>
      </button>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            zIndex: 30,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--color-f1-dark)",
            border: "1px solid var(--color-f1-border)",
            borderRadius: 8,
            maxHeight: 260,
            overflowY: "auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ padding: 6 }}>
            <input
              type="text"
              autoFocus
              placeholder="Search driver…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                background: "var(--color-f1-black)",
                border: "1px solid var(--color-f1-border)",
                borderRadius: 6,
                color: "var(--color-f1-text)",
                fontFamily: DM,
                fontSize: 12,
              }}
            />
          </div>
          {allowEmpty && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              style={{
                ...rowStyle,
                color: "var(--color-f1-text-muted)",
                fontStyle: "italic",
              }}
            >
              — Clear —
            </button>
          )}
          {filtered.length === 0 && (
            <div
              style={{
                padding: "10px 12px",
                fontFamily: DM,
                fontSize: 11,
                color: "var(--color-f1-text-muted)",
              }}
            >
              No drivers match.
            </div>
          )}
          {filtered.map((d) => {
            const cid =
              getDriverConstructorId(
                d.Driver.driverId,
                d.Constructors[0]?.constructorId,
              ) ?? "";
            const c = cid ? getTeamColor(cid) : "var(--color-f1-border)";
            const isSelected = d.Driver.driverId === value;
            return (
              <button
                key={d.Driver.driverId}
                type="button"
                onClick={() => {
                  onChange(d.Driver.driverId);
                  setOpen(false);
                  setQuery("");
                }}
                style={{
                  ...rowStyle,
                  background: isSelected
                    ? "color-mix(in srgb, var(--color-f1-accent) 10%, transparent)"
                    : "transparent",
                }}
              >
                <span
                  style={{
                    width: 3,
                    height: 20,
                    borderRadius: 2,
                    background: c,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    width: 32,
                    color: "var(--color-f1-text-muted)",
                  }}
                >
                  {d.Driver.code}
                </span>
                <span
                  style={{
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 13,
                    flex: 1,
                    letterSpacing: "0.02em",
                  }}
                >
                  {d.Driver.givenName} {d.Driver.familyName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "7px 10px",
  border: "none",
  cursor: "pointer",
  color: "var(--color-f1-text)",
  textAlign: "left",
};
