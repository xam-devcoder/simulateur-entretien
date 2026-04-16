"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Page Upload — CV (PDF) + offre d'emploi (fichier ou texte collé)
// ─────────────────────────────────────────────────────────────

type FileState = {
  file: File | null;
  dragging: boolean;
};

type OfferMode = "file" | "text";

export default function UploadPage() {
  const router = useRouter();
  const [cv, setCv] = useState<FileState>({ file: null, dragging: false });
  const [offer, setOffer] = useState<FileState>({ file: null, dragging: false });
  const [offerMode, setOfferMode] = useState<OfferMode>("text");
  const [offerText, setOfferText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const offerInputRef = useRef<HTMLInputElement | null>(null);

  // ── Convert file to base64 ──────────────────
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = reject;
    });
  };

  // ── Drag handlers ──────────────────────────
  const handleDrag = useCallback(
    (setter: React.Dispatch<React.SetStateAction<FileState>>, dragging: boolean) =>
      (e: React.DragEvent) => {
        e.preventDefault();
        setter((prev) => ({ ...prev, dragging }));
      },
    []
  );

  const handleDrop = useCallback(
    (setter: React.Dispatch<React.SetStateAction<FileState>>, accept: string[]) =>
      (e: React.DragEvent) => {
        e.preventDefault();
        setter((prev) => ({ ...prev, dragging: false }));
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!accept.includes(ext)) {
          setError(`Format non supporté. Formats acceptés : ${accept.join(", ")}`);
          return;
        }
        setError("");
        setter({ file, dragging: false });
      },
    []
  );

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileState>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setter({ file, dragging: false });
  };

  // ── Submit ──────────────────────────────────
  const handleSubmit = async () => {
    if (!cv.file) {
      setError("Merci d'uploader ton CV (PDF).");
      return;
    }
    if (offerMode === "file" && !offer.file) {
      setError("Merci d'uploader l'offre d'emploi.");
      return;
    }
    if (offerMode === "text" && !offerText.trim()) {
      setError("Merci de coller le texte de l'offre d'emploi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cvBase64 = await toBase64(cv.file);

      // Build payload depending on offer mode
      const payload: Record<string, string> = {
        cv_base64: cvBase64,
        cv_type: cv.file.type,
      };

      if (offerMode === "file" && offer.file) {
        payload.offer_base64 = await toBase64(offer.file);
        payload.offer_type = offer.file.type;
      } else {
        payload.offer_text = offerText.trim();
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de l'analyse");
      }

      const data = await res.json();

      sessionStorage.setItem(
        "interview_context",
        JSON.stringify({
          profil_intervieweur: data.profil_intervieweur,
          premiere_question: data.premiere_question,
          poste: data.poste ?? "",
        })
      );

      router.push("/interview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight">
            Interview<span className="text-accent">AI</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center mb-12">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">
            Étape 1 / 3
          </p>
          <h1 className="text-3xl sm:text-4xl font-black mb-4">
            Upload tes documents
          </h1>
          <p className="text-muted">
            L&apos;IA analyse ton CV et l&apos;offre pour créer un entretien personnalisé.
          </p>
        </div>

        <div className="space-y-6">
          {/* CV Drop Zone */}
          <DropZone
            label="Ton CV"
            required
            hint="PDF uniquement"
            file={cv.file}
            dragging={cv.dragging}
            inputRef={cvInputRef}
            accept=".pdf"
            onDragEnter={handleDrag(setCv, true)}
            onDragLeave={handleDrag(setCv, false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(setCv, ["pdf"])}
            onClick={() => cvInputRef.current?.click()}
            onChange={(e) => handleFileInput(e, setCv)}
          />

          {/* Offre d'emploi — fichier ou texte */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Offre d&apos;emploi <span className="text-accent">*</span>
              </label>
              {/* Mode toggle */}
              <div className="flex items-center bg-surface border border-border rounded-lg p-0.5 text-xs font-medium">
                <button
                  onClick={() => setOfferMode("text")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    offerMode === "text"
                      ? "bg-accent text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Coller le texte
                </button>
                <button
                  onClick={() => setOfferMode("file")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    offerMode === "file"
                      ? "bg-accent text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Uploader un fichier
                </button>
              </div>
            </div>

            {offerMode === "text" ? (
              // Textarea paste mode
              <textarea
                value={offerText}
                onChange={(e) => { setOfferText(e.target.value); setError(""); }}
                placeholder="Colle ici le texte de l'offre d'emploi (depuis LinkedIn, Welcome to the Jungle, Indeed…)"
                rows={8}
                className="w-full bg-surface border border-border focus:border-accent/50 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors placeholder:text-muted leading-relaxed"
              />
            ) : (
              // File upload mode
              <DropZone
                label=""
                hint="PDF, PNG ou JPG"
                file={offer.file}
                dragging={offer.dragging}
                inputRef={offerInputRef}
                accept=".pdf,.png,.jpg,.jpeg"
                onDragEnter={handleDrag(setOffer, true)}
                onDragLeave={handleDrag(setOffer, false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop(setOffer, ["pdf", "png", "jpg", "jpeg"])}
                onClick={() => offerInputRef.current?.click()}
                onChange={(e) => handleFileInput(e, setOffer)}
              />
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-950/50 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-8 w-full bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-8 py-5 rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Spinner />
              Analyse en cours…
            </>
          ) : (
            "Analyser et générer mon entretien →"
          )}
        </button>

        {loading && (
          <div className="mt-6 bg-surface border border-border rounded-xl p-4 space-y-2">
            <p className="text-sm text-muted">En cours :</p>
            <LoadingStep label="Lecture du CV" done={false} active />
            <LoadingStep label="Analyse de l'offre d'emploi" done={false} active={false} />
            <LoadingStep label="Génération du profil recruteur" done={false} active={false} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

type DropZoneProps = {
  label: string;
  required?: boolean;
  hint: string;
  file: File | null;
  dragging: boolean;
  inputRef: React.RefObject<HTMLInputElement | null> | React.MutableRefObject<HTMLInputElement | null>;
  accept: string;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function DropZone({
  label,
  required,
  hint,
  file,
  dragging,
  inputRef,
  accept,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick,
  onChange,
}: DropZoneProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? "border-accent bg-accent/5"
            : file
            ? "border-accent/50 bg-surface"
            : "border-border hover:border-foreground/30 bg-surface"
        }`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
      >
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onChange}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="text-left">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-muted text-xs">
                {(file.size / 1024).toFixed(0)} Ko · Cliquer pour changer
              </p>
            </div>
            <span className="ml-auto text-accent text-lg">✓</span>
          </div>
        ) : (
          <div>
            <p className="font-medium text-sm mb-1">
              Glisser-déposer ou cliquer pour uploader
            </p>
            <p className="text-muted text-xs">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function LoadingStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {done ? (
        <span className="text-accent">✓</span>
      ) : active ? (
        <Spinner />
      ) : (
        <span className="w-4 h-4 rounded-full border border-border" />
      )}
      <span className={done || active ? "text-foreground" : "text-muted"}>{label}</span>
    </div>
  );
}
