"use client";

import { useState, useRef, useEffect } from "react";
import type { TeamRadio, LiveTimingDriver } from "@/lib/types";

export default function TeamRadioFeed({
  messages,
  drivers,
}: {
  messages: TeamRadio[];
  drivers: LiveTimingDriver[];
}) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount to prevent leaked playback and state updates
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Sort by date descending, show latest first
  const sorted = [...messages].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const display = showAll ? sorted : sorted.slice(0, 10);

  function togglePlay(url: string) {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }
    // Tear down previous clip: strip the ended listener first so a late-firing
    // event from the old element can't clobber the new playingUrl state.
    const prev = audioRef.current;
    if (prev) {
      prev.onended = null;
      prev.pause();
      prev.removeAttribute("src");
      prev.load();
    }
    const audio = new Audio(url);
    audio.onended = () => {
      if (audioRef.current === audio) setPlayingUrl(null);
    };
    audioRef.current = audio;
    setPlayingUrl(url);
    // play() returns a promise; await the settled result so that if the user
    // supersedes this clip before it starts, the abort doesn't bubble as an
    // unhandled DOMException ("play() was interrupted by pause()").
    audio.play().catch(() => {
      if (audioRef.current === audio) setPlayingUrl(null);
    });
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card p-6 text-center">
        <p className="text-f1-text-muted text-sm">No team radio messages yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-f1-border bg-f1-card">
      <div className="border-b border-f1-border p-4 flex items-center justify-between gap-3">
        <h3 className="font-bold text-lg">Team Radio</h3>
        <div className="flex items-center gap-3">
          {playingUrl && (
            <button
              onClick={() => {
                audioRef.current?.pause();
                setPlayingUrl(null);
              }}
              className="rounded-md border border-f1-border bg-f1-dark px-2 py-1 text-[11px] font-semibold text-f1-text-muted hover:border-f1-accent/40 hover:text-f1-accent transition-colors"
              title="Stop the currently-playing radio message"
              aria-label="Stop currently playing radio message"
            >
              Stop
            </button>
          )}
          <span className="text-xs text-f1-text-muted">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="divide-y divide-f1-border/50 max-h-96 overflow-y-auto">
        {display.map((msg, i) => {
          const driver = driverMap.get(msg.driver_number);
          const isPlaying = playingUrl === msg.recording_url;
          const time = new Date(msg.date);

          return (
            <div
              key={`${msg.driver_number}-${msg.date}-${i}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isPlaying ? "bg-f1-accent/5" : "hover:bg-f1-dark/30"
              }`}
            >
              {/* Play button */}
              <button
                onClick={() => togglePlay(msg.recording_url)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isPlaying
                    ? "bg-f1-accent text-white"
                    : "bg-f1-dark text-f1-text-muted hover:bg-f1-accent/20 hover:text-f1-accent"
                }`}
                title={isPlaying ? "Pause" : "Play radio message"}
                aria-label={
                  isPlaying
                    ? `Pause ${driver?.name_acronym ?? `#${msg.driver_number}`} radio message`
                    : `Play ${driver?.name_acronym ?? `#${msg.driver_number}`} radio message`
                }
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Driver info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {driver && (
                    <span
                      className="h-4 w-0.5 rounded-full"
                      style={{
                        backgroundColor: driver.team_colour
                          ? `#${driver.team_colour}`
                          : "#888",
                      }}
                    />
                  )}
                  <span className="text-sm font-bold">
                    {driver?.name_acronym ?? `#${msg.driver_number}`}
                  </span>
                  <span className="text-xs text-f1-text-muted">
                    {driver?.team_name ?? ""}
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <span className="text-xs text-f1-text-muted shrink-0">
                {time.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
          );
        })}
      </div>

      {sorted.length > 10 && !showAll && (
        <div className="border-t border-f1-border p-3 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-f1-accent hover:underline"
          >
            Show all {sorted.length} messages
          </button>
        </div>
      )}
    </div>
  );
}
