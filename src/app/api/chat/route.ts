import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ─────────────────────────────────────────────────────────────
// POST /api/chat
// Conduit l'entretien : analyse la réponse, relance ou avance
// ─────────────────────────────────────────────────────────────

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      profil_intervieweur,
      poste,
    }: {
      messages: Message[];
      profil_intervieweur: string;
      poste: string;
    } = await req.json();

    if (!messages || !profil_intervieweur) {
      return NextResponse.json(
        { error: "Historique et profil intervieweur requis" },
        { status: 400 }
      );
    }

    const systemPrompt = `Tu es ${profil_intervieweur}. Tu conduis un entretien d'embauche pour le poste : ${poste}.

Règles absolues :
- Pose UNE seule question ou relance à la fois
- Si la réponse est vague, sans exemple concret, ou évasive → insiste avec "Pouvez-vous me donner un exemple précis ?" ou "Vous avez mentionné X, développez."
- Si la réponse contient un exemple chiffré et est structurée (méthode STAR) → passe à la prochaine compétence clé du poste
- Après 8 échanges au total → conclus poliment l'entretien avec "Je pense que nous avons fait le tour des points essentiels. Merci pour cet échange."
- Reste dans le personnage en permanence
- Aucun commentaire méta sur l'entretien (ne dis pas "bonne réponse", "bravo", etc.)
- Sois professionnel mais créé une tension naturelle de recrutement`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemPrompt,
      // Pass the full conversation history
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Réponse inattendue de l'IA");
    }

    return NextResponse.json({ reply: content.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/chat] Détail erreur :", err);
    } else {
      console.error("[/api/chat]", message);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
