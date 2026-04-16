"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DebriefReport } from "@/app/api/debrief/route";

// ─────────────────────────────────────────────────────────────
// Page Débriefing — score global + compétences /10 + Q&A
// ─────────────────────────────────────────────────────────────

export default function DebriefPage() {
  const router = useRouter();
  const [report, setReport] = useState<DebriefReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [animated, setAnimated] = useState(false);
  const scoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesRaw = sessionStorage.getItem("interview_messages");
    const profil = sessionStorage.getItem("interview_profil");
    const poste = sessionStorage.getItem("interview_poste");
    if (!messagesRaw) { router.replace("/upload"); return; }

    fetch("/api/debrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: JSON.parse(messagesRaw), profil_intervieweur: profil, poste }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setReport(data);
        setLoading(false);
        setTimeout(() => setAnimated(true), 200);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erreur lors du débriefing");
        setLoading(false);
      });
  }, [router]);

  const copyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(buildReportText(report)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const newInterview = () => { sessionStorage.clear(); router.push("/upload"); };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#1a1a1a]" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-syne)' }}>
            Analyse de l&apos;entretien…
          </p>
          <p className="text-[#5a5a5a] text-sm">Le coach IA évalue chaque réponse.</p>
        </div>
        <div className="space-y-2.5 w-56">
          {["Évaluation des réponses", "Notation des compétences", "Génération des axes de progression"].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 text-[13px] text-[#3a3a3a]">
              <div className="w-3.5 h-3.5 rounded-full border border-[#2a2a2a] animate-pulse shrink-0" />
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full border border-red-900/50 bg-red-950/20 flex items-center justify-center text-red-500 text-xl mx-auto mb-5">!</div>
          <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-syne)' }}>Erreur lors du débriefing</h2>
          <p className="text-[#5a5a5a] text-sm mb-6">{error}</p>
          <button onClick={newInterview} className="bg-accent text-white font-semibold px-6 py-2.5 rounded-xl text-sm">
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const scoreColor = report.score >= 70 ? "#4ade80" : report.score >= 50 ? "#facc15" : "#f87171";
  const scoreLabel = report.score >= 70 ? "Bonne performance" : report.score >= 50 ? "Performance correcte" : "À retravailler";
  const gaugeColor = report.score >= 70 ? "bg-green-500" : report.score >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ───────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#161616] bg-[#080808]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>
            Interview<span className="text-accent">AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={copyReport}
              className="text-xs font-medium border border-[#222] hover:border-[#333] px-3.5 py-2 rounded-lg transition-colors text-[#888]"
            >
              {copied ? "✓ Copié" : "Copier le rapport"}
            </button>
            <button
              onClick={newInterview}
              className="text-xs font-semibold bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg transition-colors"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Nouvel entretien
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 pt-24 pb-24 space-y-6">

        {/* ── Score global ───────────────────────── */}
        <div ref={scoreRef} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Big number */}
            <div className="shrink-0 text-center sm:text-left">
              <div
                className="text-8xl font-black leading-none tracking-tighter"
                style={{ fontFamily: 'var(--font-syne)', color: scoreColor }}
              >
                {report.score}
              </div>
              <div className="text-[#3a3a3a] text-sm font-medium mt-1">/100</div>
            </div>

            {/* Divider vertical */}
            <div className="hidden sm:block w-px h-24 bg-[#1a1a1a] shrink-0" />

            {/* Synthèse */}
            <div className="flex-1">
              <div
                className="text-sm font-semibold uppercase tracking-widest mb-2"
                style={{ color: scoreColor, fontFamily: 'var(--font-syne)' }}
              >
                {scoreLabel}
              </div>
              <p className="text-[#888] text-sm leading-relaxed">{report.synthese}</p>
              {/* Gauge */}
              <div className="mt-4 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${gaugeColor} transition-all duration-1000 ease-out`}
                  style={{ width: animated ? `${report.score}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Compétences /10 ────────────────────── */}
        {report.competences && report.competences.length > 0 && (
          <div>
            <SectionTitle>Compétences évaluées</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.competences.map((c, i) => {
                const pct = (c.score / 10) * 100;
                const barColor =
                  c.score >= 8 ? "bg-green-500" :
                  c.score >= 6 ? "bg-accent" :
                  c.score >= 4 ? "bg-yellow-500" : "bg-red-500";
                const textColor =
                  c.score >= 8 ? "text-green-400" :
                  c.score >= 6 ? "text-[#f0ede8]" :
                  c.score >= 4 ? "text-yellow-400" : "text-red-400";

                return (
                  <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#2a2a2a] transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>
                        {c.nom}
                      </span>
                      <span className={`text-xl font-black ${textColor}`} style={{ fontFamily: 'var(--font-syne)' }}>
                        {c.score}
                        <span className="text-sm text-[#3a3a3a] font-medium">/10</span>
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
                        style={{
                          width: animated ? `${pct}%` : "0%",
                          transitionDelay: `${i * 80}ms`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#5a5a5a] leading-snug">{c.observation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3 corrections prioritaires ─────────── */}
        <div>
          <SectionTitle>3 corrections prioritaires</SectionTitle>
          <div className="space-y-2">
            {report.corrections.map((correction, i) => (
              <div
                key={i}
                className="flex gap-4 items-start bg-[#0d0d0d] border border-[#1e1e1e] hover:border-accent/20 rounded-xl p-4 transition-colors"
              >
                <div
                  className="w-6 h-6 rounded-full border border-accent/30 bg-accent/10 text-accent text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                  style={{ fontFamily: 'var(--font-syne)' }}
                >
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-[#c8c4bf]">{correction}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Analyse Q par Q ────────────────────── */}
        <div>
          <SectionTitle>Analyse question par question</SectionTitle>
          <div className="space-y-3">
            {report.reponses.map((item, i) => {
              const cfg = {
                bon:    { label: "Bon", dot: "bg-green-500",  border: "border-green-500/10",  text: "text-green-400",  bg: "bg-green-500/[0.04]" },
                moyen:  { label: "Moyen", dot: "bg-yellow-500", border: "border-yellow-500/10", text: "text-yellow-400", bg: "bg-yellow-500/[0.04]" },
                faible: { label: "Faible", dot: "bg-red-500",    border: "border-red-500/10",    text: "text-red-400",    bg: "bg-red-500/[0.04]" },
              }[item.note];

              return (
                <div key={i} className={`border rounded-xl overflow-hidden ${cfg.border}`}>
                  {/* Header */}
                  <div className="bg-[#0d0d0d] px-5 py-3.5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#3a3a3a]" style={{ fontFamily: 'var(--font-syne)' }}>
                          Q{i + 1}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.text}`} style={{ fontFamily: 'var(--font-syne)' }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug text-[#d8d4cf]">{item.question}</p>
                    </div>
                  </div>
                  {/* Body */}
                  <div className={`px-5 py-4 space-y-3 ${cfg.bg}`}>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#3a3a3a] font-medium mb-1" style={{ fontFamily: 'var(--font-syne)' }}>
                        Ta réponse
                      </p>
                      <p className="text-[13px] text-[#666] italic">&ldquo;{item.resume_reponse}&rdquo;</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#3a3a3a] font-medium mb-1" style={{ fontFamily: 'var(--font-syne)' }}>
                        Feedback
                      </p>
                      <p className={`text-[13px] leading-relaxed ${cfg.text}`}>{item.commentaire}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CTA ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={newInterview}
            className="flex-1 bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Nouvel entretien →
          </button>
          <button
            onClick={copyReport}
            className="flex-1 border border-[#222] hover:border-[#333] text-[#888] hover:text-foreground font-medium py-3.5 rounded-xl text-sm transition-colors"
          >
            {copied ? "✓ Rapport copié !" : "Copier le rapport"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared section title ─────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-sm font-bold uppercase tracking-widest text-[#888]" style={{ fontFamily: 'var(--font-syne)' }}>
        {children}
      </h2>
      <div className="flex-1 h-px bg-[#1a1a1a]" />
    </div>
  );
}

// ── Plain-text export ────────────────────────────────────────
function buildReportText(report: DebriefReport): string {
  const lines: string[] = [
    `RAPPORT D'ENTRETIEN — Score : ${report.score}/100`,
    "═".repeat(40),
    "",
    report.synthese,
    "",
    "── COMPÉTENCES ──",
    ...(report.competences ?? []).map((c) => `${c.nom.padEnd(30)} ${c.score}/10  — ${c.observation}`),
    "",
    "── 3 CORRECTIONS PRIORITAIRES ──",
    ...report.corrections.map((c, i) => `${i + 1}. ${c}`),
    "",
    "── ANALYSE PAR QUESTION ──",
    ...report.reponses.flatMap((r, i) => [
      "",
      `Q${i + 1}: ${r.question}`,
      `Réponse : ${r.resume_reponse}`,
      `Note : ${r.note.toUpperCase()} — ${r.commentaire}`,
    ]),
    "",
    "Généré par InterviewAI",
  ];
  return lines.join("\n");
}
