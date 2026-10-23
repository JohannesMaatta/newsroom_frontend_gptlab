import type { Metadata } from "next";
import InterviewClient from "@/components/interview/InterviewClient";
import type { Locale } from "@/utils/newsUtils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return locale === "fi"
    ? {
        title: "Tekoäly haastattelee sinua – GPT Newsroom",
        description: "Tekoälytoimittaja soittaa sinulle, haastattelee sinua ja julkaisee jutun vastaustesi pohjalta.",
      }
    : {
        title: "Get interviewed by AI – GPT Newsroom",
        description: "An AI reporter calls you, interviews you and publishes a story based on your answers.",
      };
}

export default async function InterviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <InterviewClient locale={locale as Locale} />;
}
