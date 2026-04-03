"use client";

import { useState, useEffect } from "react";

const DEFAULT_MV_HOST = "localhost:10101";

function getMultiviewerUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("f1-multiviewer-host");
    const host = saved && saved.trim() ? saved.trim() : DEFAULT_MV_HOST;
    return `http://${host}/api/graphql`;
  }
  return `http://${DEFAULT_MV_HOST}/api/graphql`;
}

export default function OnboardButton({
  driverNumber,
  acronym,
  compact = false,
}: {
  driverNumber: number;
  acronym: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "no-mv"
  >("idle");
  const [mvConnected, setMvConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = getMultiviewerUrl();
    const timeout = setTimeout(() => controller.abort(), 3000);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ systemInfo { version } }" }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!controller.signal.aborted) setMvConnected(res.ok);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMvConnected(false);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  async function openOnboard() {
    if (mvConnected === false) {
      setStatus("no-mv");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setStatus("loading");
    const url = getMultiviewerUrl();
    try {
      // Re-check connection before sending mutation
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation {
            playerCreate(input: {
              contentType: "onboard"
              driverNumber: ${driverNumber}
            }) {
              ... on Player { id }
            }
          }`,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json.errors?.length) {
          // GraphQL returned errors — try legacy mutation format
          const retryRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `mutation {
                playerCreate(input: {
                  contentId: "ONBOARD"
                  driverNumber: ${driverNumber}
                }) { id }
              }`,
            }),
          });
          if (retryRes.ok) {
            const retryJson = await retryRes.json();
            if (!retryJson.errors?.length) {
              setStatus("success");
              setTimeout(() => setStatus("idle"), 2000);
              return;
            }
          }
          setStatus("error");
          setTimeout(() => setStatus("idle"), 3000);
        } else {
          setStatus("success");
          setTimeout(() => setStatus("idle"), 2000);
        }
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const title =
    status === "no-mv"
      ? "MultiViewer not detected — check Settings to configure the host"
      : status === "success"
      ? `Opened ${acronym} onboard!`
      : status === "error"
      ? "Failed to open onboard"
      : `Open ${acronym} onboard in MultiViewer`;

  return (
    <button
      onClick={openOnboard}
      disabled={status === "loading"}
      title={title}
      className={`group relative inline-flex items-center justify-center rounded-lg transition-all ${
        compact
          ? "h-7 w-7 bg-f1-dark/60 hover:bg-f1-accent/20"
          : "gap-1.5 bg-f1-dark px-3 py-1.5 text-xs font-medium hover:bg-f1-accent/20"
      } ${
        status === "success"
          ? "!bg-green-500/20 text-green-400"
          : status === "error" || status === "no-mv"
          ? "!bg-red-500/20 text-red-400"
          : mvConnected === false
          ? "text-f1-text-muted/50"
          : "text-f1-text-muted hover:text-f1-accent"
      }`}
    >
      {status === "loading" ? (
        <svg
          className="h-3.5 w-3.5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : status === "success" ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
      {!compact && (
        <span>
          {status === "success"
            ? "Opened!"
            : status === "error"
            ? "Failed"
            : status === "no-mv"
            ? "No MultiViewer"
            : "Onboard"}
        </span>
      )}

      {/* Tooltip for no-mv status */}
      {status === "no-mv" && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-f1-dark px-2 py-1 text-xs text-f1-text shadow-lg border border-f1-border z-10">
          MultiViewer not found — configure host in Settings
        </span>
      )}
    </button>
  );
}
