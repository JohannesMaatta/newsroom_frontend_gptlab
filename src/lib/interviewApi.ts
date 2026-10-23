// Client for the phone-interview service (runs next to the newsroom backend).
export const INTERVIEW_API_URL = (
  process.env.NEXT_PUBLIC_INTERVIEW_API_URL || "https://api.gptnewsroom.fi/interview"
).replace(/\/+$/, "");

const ACCESS_CODE = process.env.NEXT_PUBLIC_INTERVIEW_ACCESS_CODE || "";

export type InterviewStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "writing"
  | "published"
  | "not_published"
  | "failed"
  | "no_answer"
  | "busy"
  | "deleted";

export const FINAL_STATUSES: InterviewStatus[] = [
  "published",
  "not_published",
  "failed",
  "no_answer",
  "busy",
  "deleted",
];

export interface TopicText {
  title: string;
  question: string;
}

export interface Topic {
  id: string;
  fi: TopicText;
  en: TopicText;
}

export interface Interview {
  id: string;
  status: InterviewStatus;
  topic_id: string | null;
  topic: string;
  language: "fi" | "en";
  transcript: { speaker: "assistant" | "user"; text: string }[];
  article_id: number | null;
  headline: string | null;
  standfirst: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  // admin only
  phone_number?: string;
  name?: string | null;
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (ACCESS_CODE) h["X-Access-Code"] = ACCESS_CODE;
  return h;
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: unknown }).detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ")
      : typeof detail === "string"
        ? detail
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function getTopics(): Promise<Topic[]> {
  const res = await fetch(`${INTERVIEW_API_URL}/api/topics`, { headers: headers() });
  return (await parse<{ topics: Topic[] }>(res)).topics;
}

export async function startInterview(body: {
  phone_number: string;
  topic_id: string;
  language: "fi" | "en";
  name?: string;
}): Promise<Interview> {
  const res = await fetch(`${INTERVIEW_API_URL}/api/interviews`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  return parse<Interview>(res);
}

export async function getInterview(id: string): Promise<Interview> {
  const res = await fetch(`${INTERVIEW_API_URL}/api/interviews/${encodeURIComponent(id)}`, {
    headers: headers(),
    cache: "no-store",
  });
  return parse<Interview>(res);
}

export async function adminListInterviews(token: string): Promise<Interview[]> {
  const res = await fetch(`${INTERVIEW_API_URL}/api/admin/interviews`, {
    headers: headers({ "X-Admin-Token": token }),
    cache: "no-store",
  });
  return (await parse<{ interviews: Interview[] }>(res)).interviews;
}

export async function adminDeleteArticle(token: string, id: string): Promise<void> {
  const res = await fetch(
    `${INTERVIEW_API_URL}/api/admin/interviews/${encodeURIComponent(id)}/article`,
    { method: "DELETE", headers: headers({ "X-Admin-Token": token }) }
  );
  await parse(res);
}
