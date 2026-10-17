import type { Metadata } from "next";
import { Geist_Mono, Inter, Russo_One } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Heavy, squared display face that echoes a bold contractor wordmark.
const russo = Russo_One({ subsets: ["latin"], weight: "400", variable: "--font-display" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voltline Electric | Electrician in Northern California",
  description:
    "Licensed C-10 electrical contractor serving Northern California. Panel upgrades, EV chargers, ADUs, and rewiring. Safe work, done right. Request a visit online.",
  icons: { icon: "/brand/logo-mark.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, russo.variable, geistMono.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col bg-white text-ink" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
