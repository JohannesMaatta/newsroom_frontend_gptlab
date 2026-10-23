"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Header.module.css";
import LogoHologram from "./LogoHologram";
import { usePathname, Link as LocaleLink } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

const leftNavItems = [{ href: "/", label: "" }];

const rightNavItems = [
  //{ href: "/uutiset", label: "Oikea1" },
  { href: "/about", label: "Tietoa" },
];

export default function Header() {
  const [stickyActive, setStickyActive] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();

  // Determine if we are on the locale home page
  const isHome = (() => {
    if (!pathname) return false;
    if (pathname === "/") return true; // default locale home
    // Non-default locales use "/en", "/sv", ... as home
    return routing.locales.some(
      (loc) => loc !== routing.defaultLocale && pathname === `/${loc}`
    );
  })();

  useEffect(() => {
    if (isHome) {
      // Only on home: toggle lift on scroll
      const onScroll = () => setStickyActive(window.scrollY > 0);
      onScroll(); // initialize
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    } else {
      // On other pages: always lifted
      setStickyActive(true);
      return undefined;
    }
  }, [isHome]);

  return (
    <header className={`${styles.header} ${stickyActive ? styles.stickyActive : ""}`}>
      <nav className={`${styles.nav} ${styles.leftNav}`}>
        {leftNavItems.map(({ href, label }) => (
          <Link key={href} href={href} className={styles.link}>
            {label}
          </Link>
        ))}
        <LocaleLink
          href="/interview"
          className={styles.link}
          aria-label={locale === "fi" ? "Haastattelu" : "Interview"}
        >
          <span className={styles.longLabel}>{locale === "fi" ? "Haastattelu" : "Interview"}</span>
          <span className={styles.shortLabel} aria-hidden="true">🎙️</span>
        </LocaleLink>
      </nav>

      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          <LogoHologram stickyActive={stickyActive} />
        </Link>
      </div>

      <nav className={`${styles.nav} ${styles.rightNav}`}>
        {rightNavItems.map(({ href, label }) => (
          <Link key={href} href={href} className={styles.link}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
