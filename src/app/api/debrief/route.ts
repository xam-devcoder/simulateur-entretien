import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Message = { role: "user" | "assistant"; content: string };

export type Competence = {
  nom: string;
  score: number; // 0–10
  observation: string; // 1 phrase concrète
};

export type DebriefReport = {
  score: number;
  synthese: string;
  competences: Competence[];
  reponses: Array<{
    question: string;
    resume_reponse: string;
    note: "bon" | "moyen" | "faible";
    commentaire: string;
  }>;
  corrections: [string, string, string];
};

export async function POST(req: NextRequest) {
  try {
    const { messages, profil_intervieweur, poste }: {
      messages: Message[];
      profil_intervieweur: string;
      poste: string;
    } = await req.json();

    if (!messages || messages.length < 2) {
      return NextResponse.json({ error: "Historique insuffisant" }, { status: 400 });
    }

    const conversationText = messages
      .map((m) => `${m.role === "assistant" ? "RECRUTEUR" : "CANDIDAT"}: ${m.content}`)
      .join("\n\n");

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2500,
      system: `Tu es un coach en entretien expert. Analyse cet entretien pour le poste : ${poste}.
Recruteur : ${profil_intervieweur}.

Règles d'évaluation :
- Score global /100 : honnête. 70+ = bien, 50-69 = passable, <50 = à retravailler.
- Compétences : identifie exactement 5 compétences clés évaluables dans cet entretien (ex: Communication, Maîtrise technique, Exemples STAR, Motivation/culture fit, Gestion du stress). Note chacune sur 10.
- Feedback : pas de "soyez plus confiant" — cite la question précise et propose une reformulation concrète.

Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "score": number (0-100),
  "synthese": string (2-3 phrases d'évaluation globale directe),
  "competences": [
    { "nom": string, "score": number (0-10), "observation": string (1 phrase factuelle) }
  ],
  "reponses": [
    {
      "question": string,
      "resume_reponse": string (1 phrase),
      "note": "bon" | "moyen" | "faible",
      "commentaire": string (feedback chirurgical)
    }
  ],
  "corrections": [string, string, string]
}`,
      messages: [{
        role: "user",
        content: `Transcription de l'entretien :\n\n${conversationText}\n\nGénère le rapport complet en JSON.`,
      }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Réponse inattendue");

    const raw = content.text.replace(/```json|```/g, "").trim();
    const report: DebriefReport = JSON.parse(raw);

    return NextResponse.json(report);
  } catch (err: unknown) {
    console.error("[/api/debrief]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
