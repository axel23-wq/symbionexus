import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import NotificationToast from "@/components/NotificationToast";
import ExpoGoButton from "@/components/ExpoGoButton";

export const metadata: Metadata = {
  title: "SymbioNexus — Marketplace Industrielle de l'Économie Circulaire",
  description: "Transformez le déchet d'une usine en la matière première d'une autre. Matchmaking IA, traçabilité logistique, crédits carbone.",
  keywords: "économie circulaire, marketplace B2B, déchets industriels, recyclage, crédits carbone, IA matchmaking",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SymbioNexus",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <ServiceWorkerRegister />
          <NotificationToast />
          <div className="bg-mesh" />
          {children}
          <ExpoGoButton />
        </AuthProvider>
      </body>
    </html>
  );
}
