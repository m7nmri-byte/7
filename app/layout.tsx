import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

/** يُستعمل لاسم الموقع فقط: خطوط النظام لا تنزل إلى وزن ١٠٠ */
const wordmark = Inter({
  variable: "--font-wordmark",
  subsets: ["latin"],
  weight: ["100", "200"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://m7nmri.vercel.app"),
  title: { template: "%s | m7nmri", default: "m7nmri" },
  openGraph: { title: "m7nmri", locale: "ar", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={wordmark.variable}>
      <body className="bg-paper font-sans text-ink">
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
