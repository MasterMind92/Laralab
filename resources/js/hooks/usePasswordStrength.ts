import { useMemo } from "react";

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

interface StrengthResult {
  level: StrengthLevel;
  label: string;
  color: string;
}

export function usePasswordStrength(password: string): StrengthResult {
  return useMemo(() => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels: StrengthResult[] = [
      { level: 0, label: "", color: "" },
      { level: 1, label: "Faible", color: "#DC2626" },
      { level: 2, label: "Moyen", color: "#F59E0B" },
      { level: 3, label: "Fort", color: "#16A34A" },
      { level: 4, label: "Très fort", color: "#059669" },
    ];
    return levels[score] as StrengthResult;
  }, [password]);
}