"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createNewsUrl, type Locale } from "@/utils/newsUtils";
import {
  FINAL_STATUSES,
  getInterview,
  getTopics,
  startInterview,
  type Interview,
  type InterviewStatus,
  type Topic,
} from "@/lib/interviewApi";
import styles from "./Interview.module.css";

const TEXT = {
  fi: {
    title: "Tekoäly haastattelee sinua",
    intro:
      "Valitse aihe ja anna puhelinnumerosi. GPT Newsroomin tekoälytoimittaja Teppo soittaa sinulle muutamassa sekunnissa, haastattelee sinua muutaman minuutin ja kirjoittaa vastaustesi pohjalta jutun, joka julkaistaan tällä sivustolla.",
    phone: "Puhelinnumero",
    phoneHelp: "Esim. 040 123 4567 tai +358 40 123 4567. Numeroa ei julkaista.",
    name: "Nimi jutussa (valinnainen)",
    nameHelp: "Jätä tyhjäksi, jos haluat esiintyä nimettömänä.",
    topic: "Valitse aihe",
    topicsLoading: "Ladataan aiheita…",
    topicsError: "Aiheita ei saatu ladattua. Päivitä sivu hetken kuluttua.",
    language: "Haastattelun kieli",
    consent:
      "Ymmärrän, että soittaja Teppo on tekoäly, puhelu litteroidaan ja vastausteni pohjalta julkaistaan juttu GPT Newsroomissa.",
    submit: "Soita minulle",
    starting: "Soitetaan…",
    steps: {
      queued: "Puhelua aloitetaan…",
      ringing: "Puhelimesi soi – vastaa!",
      in_progress: "Haastattelu käynnissä",
      writing: "Juttua kirjoitetaan…",
      published: "Juttu julkaistu",
    },
    transcript: "Haastattelu",
    reporter: "Teppo (tekoäly)",
    you: "Sinä",
    readArticle: "Lue juttu",
    published: "Juttusi on julkaistu!",
    noAnswer: "Et vastannut puheluun.",
    busy: "Linja oli varattu.",
    notPublished: "Haastattelusta ei voitu tehdä julkaistavaa juttua.",
    failed: "Jokin meni pieleen.",
    deleted: "Juttu on poistettu.",
    tryAgain: "Yritä uudelleen",
    newInterview: "Uusi haastattelu",
    reconnecting: "Yhteys katkesi, yritetään uudelleen…",
  },
  en: {
    title: "Get interviewed by AI",
    intro:
      "Pick a topic and give us your phone number. Teppo, GPT Newsroom's AI reporter, calls you within seconds, interviews you for a few minutes, and writes a story based on your answers that is published on this site.",
    phone: "Phone number",
    phoneHelp: "E.g. +358 40 123 4567. Your number is never published.",
    name: "Name in the story (optional)",
    nameHelp: "Leave empty to stay anonymous.",
    topic: "Pick a topic",
    topicsLoading: "Loading topics…",
    topicsError: "Couldn't load the topics. Please refresh in a moment.",
    language: "Interview language",
    consent:
      "I understand that the caller, Teppo, is an AI, the call is transcribed, and a story based on my answers will be published on GPT Newsroom.",
    submit: "Call me",
    starting: "Calling…",
    steps: {
      queued: "Starting the call…",
      ringing: "Your phone is ringing – pick up!",
      in_progress: "Interview in progress",
      writing: "Writing the story…",
      published: "Story published",
    },
    transcript: "Interview",
    reporter: "Teppo (AI)",
    you: "You",
    readArticle: "Read the story",
    published: "Your story has been published!",
    noAnswer: "You didn't answer the call.",
    busy: "The line was busy.",
    notPublished: "The interview could not be turned into a publishable story.",
    failed: "Something went wrong.",
    deleted: "The story has been removed.",
    tryAgain: "Try again",
    newInterview: "New interview",
    reconnecting: "Connection lost, retrying…",
  },
};

const STEP_ORDER: InterviewStatus[] = ["queued", "ringing", "in_progress", "writing", "published"];

