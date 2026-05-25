import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { MetaPixel } from "@/components/meta-pixel";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://axoniq.com.br"),
  title: {
    default: "AxonIQ - O jeito mais rápido de transformar o seu conteúdo em conhecimento",
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
    title: "AxonIQ - O jeito mais rápido de transformar o seu conteúdo em conhecimento",
    description:
      "Garanta seu acesso antecipado: transforme PDFs e vídeos em flashcards interativos e mapas mentais.",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/favicon.png",
        width: 256,
        height: 256,
        alt: "AxonIQ Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AxonIQ - O jeito mais rápido de transformar o seu conteúdo em conhecimento",
    description:
      "Garanta seu acesso antecipado: transforme PDFs e vídeos em flashcards interativos e mapas mentais.",
    images: ["/favicon.png"],
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
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <MetaPixel />
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
