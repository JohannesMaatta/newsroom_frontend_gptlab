"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createNewsUrl, type Locale } from "@/utils/newsUtils";
import { adminDeleteArticle, adminListInterviews, type Interview } from "@/lib/interviewApi";
import styles from "./Interview.module.css";

const STORAGE_KEY = "interview_admin_token";

function readToken(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function saveToken(token: string) {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: token just isn't remembered */
  }
}

export default function AdminInterviews({ locale }: { locale: Locale }) {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Interview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (t: string) => {
    setError(null);
    try {
      setItems(await adminListInterviews(t));
      setToken(t);
      saveToken(t);
    } catch (err) {
      setItems(null);
      setToken("");
      saveToken("");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    const saved = readToken();
    if (saved) load(saved);
  }, [load]);

  const onDelete = async (item: Interview) => {
    if (!window.confirm(`Delete the article "${item.headline}" from the site? This cannot be undone.`)) return;
    setBusyId(item.id);
    try {
      await adminDeleteArticle(token, item.id);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Interview articles – admin</h1>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              load(input);
            }}
          >
            <label className={styles.label}>
              Admin password
              <input
                className={styles.input}
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.primary} type="submit">
              Log in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ maxWidth: 1050 }}>
      <div className={styles.card}>
        <h1 className={styles.title}>Interview articles – admin</h1>
        {error && <p className={styles.error}>{error}</p>}
        <p className={styles.help} style={{ marginBottom: 16 }}>
          Deleting removes the article from gptnewsroom.fi immediately. The interview record stays here, marked
          “deleted”.{" "}
          <button className={styles.danger} style={{ background: "#555" }} onClick={() => load(token)}>
            Refresh
          </button>{" "}
          <button
            className={styles.danger}
            style={{ background: "#555" }}
            onClick={() => {
              saveToken("");
              setToken("");
              setItems(null);
            }}
          >
            Log out
          </button>
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Status</th>
                <th>Article / topic</th>
                <th>Name · phone</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString("fi-FI")}</td>
                  <td>{item.status}</td>
                  <td>
                    {item.status === "published" && item.article_id && item.headline ? (
                      <Link
                        className={styles.link}
                        href={createNewsUrl(item.headline, item.article_id, locale)}
                        target="_blank"
                      >
                        {item.headline}
                      </Link>
                    ) : (
                      item.headline || <em>{item.topic}</em>
                    )}
                    {item.error && <div className={styles.help}>{item.error}</div>}
                  </td>
                  <td>
                    {item.name || "–"}
                    <div className={styles.help}>{item.phone_number}</div>
                  </td>
                  <td>
                    {item.status === "published" && (
                      <button className={styles.danger} disabled={busyId === item.id} onClick={() => onDelete(item)}>
                        {busyId === item.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items && items.length === 0 && (
                <tr>
                  <td colSpan={5}>No interviews yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
