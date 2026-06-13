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
        {/* Mobile-first frame, centered on larger screens */}
        <div className="mx-auto min-h-screen max-w-[440px] bg-ivory shadow-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
