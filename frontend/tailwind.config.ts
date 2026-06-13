import type { Config } from "tailwindcss";

// Emerald & Brass design system — tokens shared across the whole frontend.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emerald: { DEFAULT: "#0F3D33", lift: "#164A3E" },
        brass: "#C9A24B",
        ivory: { DEFAULT: "#F6F3EC", deep: "#EBE6D9" },
        positive: "#3E8E6F",
        copper: "#B5663A",
        ink: "#23201A",
        muted: "#6B6555",
        line: "#DDD5C2",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sm: "0 1px 3px rgba(15,61,51,.06), 0 1px 2px rgba(15,61,51,.04)",
        DEFAULT: "0 4px 16px rgba(15,61,51,.08), 0 2px 6px rgba(15,61,51,.05)",
        lg: "0 12px 40px rgba(15,61,51,.14), 0 4px 12px rgba(15,61,51,.08)",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(18px)" }, "100%": { opacity: "1", transform: "none" } },
        fade: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        pulseSoft: { "0%,100%": { opacity: "0.4" }, "50%": { opacity: "1" } },
      },
      animation: {
        "fade-up": "fadeUp .55s ease both",
        "fade-in": "fade .5s ease both",
        "pulse-soft": "pulseSoft 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
