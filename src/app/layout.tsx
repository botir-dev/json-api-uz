import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: {
    default: "json-api — Backend as a Service",
    template: "%s | json-api",
  },
  description:
    "json-api — O'zbekistoning ilk BaaS platformasi. Kolleksiyalar, API kalitlari, webhooklar va ko'proq narsani boshqaring.",
  keywords: [
    "json-api",
    "baas",
    "backend as a service",
    "api",
    "uzbekistan",
    "o'zbekiston",
    "database",
    "rest api",
    "cloud",
  ],
  authors: [{ name: "json-api" }],
  creator: "json-api",
  publisher: "json-api",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "https://json-api.uz",
    siteName: "json-api",
    title: "json-api — Backend as a Service",
    description:
      "O'zbekistoning ilk BaaS platformasi. Ilovangiz uchun backend infratuzilmasini bir zumda yarating.",
  },
  twitter: {
    card: "summary_large_image",
    title: "json-api — Backend as a Service",
    description:
      "O'zbekistoning ilk BaaS platformasi. Kolleksiyalar, API kalitlari, webhooklar va analitikani boshqaring.",
  },
  metadataBase: new URL("https://json-api.uz"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
