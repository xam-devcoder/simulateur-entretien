"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types SpeechRecognition (pas dans les types TS par défaut) ─
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

type Message = { role: "user" | "assistant"; content: string };
const MAX_QUESTIONS = 8;

export default function InterviewPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [context, setContext] = useState<{
    profil_intervieweur: string;
    premiere_question: string;
    poste: string;
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [showEndButton, setShowEndButton] = useState(false);

  // ── Dictaphone state ───────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState(""); // transcript partiel en cours
  const [micError, setMicError] = useState("");
  const [micSupported, setMicSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef(""); // accumule les segments finaux

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load context ────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem("interview_context");
    if (!raw) { router.replace("/upload"); return; }
    const ctx = JSON.parse(raw);
    setContext(ctx);
    setMessages([{ role: "assistant", content: ctx.premiere_question }]);
    setQuestionCount(1);
  }, [router]);

  // ── Vérifier support micro au montage ──────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      setMicSupported(supported);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (questionCount >= 5) setShowEndButton(true);
  }, [questionCount]);

  // ── Auto-resize textarea ────────────────────
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, []);

  // ── Dictaphone — toggle enregistrement ─────
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Arrêter
      recognitionRef.current?.stop();
      return;
    }

    // Démarrer
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setMicError("Dictaphone non supporté sur ce navigateur. Utilise Chrome ou Edge.");
      return;
    }

    setMicError("");
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "fr-FR";
    recognition.continuous = true;       // ne s'arrête pas entre les phrases
    recognition.interimResults = true;   // transcript partiel en temps réel
    recognition.maxAlternatives = 1;

    // Accumulateur de texte final pour cette session d'enregistrement
    finalTranscriptRef.current = input;

    recognition.onstart = () => {
      setIsRecording(true);
      setInterimText("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let newFinal = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const segment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Ajouter un espace de séparation propre
          newFinal = newFinal + (newFinal && !newFinal.endsWith(" ") ? " " : "") + segment;
        } else {
          interim = segment;
        }
      }

      finalTranscriptRef.current = newFinal;
      setInput(newFinal);
      setInterimText(interim);

      // Auto-resize après injection de texte
      setTimeout(() => autoResize(), 10);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setMicError("Accès au micro refusé. Autorise le micro dans les paramètres du navigateur.");
      } else if (event.error === "no-speech") {
        setMicError("Aucune voix détectée. Réessaie.");
      } else if (event.error !== "aborted") {
        setMicError(`Erreur micro : ${event.error}`);
      }
      setIsRecording(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording, input, autoResize]);

  // ── Nettoyer la reconnaissance au démontage ─
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // ── Send ─────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || !context) return;

    // Arrêter l'enregistrement si actif avant d'envoyer
    if (isRecording) {
      recognitionRef.current?.stop();
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setInterimText("");
    finalTranscriptRef.current = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          profil_intervieweur: context.profil_intervieweur,
          poste: context.poste,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setQuestionCount((prev) => prev + 1);

      const conclusionKw = ["merci pour cet échange", "tour des points", "nous avons terminé", "fin de l'entretien"];
      if (conclusionKw.some((kw) => data.reply.toLowerCase().includes(kw)) || questionCount + 1 >= MAX_QUESTIONS) {
        setFinished(true); setShowEndButton(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, context, messages, questionCount, isRecording]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const endInterview = () => {
    if (!context) return;
    recognitionRef.current?.abort();
    sessionStorage.setItem("interview_messages", JSON.stringify(messages));
    sessionStorage.setItem("interview_profil", context.profil_intervieweur);
    sessionStorage.setItem("interview_poste", context.poste);
    router.push("/debrief");
  };

  if (!context) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const progress = Math.min((questionCount / MAX_QUESTIONS) * 100, 100);
  const hasContent = input.trim().length > 0 || interimText.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Header ────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 border-b border-[#1a1a1a] bg-[#080808]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-4">
          <Link href="/" className="shrink-0 font-bold tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>
            Interview<span className="text-accent">AI</span>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-[#5a5a5a] mb-1">
              <span>Question {questionCount} / {MAX_QUESTIONS}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {showEndButton && (
            <button onClick={endInterview} className="shrink-0 text-xs font-semibold border border-[#2a2a2a] hover:border-accent/50 hover:text-accent px-4 py-2 rounded-lg transition-all" style={{ fontFamily: 'var(--font-syne)' }}>
              Terminer →
            </button>
          )}
        </div>
      </header>

      {/* ── Messages ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto pt-16 pb-64">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

          {/* Profil badge */}
          <div className="flex items-center gap-3 py-3 px-4 bg-[#101010] border border-[#1a1a1a] rounded-xl w-fit">
            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0" style={{ fontFamily: 'var(--font-syne)' }}>
              {context.profil_intervieweur.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">{context.profil_intervieweur}</p>
              {context.poste && <p className="text-[11px] text-[#5a5a5a] mt-0.5">{context.poste}</p>}
            </div>
            <div className="ml-2 flex items-center gap-1.5 text-[11px] text-[#5a5a5a]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/70 animate-pulse" />
              En cours
            </div>
          </div>

          {/* Messages list */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 animate-fade-in-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-1 ${
                msg.role === "assistant"
                  ? "bg-accent/10 border border-accent/20 text-accent"
                  : "bg-[#1a1a1a] border border-[#2a2a2a] text-[#5a5a5a]"
              }`} style={{ fontFamily: 'var(--font-syne)' }}>
                {msg.role === "assistant" ? "R" : "T"}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-[1.65] ${
                msg.role === "assistant"
                  ? "bg-[#101010] border border-[#1e1e1e] text-[#e8e4df] rounded-tl-sm"
                  : "bg-accent text-white rounded-tr-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 animate-fade-in-up">
              <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[11px] font-bold text-accent shrink-0 mt-1">R</div>
              <div className="bg-[#101010] border border-[#1e1e1e] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5a5a5a] typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5a5a5a] typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5a5a5a] typing-dot" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/30 border border-red-900/50 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {finished && (
            <div className="bg-[#101010] border border-accent/20 rounded-2xl p-6 text-center animate-fade-in-up">
              <div className="w-10 h-10 rounded-full border border-accent/30 bg-accent/10 flex items-center justify-center text-accent text-lg mx-auto mb-4">✓</div>
              <p className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-syne)' }}>Entretien terminé</p>
              <p className="text-[#5a5a5a] text-sm mb-5">Ton rapport de performance est prêt.</p>
              <button onClick={endInterview} className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
                Voir mon rapport →
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Zone de saisie (fixed bottom) ─────── */}
      {!finished && (
        <div className="fixed bottom-0 w-full z-40">
          <div className="h-10 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
          <div className="bg-[#080808] border-t border-[#161616]">
            <div className="max-w-2xl mx-auto px-4 pt-3 pb-5">

              {/* Barre d'état enregistrement */}
              {isRecording && (
                <div className="flex items-center gap-2.5 mb-2 px-1">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-[12px] text-red-400 font-medium" style={{ fontFamily: 'var(--font-syne)' }}>
                    Enregistrement en cours — parle naturellement
                  </span>
                  <button
                    onClick={toggleRecording}
                    className="ml-auto text-[11px] text-[#5a5a5a] hover:text-red-400 transition-colors"
                  >
                    Arrêter
                  </button>
                </div>
              )}

              {/* Erreur micro */}
              {micError && (
                <div className="mb-2 px-3 py-2 bg-red-950/30 border border-red-900/40 rounded-lg text-[12px] text-red-400">
                  {micError}
                </div>
              )}

              {/* Zone principale */}
              <div className={`relative bg-[#101010] border rounded-2xl transition-all overflow-hidden ${
                isRecording ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.08)]" : "border-[#222] focus-within:border-[#333]"
              }`}>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); finalTranscriptRef.current = e.target.value; autoResize(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "" : "Écris ou dicte ta réponse…"}
                  disabled={loading}
                  className="w-full bg-transparent px-4 pt-4 text-sm text-foreground placeholder:text-[#333] resize-none outline-none disabled:opacity-50 leading-relaxed"
                  style={{ minHeight: "90px", maxHeight: "240px", overflowY: "auto", paddingBottom: interimText ? "4px" : "44px" }}
                />

                {/* Transcript interim (texte partiel en temps réel) */}
                {interimText && (
                  <div className="px-4 pb-2 text-sm text-[#5a5a5a] italic leading-relaxed">
                    {interimText}
                    <span className="inline-block w-0.5 h-4 bg-[#5a5a5a] ml-0.5 animate-pulse align-middle" />
                  </div>
                )}

                {/* Barre d'actions en bas */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#181818]" style={{ paddingBottom: interimText ? "8px" : undefined }}>
                  <div className="flex items-center gap-2">
                    {/* Bouton micro */}
                    {micSupported ? (
                      <button
                        onClick={toggleRecording}
                        disabled={loading}
                        title={isRecording ? "Arrêter l'enregistrement" : "Dicter ma réponse"}
                        className={`relative flex items-center justify-center w-8 h-8 rounded-full border transition-all disabled:opacity-40 ${
                          isRecording
                            ? "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20"
                            : "bg-transparent border-[#2a2a2a] text-[#5a5a5a] hover:border-[#3a3a3a] hover:text-foreground"
                        }`}
                      >
                        {isRecording && (
                          <span className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" />
                        )}
                        <MicIcon recording={isRecording} />
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#3a3a3a]">Micro non supporté</span>
                    )}

                    {/* Compteur */}
                    <span className="text-[11px] text-[#3a3a3a]">
                      {hasContent
                        ? `${(input + interimText).length} caract.`
                        : "Shift+Entrée = nouvelle ligne"}
                    </span>
                  </div>

                  {/* Bouton envoyer */}
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="flex items-center gap-1.5 bg-accent hover:bg-accent-dark disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {loading ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <>Envoyer <span className="opacity-60">↑</span></>
                    )}
                  </button>
                </div>
              </div>

              {/* Aide dictaphone */}
              {!isRecording && micSupported && !micError && (
                <p className="text-center text-[11px] text-[#2a2a2a] mt-2">
                  Clique sur le micro pour dicter ta réponse en français
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icône micro SVG ──────────────────────────────────────────
function MicIcon({ recording }: { recording: boolean }) {
  if (recording) {
    // Carré stop quand enregistrement actif
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
