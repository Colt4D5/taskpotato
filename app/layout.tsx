import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskPotato",
  description: "A local-first time tracking application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
