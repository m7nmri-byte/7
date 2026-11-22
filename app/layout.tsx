import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { RegisterSW } from "@/components/RegisterSW";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

/** للاسم وللأرقام: خطوط النظام لا تنزل إلى وزن ١٠٠، وأرقام المونو قاسية */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500"],
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
    <html lang="ar" dir="rtl" className={inter.variable}>
      <body className="bg-paper font-sans text-ink">
        <RegisterSW />
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
