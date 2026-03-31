import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AxonIQ | A IA para o Estudante de Medicina brasileiro",
    template: "%s | AxonIQ",
  },
  description:
    "Lista de Espera: Transforme horas de estudo em retenção permanente. O Axoniq estrutura seu material em flashcards, resumos e mapas mentais focados na medicina brasileira.",
  keywords: [
    "flashcards",
    "medicina",
    "estudo",
    "repetição espaçada",
    "IA",
    "inteligência artificial",
    "residência médica",
    "ciclo básico"
  ],
  authors: [{ name: "Axoniq" }],
  openGraph: {
    title: "AxonIQ | A IA para o Estudante de Medicina brasileiro",
    description:
      "Garanta seu acesso antecipado: transforme PDFs e vídeos em flashcards interativos e mapas mentais.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
