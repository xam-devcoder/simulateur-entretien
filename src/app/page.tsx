import Link from "next/link";

// ──────────────────────────────────────────────
// Landing page — palette noir / blanc / rouge vif
// ──────────────────────────────────────────────

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      {/* ── NAV ─────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-xl tracking-tight">
            Interview<span className="text-accent">AI</span>
          </span>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-muted hover:text-foreground transition-colors">
              Tarifs
            </a>
            <Link
              href="/upload"
              className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 mb-8 text-sm text-muted">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
            Propulsé par Claude AI
          </div>

          <h1 className="text-5xl sm:text-7xl font-black leading-tight tracking-tight mb-6">
            Ton prochain entretien,{" "}
            <span className="text-accent">tu le rates pas.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Un recruteur IA qui lit ton CV, analyse l&apos;offre, et te fait
            passer un vrai entretien — pas des questions génériques.
            Feedback chirurgical à la fin.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/upload"
              className="bg-accent hover:bg-accent-dark text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 inline-block"
            >
              Commencer gratuitement →
            </Link>
            <a
              href="#how-it-works"
              className="border border-border hover:border-foreground/40 text-foreground font-medium px-8 py-4 rounded-xl text-lg transition-colors inline-block"
            >
              Comment ça marche
            </a>
          </div>

          <p className="text-sm text-muted mt-6">
            1 simulation gratuite/mois · Pas de carte bancaire requise
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted animate-bounce text-xs">
          ↓
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest text-center mb-4">
            Processus
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-center mb-16">
            3 étapes, c&apos;est tout.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl p-8 hover:border-accent/40 transition-colors"
              >
                {/* Numéro d'étape typographique */}
                <div className="text-6xl font-black text-accent/20 leading-none mb-6 select-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="w-8 h-px bg-accent mb-6" />
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFF VS CONCURRENTS ─────────────── */}
      <section className="py-24 px-6 bg-surface border-t border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest text-center mb-4">
            Pourquoi nous
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-center mb-4">
            Fini les questions génériques.
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-16">
            Les autres outils posent les mêmes 10 questions à tout le monde.
            Nous, on lit ton CV et l&apos;offre réelle pour simuler le vrai recruteur.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Competitors */}
            <div className="bg-background border border-border rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-6 text-muted">Les autres outils</h3>
              <ul className="space-y-4">
                {badPoints.map((p, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-muted">
                    <span className="text-red-600 mt-0.5 shrink-0">✗</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            {/* Us */}
            <div className="bg-background border border-accent/30 rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-6 text-accent">InterviewAI</h3>
              <ul className="space-y-4">
                {goodPoints.map((p, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm">
                    <span className="text-accent mt-0.5 shrink-0">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────── */}
      <section id="pricing" className="py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest text-center mb-4">
            Tarifs
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-center mb-4">
            Simple. Transparent.
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-16">
            Commence gratuitement. Upgrade si tu veux t&apos;entraîner plus.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Freemium */}
            <div className="bg-surface border border-border rounded-2xl p-8">
              <div className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
                Freemium
              </div>
              <div className="text-5xl font-black mb-2">0€</div>
              <div className="text-muted text-sm mb-8">par mois</div>
              <ul className="space-y-3 text-sm mb-8">
                <li className="flex gap-2"><span className="text-accent">✓</span>1 simulation par mois</li>
                <li className="flex gap-2"><span className="text-accent">✓</span>Feedback complet</li>
                <li className="flex gap-2"><span className="text-muted">–</span><span className="text-muted">Simulations illimitées</span></li>
                <li className="flex gap-2"><span className="text-muted">–</span><span className="text-muted">Export PDF du rapport</span></li>
              </ul>
              <Link
                href="/upload"
                className="block w-full text-center border border-border hover:border-foreground/40 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Commencer
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-surface border border-accent rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                RECOMMANDÉ
              </div>
              <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
                Pro
              </div>
              <div className="text-5xl font-black mb-2">29€</div>
              <div className="text-muted text-sm mb-8">par mois</div>
              <ul className="space-y-3 text-sm mb-8">
                <li className="flex gap-2"><span className="text-accent">✓</span>Simulations illimitées</li>
                <li className="flex gap-2"><span className="text-accent">✓</span>Feedback chirurgical</li>
                <li className="flex gap-2"><span className="text-accent">✓</span>Export PDF du rapport</li>
                <li className="flex gap-2"><span className="text-accent">✓</span>Historique des entretiens</li>
                <li className="flex gap-2"><span className="text-accent">✓</span>Accès prioritaire aux nouvelles fonctionnalités</li>
              </ul>
              <button
                disabled
                className="block w-full text-center bg-accent text-white font-bold px-6 py-3 rounded-xl text-sm opacity-80 cursor-not-allowed"
              >
                Bientôt disponible
              </button>
            </div>

            {/* Pay-as-you-go */}
            <div className="bg-surface border border-border rounded-2xl p-8">
              <div className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
                À la simulation
              </div>
              <div className="text-5xl font-black mb-2">5€</div>
              <div className="text-muted text-sm mb-2">par simulation</div>
              <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-muted mb-6">
                Le Pro devient rentable à partir de 6 simulations/mois
              </div>
              <ul className="space-y-3 text-sm mb-8">
                <li className="flex gap-2"><span className="text-accent">✓</span>Paye uniquement ce que tu utilises</li>
                <li className="flex gap-2"><span className="text-accent">✓</span>Feedback complet</li>
                <li className="flex gap-2"><span className="text-accent">✓</span>Export PDF du rapport</li>
                <li className="flex gap-2"><span className="text-muted">–</span><span className="text-muted">Historique des entretiens</span></li>
              </ul>
              <button
                disabled
                className="block w-full text-center border border-border font-medium px-6 py-3 rounded-xl transition-colors text-sm opacity-60 cursor-not-allowed"
              >
                Bientôt disponible
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────── */}
      <section className="py-24 px-6 border-t border-border bg-surface text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            Ton prochain entretien,{" "}
            <span className="text-accent">c&apos;est dans combien de jours ?</span>
          </h2>
          <p className="text-muted mb-8 text-lg">
            Arrête de procrastiner. Lance ta simulation maintenant.
          </p>
          <Link
            href="/upload"
            className="bg-accent hover:bg-accent-dark text-white font-bold px-10 py-5 rounded-xl text-xl transition-all hover:scale-105 inline-block"
          >
            Démarrer mon entretien →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <span>
            Interview<span className="text-accent">AI</span> — Propulsé par Claude
          </span>
          <span>© 2024 · MVP</span>
        </div>
      </footer>
    </main>
  );
}

// ── Data ────────────────────────────────────────
const steps = [
  {
    title: "Fournis tes documents",
    desc: "Dépose ton CV en PDF et colle le texte de l'offre d'emploi ciblée. L'IA analyse les deux en quelques secondes.",
  },
  {
    title: "Passe l'entretien",
    desc: "Un recruteur virtuel adapté au poste te pose des questions précises, relance si tes réponses sont vagues, et maintient la pression.",
  },
  {
    title: "Reçois ton feedback",
    desc: "Score /100, analyse question par question, et 3 axes de progression concrets avant ton vrai entretien.",
  },
];

const badPoints = [
  "Questions génériques identiques pour tout le monde",
  "Feedback vague du type 'soyez plus confiant'",
  "Aucun contexte sur le poste ou l'entreprise",
  "Pas d'adaptation au profil du candidat",
];

const goodPoints = [
  "Lit ton CV et l'offre réelle avant de commencer",
  "Recruteur virtuel avec un style adapté (startup, grand groupe, RH, tech...)",
  "Creuse les réponses floues, demande des exemples chiffrés",
  "Feedback chirurgical avec reformulations proposées",
];
