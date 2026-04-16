# InterviewAI — Simulateur d'entretien IA

Un outil d'entraînement aux entretiens qui simule un recruteur réel adapté au poste et à l'entreprise ciblée, avec feedback chirurgical à la fin.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** — palette noir/blanc/rouge
- **Anthropic SDK** — modèle `claude-opus-4-5`
- Pas de base de données (sessionStorage uniquement)

## Lancement rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer la clé API

```bash
cp .env.example .env.local
```

Ouvre `.env.local` et renseigne ta clé :

```
ANTHROPIC_API_KEY=sk-ant-...
```

> Récupère ta clé sur : https://console.anthropic.com/

### 3. Démarrer en développement

```bash
npm run dev
```

Ouvre http://localhost:3000

## Architecture

```
src/app/
├── page.tsx              # Landing page
├── upload/page.tsx       # Upload CV + offre
├── interview/page.tsx    # Chat entretien
├── debrief/page.tsx      # Rapport final
└── api/
    ├── analyze/route.ts  # Analyse CV + offre → profil recruteur
    ├── chat/route.ts     # Conduit l'entretien
    └── debrief/route.ts  # Génère le rapport structuré
```

## Flux utilisateur

1. **Landing** → CTA "Commencer gratuitement"
2. **Upload** → CV (PDF) + Offre (PDF/PNG/JPG) → analyse par Claude
3. **Interview** → Chat avec un recruteur virtuel adapté au poste (8 questions max)
4. **Debrief** → Score /100, analyse Q par Q, 3 corrections prioritaires

## Variables d'environnement

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Clé API Anthropic (obligatoire) |

## Build production

```bash
npm run build
npm start
```
