import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";

interface LanguageSwitcherProps {
  /** "light" for light backgrounds (storefront), "dark" for the forest sidebar. */
  tone?: "light" | "dark";
}

export default function LanguageSwitcher({ tone = "light" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage;

  const wrap =
    tone === "dark"
      ? "border-white/10 bg-white/5"
      : "border-slate-200 bg-slate-50";

  const activeBtn =
    tone === "dark" ? "bg-brand-600 text-white" : "bg-white text-brand-700 shadow-sm";
  const idleBtn =
    tone === "dark"
      ? "text-slate-400 hover:text-white"
      : "text-slate-500 hover:text-slate-800";

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border p-0.5 ${wrap}`}
      role="group"
      aria-label={t("language.label")}
    >
      {SUPPORTED_LANGUAGES.map(({ code }) => (
        <button
          key={code}
          type="button"
          onClick={() => void i18n.changeLanguage(code)}
          aria-pressed={current === code}
          className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors ${
            current === code ? activeBtn : idleBtn
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
