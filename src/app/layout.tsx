import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

// Syne — géométrique, sharp, mémorable. Parfait pour headings haut-de-gamme.
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InterviewAI — Simulateur d'entretien alimenté par IA",
  description:
    "Entraîne-toi avec un recruteur IA adapté à ton poste et à l'entreprise ciblée. Feedback chirurgical. Prépare-toi comme un pro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={syne.variable}>
      <body className="bg-background text-foreground min-h-screen antialiased">
        {/* Grain noise overlay — ajoute de la texture et de la profondeur */}
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
