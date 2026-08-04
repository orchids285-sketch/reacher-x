// app/sitemap.ts
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { MetadataRoute } from "next";

// Overridable, because a sitemap hard-coded to somebody else's domain advertises their
// site rather than this deployment.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://foundreach.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/threads`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return baseEntries;
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    const threadIds = (await convex.query(
      api.publicSocial.listPublicThreadIds,
      {}
    )) as string[];

    const threadUrls = threadIds.map((id) => ({
      url: `${BASE_URL}/threads/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    return [...baseEntries, ...threadUrls];
  } catch {
    return baseEntries;
  }
}
