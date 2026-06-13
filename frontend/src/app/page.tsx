"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function SplashPage() {
  const router = useRouter();
  const glowRef = useRef<HTMLDivElement>(null);

  // Subtle cursor parallax on the gold glow.
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-b from-emerald to-emerald-lift px-7 pb-8 pt-11 text-ivory">
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 transition-transform duration-200 ease-out"
        style={{ background: "radial-gradient(circle at 30% 20%, rgba(201,162,75,.18), transparent 55%)" }}
      />
      <div className="relative animate-fade-up text-xs font-semibold uppercase tracking-[2px] text-brass">TeachZenith</div>

      <div className="relative">
        <h1 className="font-display text-4xl font-semibold leading-[1.08]">
          <span className="block animate-fade-up" style={{ animationDelay: ".15s" }}>See the teaching</span>
          <span className="block animate-fade-up" style={{ animationDelay: ".28s" }}>jobs abroad you</span>
          <span className="block animate-fade-up" style={{ animationDelay: ".41s" }}>
            can <em className="text-brass">actually</em> get.
          </span>
        </h1>
        <p className="mt-4 animate-fade-up text-[16px] leading-relaxed text-[#C7D6CF]" style={{ animationDelay: ".55s" }}>
          Honest matches for Nigerian teachers — and exactly what each one takes. No fees. No false promises. No dead listings.
        </p>
      </div>

      <div className="relative animate-fade-up" style={{ animationDelay: ".7s" }}>
        <button
          onClick={() => router.push("/intake")}
          className="w-full rounded-2xl bg-brass py-4 text-[17px] font-bold text-emerald shadow-lg transition active:scale-[.98]"
        >
          See where I qualify →
        </button>
        <div className="mt-4 flex justify-center gap-4 text-xs text-[#9DB3AB]">
          <span>✓ Free for teachers</span>
          <span>✓ 8 quick questions</span>
          <span>✓ ~2 min</span>
        </div>
      </div>
    </div>
  );
}
