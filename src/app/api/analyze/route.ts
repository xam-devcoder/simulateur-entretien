import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ─────────────────────────────────────────────────────────────
// POST /api/analyze
// Analyse CV + offre (fichier base64 OU texte collé)
// → génère profil recruteur + 1ère question
// ─────────────────────────────────────────────────────────────

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { cv_base64, cv_type, offer_base64, offer_type, offer_text } =
      await req.json();

    if (!cv_base64) {
      return NextResponse.json({ error: "CV requis" }, { status: 400 });
    }
    if (!offer_base64 && !offer_text) {
      return NextResponse.json(
        { error: "Offre d'emploi requise (fichier ou texte)" },
        { status: 400 }
      );
    }

    // ── CV block (toujours un PDF) ─────────────
    const cvBlock = {
      type: "document" as const,
      source: {
        type: "base64" as const,
        media_type: "application/pdf" as const,
        data: cv_base64,
      },
    };

    // ── Offer block : fichier ou texte brut ────
    type ContentBlock =
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
      | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } }
      | { type: "text"; text: string };

    let offerBlock: ContentBlock;

    if (offer_text) {
      // Text pasted directly — wrap as plain text block
      offerBlock = { type: "text", text: `OFFRE D'EMPLOI :\n${offer_text}` };
    } else if (offer_type === "application/pdf") {
      offerBlock = {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: offer_base64 },
      };
    } else {
      // Image (PNG / JPG)
      const imgType = (offer_type as string).startsWith("image/")
        ? (offer_type as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
        : "image/jpeg";
      offerBlock = {
        type: "image",
        source: { type: "base64", media_type: imgType, data: offer_base64 },
      };
    }

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: `Tu es un expert RH et recruteur. Analyse ce CV et cette offre d'emploi.
Génère :
1) Le profil précis du recruteur (prénom, titre, style d'entreprise, ton attendu)
2) Le nom du poste exact
3) La première question d'entretien adaptée au profil du candidat et au poste.
La question doit être ouverte, professionnelle, et commencer l'entretien naturellement.
Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks : { "profil_intervieweur": string, "poste": string, "premiere_question": string }`,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Voici le CV du candidat :" },
            cvBlock,
            { type: "text", text: "Voici l'offre d'emploi :" },
            offerBlock,
            {
              type: "text",
              text: "Analyse ces deux documents et génère le profil recruteur + la première question d'entretien en JSON.",
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Réponse inattendue de l'IA");

    const raw = content.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
