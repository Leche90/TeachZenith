"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import EduBackground from "@/components/ui/EduBackground";

export default function SplashPage() {
  const router = useRouter();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div className="tz-emerald-bg relative min-h-screen overflow-hidden text-ivory">
      <EduBackground />
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 z-[1] transition-transform duration-200 ease-out"
        style={{ background: "radial-gradient(circle at 28% 25%, rgba(251,191,36,.10), transparent 55%)" }}
      />

      <div className="relative z-10 px-7 pt-9 text-xs font-semibold uppercase tracking-[2px] text-brass md:px-14 md:pt-12 lg:px-20">
        TeachZenith
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col justify-between gap-10 px-7 pb-9 pt-6 md:px-14 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-20 lg:pb-0">
        <div className="lg:max-w-xl">
          <h1 className="font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
            <span className="block animate-fade-up" style={{ animationDelay: ".1s" }}>See the teaching</span>
            <span className="block animate-fade-up" style={{ animationDelay: ".22s" }}>jobs abroad you</span>
            <span className="block animate-fade-up" style={{ animationDelay: ".34s" }}>
              can <em className="text-brass">actually</em> get.
            </span>
          </h1>
          <p className="mt-5 max-w-md animate-fade-up text-[16px] leading-relaxed text-[#C7D6CF] lg:text-lg" style={{ animationDelay: ".48s" }}>
            Honest matches for Nigerian teachers — and exactly what each one takes. No fees. No false promises. No dead listings.
          </p>
        </div>

        <div className="animate-fade-up lg:flex lg:flex-col lg:items-start" style={{ animationDelay: ".6s" }}>
          <div className="w-full lg:max-w-md lg:rounded-3xl lg:bg-white/[.04] lg:p-8 lg:shadow-lg lg:ring-1 lg:ring-white/10">
            <p className="hidden lg:mb-5 lg:block lg:font-display lg:text-xl lg:font-medium lg:text-ivory">
              Eight quick questions. Real matches in minutes.
            </p>
            <button
              onClick={() => router.push("/intake")}
              className="w-full rounded-2xl bg-brass py-4 text-[17px] font-bold text-emerald shadow-lg transition hover:brightness-105 active:scale-[.98]"
            >
              See where I qualify →
            </button>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-[#9DB3AB] lg:justify-start">
              <span>✓ Free for teachers</span>
              <span>✓ 8 quick questions</span>
              <span>✓ ~2 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
