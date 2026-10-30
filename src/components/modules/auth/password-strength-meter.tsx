"use client";

import { evaluatePassword } from "@/lib/validation/password-strength";

export function PasswordStrengthMeter({
  password,
  email,
}: {
  password: string;
  email?: string;
}) {
  if (!password) return null;

  const s = evaluatePassword(password, email);
  const tone = s.isAcceptable ? "success" : s.percent >= 60 ? "warning" : "danger";
  const barClass =
    tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger";
  const textClass =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-danger";

  return (
    <div className="mt-3 space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barClass}`}
            style={{ width: `${s.percent}%` }}
          />
        </div>
        <span className={`text-sm font-semibold ${textClass}`}>%{s.percent}</span>
      </div>
      <p className={`text-sm font-medium ${textClass}`}>Şifre gücü: {s.label}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {s.rules.map((r) => (
          <li key={r.label} className={r.met ? "text-success" : "text-text-secondary"}>
            {r.met ? "✓" : "○"} {r.required ? r.label : `${r.label} (ekstra güç)`}
          </li>
        ))}
      </ul>
      {!s.isAcceptable && (
        <p className="text-xs text-text-secondary">
          Devam etmek için çubuğun yeşile dönmesi gerekir.
        </p>
      )}
    </div>
  );
}
