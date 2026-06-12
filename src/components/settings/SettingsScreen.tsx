"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchTracks, type ExamTrack } from "@/lib/api";
import { ACCENT_COLORS, type ThemeAccent, type ThemeMode } from "@/lib/theme";
import BottomNav from "../nav/BottomNav";
import ExamTrackPicker from "../onboarding/ExamTrackPicker";
import LanguagePicker from "../onboarding/LanguagePicker";
import SubscriptionSection from "./SubscriptionSection";

const ACCENT_OPTIONS: { id: ThemeAccent; label: string }[] = [
  { id: "saffron", label: "Saffron" },
  { id: "indigo", label: "Indigo" },
  { id: "emerald", label: "Emerald" },
];

function avatarInitial(name?: string, email?: string): string {
  const source = (name?.trim() || email || "?").charAt(0);
  return source.toUpperCase();
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="label-caps mb-3 text-[10px] text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { mode, accent, setMode, setAccent } = useTheme();
  const router = useRouter();

  const [name, setName] = useState("");
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [language, setLanguage] = useState("en");
  const [savingName, setSavingName] = useState(false);
  const [savingStudy, setSavingStudy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setSelectedTracks(new Set(user.exam_tracks ?? []));
    setLanguage(user.language ?? "en");
  }, [user]);

  useEffect(() => {
    fetchTracks()
      .then(setTracks)
      .catch(() => setError("Couldn't load exam tracks."));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const el = document.querySelector(window.location.hash);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function toggleTrack(slug: string) {
    setSelectedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function saveName() {
    setSavingName(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({ name: name.trim() });
      setMessage("Name updated.");
    } catch {
      setError("Couldn't save your name. Please try again.");
    } finally {
      setSavingName(false);
    }
  }

  async function saveStudy() {
    if (selectedTracks.size === 0) {
      setError("Select at least one exam track.");
      return;
    }
    setSavingStudy(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({
        exam_tracks: [...selectedTracks],
        language,
      });
      setMessage("Study preferences saved.");
    } catch {
      setError("Couldn't save study preferences. Please try again.");
    } finally {
      setSavingStudy(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
    router.replace("/");
  }

  const contact = user?.email || user?.phone || "";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-24 pt-8">
      <header className="mb-8 flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/20 font-display text-xl font-bold text-accent"
          aria-hidden
        >
          {avatarInitial(user?.name, user?.email)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold">
            {user?.name?.trim() || "Your account"}
          </h1>
          <p className="truncate text-[13px] text-muted">{contact}</p>
        </div>
      </header>

      {message && (
        <div className="mb-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-[13px] text-success">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
          {error}
        </div>
      )}

      <SettingsSection title="Account">
        <div className="rounded-2xl border border-border-subtle bg-surface p-4">
          <label className="block text-[12px] text-muted" htmlFor="settings-name">
            Display name
          </label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={150}
            className="mt-1.5 w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={savingName}
            onClick={saveName}
            className="mt-3 rounded-xl bg-accent px-4 py-2 font-display text-[13px] font-semibold text-[#0d0e14] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {savingName ? "Saving…" : "Save name"}
          </button>

          <dl className="mt-4 space-y-2 border-t border-border-subtle pt-4 text-[13px]">
            {user?.email && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Email</dt>
                <dd className="truncate text-right">
                  {user.email}
                  {user.email_verified && (
                    <span className="ml-1 text-success">✓</span>
                  )}
                </dd>
              </div>
            )}
            {user?.phone && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Phone</dt>
                <dd className="text-right">
                  {user.phone}
                  {user.phone_verified && (
                    <span className="ml-1 text-success">✓</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </SettingsSection>

      <SettingsSection title="Study">
        <p className="mb-3 text-[13px] text-muted">
          Exam tracks filter your daily feed. Language applies to briefs and AI Guide.
        </p>
        <ExamTrackPicker tracks={tracks} selected={selectedTracks} onToggle={toggleTrack} />
        <div className="mt-4">
          <LanguagePicker value={language} onChange={setLanguage} />
        </div>
        <button
          type="button"
          disabled={savingStudy}
          onClick={saveStudy}
          className="mt-4 w-full rounded-xl bg-accent py-3 font-display text-[14px] font-semibold text-[#0d0e14] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {savingStudy ? "Saving…" : "Save study preferences"}
        </button>
      </SettingsSection>

      <SubscriptionSection />

      <SettingsSection title="Appearance">
        <div className="rounded-2xl border border-border-subtle bg-surface p-4">
          <p className="mb-2 text-[12px] text-muted">Theme</p>
          <div className="flex rounded-xl bg-surface-elevated p-1">
            {(["dark", "light"] as ThemeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`flex-1 rounded-lg py-2 text-[13px] font-medium capitalize transition-colors ${
                  mode === m ? "bg-background text-foreground" : "text-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[12px] text-muted">Accent color</p>
          <div className="flex gap-3">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAccent(opt.id)}
                aria-pressed={accent === opt.id}
                aria-label={opt.label}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  accent === opt.id ? "border-foreground" : "border-transparent"
                }`}
                style={{ backgroundColor: ACCENT_COLORS[opt.id] }}
              >
                {accent === opt.id && (
                  <span className="text-xs font-bold text-white">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      <button
        type="button"
        disabled={signingOut}
        onClick={handleSignOut}
        className="w-full rounded-2xl border border-danger/40 bg-danger/10 py-3.5 font-display text-[14px] font-semibold text-danger transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>

      <BottomNav active="settings" />
    </div>
  );
}
