"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTracks, type ExamTrack } from "@/lib/api";
import ExamTrackPicker from "./ExamTrackPicker";
import LanguagePicker from "./LanguagePicker";

export default function OnboardingFlow() {
  const { completeOnboarding } = useAuth();
  const router = useRouter();
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [language, setLanguage] = useState("en");
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks()
      .then(setTracks)
      .catch(() => setError("Couldn't load exam tracks. Please retry."));
  }, []);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding({
        exam_tracks: [...selected],
        language,
      });
      router.replace("/");
    } catch {
      setError("Couldn't save your choices. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-12">
      <p className="label-caps mb-2 text-[10px] text-muted">Step {step} of 2</p>

      {step === 1 ? (
        <>
          <h1 className="font-display text-2xl font-bold">Choose your exam track</h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
            We&apos;ll filter every article to your exact syllabus. Select all
            that apply.
          </p>

          <div className="mt-6">
            <ExamTrackPicker tracks={tracks} selected={selected} onToggle={toggle} />
          </div>

          {error && <p className="mt-4 text-center text-[13px] text-danger">{error}</p>}

          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => setStep(2)}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-display text-base font-semibold text-[#0d0e14] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Continue <span aria-hidden>›</span>
          </button>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold">Pick your language</h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
            Read your daily briefs and the AI Guide in your preferred language.
          </p>

          <div className="mt-6">
            <LanguagePicker value={language} onChange={setLanguage} />
          </div>

          {error && <p className="mt-4 text-center text-[13px] text-danger">{error}</p>}

          <div className="mt-auto flex flex-col gap-3 pt-6">
            <button
              type="button"
              disabled={saving}
              onClick={finish}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-display text-base font-semibold text-[#0d0e14] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Setting up…" : "Get Started"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] text-muted hover:text-foreground"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
