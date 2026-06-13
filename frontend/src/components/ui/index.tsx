"use client";
import React from "react";

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm text-left transition active:scale-95 ${
        on ? "border-emerald bg-emerald text-ivory font-semibold shadow-sm" : "border-line bg-white font-medium text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function YesNo({ value, onChange, big }: { value: boolean | null; onChange: (v: boolean) => void; big?: boolean }) {
  const btn = (val: boolean, label: string) => (
    <button
      onClick={() => onChange(val)}
      className={`rounded-full border font-semibold transition active:scale-95 ${big ? "px-7 py-3 text-base" : "px-4 py-1.5 text-sm"} ${
        value === val ? "border-emerald bg-emerald text-ivory" : "border-line bg-white text-ink"
      }`}
    >
      {label}
    </button>
  );
  return <div className="flex gap-2">{btn(true, "Yes")}{btn(false, "No")}</div>;
}

export function PrimaryButton({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl py-4 text-base font-bold transition active:scale-[.98] ${
        disabled ? "bg-ivory-deep text-muted" : "bg-emerald text-ivory shadow"
      }`}
    >
      {children}
    </button>
  );
}
