import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeachZenith — Teaching jobs abroad you can actually get",
  description: "Honest matches for Nigerian teachers — and exactly what each one takes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-ivory text-ink antialiased">
        {/* Each page owns its responsive frame (mobile-first, scaling up to desktop). */}
        {children}
      </body>
    </html>
  );
}
