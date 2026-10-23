"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./InterviewPromo.module.css";

const TEXT = {
  fi: {
    title: "Haluatko tekoälyn haastateltavaksi?",
    text: "Valitse aihe, ja tekoälytoimittaja Teppo soittaa sinulle. Haastattelusta tehdään juttu tälle sivustolle.",
    cta: "Teppo, soita minulle",
  },
  en: {
    title: "Want to be interviewed by AI?",
    text: "Pick a topic and Teppo, our AI reporter, will call you. Your interview becomes a story on this site.",
    cta: "Teppo, call me",
  },
};

export default function InterviewPromo() {
  const locale = useLocale();
  const t = locale === "fi" ? TEXT.fi : TEXT.en;
  return (
    <section className={styles.container} aria-labelledby="interview-promo-title">
      <div className={styles.inner}>
        <div>
          <h3 id="interview-promo-title" className={styles.title}>
            🎙️ {t.title}
          </h3>
          <p className={styles.text}>{t.text}</p>
        </div>
        <Link href="/interview" className={styles.cta}>
          {t.cta} →
        </Link>
      </div>
    </section>
  );
}
