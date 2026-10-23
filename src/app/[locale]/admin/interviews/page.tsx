import type { Metadata } from "next";
import AdminInterviews from "@/components/interview/AdminInterviews";
import type { Locale } from "@/utils/newsUtils";

export const metadata: Metadata = {
  title: "Interview articles – admin",
  robots: { index: false, follow: false },
};

export default async function AdminInterviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AdminInterviews locale={locale as Locale} />;
}
