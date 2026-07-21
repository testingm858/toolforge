import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import { FREE_TOOLS } from "@/lib/tools";

const TOTAL_TOOLS = FREE_TOOLS.length;

export const metadata: Metadata = {
  title: {
    default: `ToolForge - ${TOTAL_TOOLS} Free Online Tools`,
    template: "%s | ToolForge",
  },
  description: `Free PDF tools, image tools, audio tools, developer tools and calculators. ${TOTAL_TOOLS} tools in one platform. No signup required.`,
  keywords: ["pdf tools", "image tools", "audio tools", "developer tools", "online tools", "free tools"],
  openGraph: {
    type: "website",
    siteName: "ToolForge",
    title: `ToolForge - ${TOTAL_TOOLS} Free Online Tools`,
    description: "Free PDF, image, audio and developer tools. No signup required.",
  },
  twitter: { card: "summary_large_image" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <SessionProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
