import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskPotato",
  description: "Local-first time tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased bg-zinc-950 dark:bg-zinc-950 light:bg-white`}>
        <ThemeProvider>
          <Shell>{children}</Shell>
          <KeyboardShortcutsHelp />
        </ThemeProvider>
      </body>
    </html>
  );
}