export default function InterviewClient({ locale }: { locale: Locale }) {
  const t = locale === "fi" ? TEXT.fi : TEXT.en;

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [topicsFailed, setTopicsFailed] = useState(false);
  const [topicId, setTopicId] = useState("");
  const [language, setLanguage] = useState<"fi" | "en">(locale === "fi" ? "fi" : "en");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [interview, setInterview] = useState<Interview | null>(null);
  const [pollError, setPollError] = useState(false);
  const transcriptEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => setTopicsFailed(true));
  }, []);

  // Resume after a page refresh (?id=...)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      getInterview(id).then(setInterview).catch(() => undefined);
    }
  }, []);

  const interviewId = interview?.id;
  const isFinal = interview ? FINAL_STATUSES.includes(interview.status) : true;

  // Poll every 2 seconds until the interview reaches a final state
  useEffect(() => {
    if (!interviewId || isFinal) return;
    const timer = setInterval(async () => {
      try {
        setInterview(await getInterview(interviewId));
        setPollError(false);
      } catch {
        setPollError(true);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [interviewId, isFinal]);

  const transcriptLength = interview?.transcript.length ?? 0;
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [transcriptLength]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFormError(null);
      try {
        const created = await startInterview({
          phone_number: phone,
          topic_id: topicId,
          language,
          name: name.trim() || undefined,
        });
        setInterview(created);
        const url = new URL(window.location.href);
        url.searchParams.set("id", created.id);
        window.history.replaceState(null, "", url.toString());
      } catch (err) {
        setFormError(err instanceof Error ? err.message : String(err));
      } finally {
        setSubmitting(false);
      }
    },
    [phone, topicId, language, name]
  );

  const reset = useCallback(() => {
    setInterview(null);
    setConsent(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    window.history.replaceState(null, "", url.toString());
  }, []);

  // ------------------------------------------------------------------ form
  if (!interview) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.intro}>{t.intro}</p>

          <form onSubmit={onSubmit} className={styles.form}>
            <label className={styles.label}>
              {t.phone}
              <input
                className={styles.input}
                type="tel"
                required
                autoComplete="tel"
                placeholder="+358 40 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <span className={styles.help}>{t.phoneHelp}</span>
            </label>

            <label className={styles.label}>
              {t.name}
              <input
                className={styles.input}
                type="text"
                maxLength={60}
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span className={styles.help}>{t.nameHelp}</span>
            </label>

            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>{t.topic}</legend>
              {!topics && !topicsFailed && <p className={styles.help}>{t.topicsLoading}</p>}
              {topicsFailed && <p className={styles.error}>{t.topicsError}</p>}
              <div className={styles.topicList}>
                {(topics || []).map((topic) => {
                  const text = locale === "fi" ? topic.fi : topic.en;
                  return (
                    <label
                      key={topic.id}
                      className={`${styles.topicOption} ${topicId === topic.id ? styles.topicSelected : ""}`}
                    >
                      <input
                        type="radio"
                        name="topic"
                        value={topic.id}
                        required
                        checked={topicId === topic.id}
                        onChange={() => setTopicId(topic.id)}
                      />
                      <span>
                        <span className={styles.topicTitle}>{text.title}</span>
                        <span className={styles.topicQuestion}>{text.question}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>{t.language}</legend>
              <div className={styles.segmented}>
                {(["fi", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`${styles.segment} ${language === lang ? styles.segmentActive : ""}`}
                    onClick={() => setLanguage(lang)}
                    aria-pressed={language === lang}
                  >
                    {lang === "fi" ? "Suomi" : "English"}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className={styles.consent}>
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>{t.consent}</span>
            </label>

            {formError && <p className={styles.error}>{formError}</p>}

            <button className={styles.primary} type="submit" disabled={submitting || !consent || !topicId}>
              {submitting ? t.starting : t.submit}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ live / done
  const status = interview.status;
  const currentStep = STEP_ORDER.indexOf(status);
  const failureText: Partial<Record<InterviewStatus, string>> = {
    no_answer: t.noAnswer,
    busy: t.busy,
    not_published: t.notPublished,
    failed: t.failed,
    deleted: t.deleted,
  };
  const articleHref =
    status === "published" && interview.article_id && interview.headline
      ? createNewsUrl(interview.headline, interview.article_id, locale)
      : null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.topicLine}>{interview.topic}</p>

        {currentStep >= 0 && (
          <ol className={styles.steps}>
            {STEP_ORDER.map((step, i) => (
              <li
                key={step}
                className={`${styles.step} ${i < currentStep || status === "published" ? styles.stepDone : ""} ${
                  i === currentStep && status !== "published" ? styles.stepActive : ""
                }`}
              >
                <span className={styles.stepDot} />
                {t.steps[step as keyof typeof t.steps]}
              </li>
            ))}
          </ol>
        )}

        {pollError && !isFinal && <p className={styles.help}>{t.reconnecting}</p>}

        {articleHref && (
          <div className={styles.published}>
            <p className={styles.publishedTitle}>{t.published}</p>
            <h2 className={styles.headline}>{interview.headline}</h2>
            {interview.standfirst && <p className={styles.standfirst}>{interview.standfirst}</p>}
            <Link href={articleHref} className={styles.primary}>
              {t.readArticle} →
            </Link>
          </div>
        )}

        {failureText[status] && (
          <div className={styles.failure}>
            <p>{failureText[status]}</p>
            {interview.error && status !== "no_answer" && status !== "busy" && (
              <p className={styles.help}>{interview.error}</p>
            )}
          </div>
        )}

        {interview.transcript.length > 0 && (
          <section className={styles.transcript}>
            <h2 className={styles.sectionTitle}>{t.transcript}</h2>
            {interview.transcript.map((turn, i) => (
              <div
                key={i}
                className={`${styles.bubble} ${turn.speaker === "user" ? styles.bubbleUser : styles.bubbleAi}`}
              >
                <span className={styles.speaker}>{turn.speaker === "user" ? t.you : t.reporter}</span>
                {turn.text}
              </div>
            ))}
            <div ref={transcriptEnd} />
          </section>
        )}

        {isFinal && (
          <button className={styles.secondary} type="button" onClick={reset}>
            {status === "published" ? t.newInterview : t.tryAgain}
          </button>
        )}
      </div>
    </div>
  );
}
