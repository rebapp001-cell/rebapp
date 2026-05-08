import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pega o nome da empresa da Vercel. Se não existir, usa um nome padrão.
const nomeEmpresa = process.env.NEXT_PUBLIC_NOME_EMPRESA || "Sistema OS";

// Configuração de Metadados Dinâmicos
export const metadata: Metadata = {
  title: `${nomeEmpresa} - Sistema OS`,
  description: "Sistema de Gestão de Ordens de Serviço",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: nomeEmpresa,
  },
  formatDetection: {
    telephone: false,
  },
};

// Configuração da cor da barra do navegador (estilo app nativo)
export const viewport: Viewport = {
  themeColor: "#07111f", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#07111f]"> 
        {children}
      </body>
    </html>
  );
}