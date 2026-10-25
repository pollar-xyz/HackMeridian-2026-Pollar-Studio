import type { Lang } from "@/lib/prefs";
import { es } from "./es";
import { pt } from "./pt";

// English strings are the keys. Missing translations fall back to English.
const DICTS: Record<Lang, Record<string, string>> = { en: {}, es, pt };

export const LANG_LABELS: Record<Lang, string> = { en: "English", es: "Español", pt: "Português" };

export function getT(lang: Lang) {
  return (text: string, vars?: Record<string, string | number>): string => {
    let out = DICTS[lang][text] ?? text;
    if (vars) for (const [key, value] of Object.entries(vars)) out = out.split(`{${key}}`).join(String(value));
    return out;
  };
}

export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  return getT(lang)(text, vars);
}
