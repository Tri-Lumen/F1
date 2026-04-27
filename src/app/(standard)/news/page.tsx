import type { Metadata } from "next";
import NewsClient from "./NewsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News — F1 2026",
  description: "Aggregated F1 news from multiple RSS feeds",
};

export default function NewsPage() {
  return <NewsClient />;
}
