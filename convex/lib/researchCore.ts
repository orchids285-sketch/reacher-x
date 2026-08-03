"use node";

/**
 * Deep research core (Layer 3) built on Exa.
 *
 * Runs neural web searches with content extraction so the △ Agent can
 * research prospects and companies before generating or refining plans.
 */

import Exa from "exa-js";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { acquireExaApiBudget } from "./exaApiBudget";
import {
  EXA_CONTENT_COST_PER_PAGE_USD,
  EXA_SEARCH_COST_PER_REQUEST_USD,
  trackProviderRequest,
} from "./providerReliability";
import { describeUrlWithHtmlFallback } from "../../shared/lib/urls/describeUrl";

const MAX_QUERIES = 4;
const RESULTS_PER_QUERY = 4;
const SNIPPET_MAX_CHARS = 1200;

let exaClient: Exa | null = null;

function getExaClient(): Exa {
  if (!exaClient) {
    // A replacement may authenticate with a shared token instead, so a key is only
    // strictly required when talking to the original service.
    const apiKey = process.env.EXA_API_KEY?.trim() || process.env.FR_SHIM_TOKEN?.trim();
    if (!apiKey) {
      throw new Error(
        "EXA_API_KEY is not configured. Set it via `npx convex env set`."
      );
    }
    // A base url so this can speak to a replacement that answers in the same shape.
    // Unset means the original service, unchanged.
    const baseUrl = process.env.EXA_BASE_URL?.trim().replace(/\/$/, "");
    exaClient = baseUrl ? new Exa(apiKey, baseUrl) : new Exa(apiKey);
  }
  return exaClient;
}

export interface ResearchFinding {
  title: string;
  url: string;
  publishedDate?: string;
  snippet: string;
}

export interface ResearchQueryOutcome {
  query: string;
  findings: ResearchFinding[];
  error?: string;
}

export interface WebPageReadOutcome {
  url: string;
  title: string;
  snippet: string;
  author?: string;
  error?: string;
}

export type ResearchProviderContext = {
  ctx: ActionCtx;
  consumer: string;
  workspaceId?: Id<"workspaces">;
  prospectId?: Id<"prospects">;
  autoPlanRunId?: Id<"autoPlanRuns">;
};

/** Read clean page text directly from known URLs already stored on a profile. */
export async function readWebPages(
  urls: string[],
  providerContext: ResearchProviderContext
): Promise<WebPageReadOutcome[]> {
  const limitedUrls = [
    ...new Set(urls.flatMap((url) => (url.trim() ? [url.trim()] : []))),
  ].slice(0, 2);

  if (limitedUrls.length === 0) {
    return [];
  }
  const exa = getExaClient();

  try {
    const response = await trackProviderRequest({
      ctx: providerContext.ctx,
      provider: "exa",
      request: {
        consumer: providerContext.consumer,
        endpoint: "/contents",
        workspaceId: providerContext.workspaceId,
        prospectId: providerContext.prospectId,
        autoPlanRunId: providerContext.autoPlanRunId,
      },
      execute: async () => {
        await acquireExaApiBudget(
          providerContext.ctx,
          providerContext.consumer
        );
        return await exa.getContents(limitedUrls, {
          text: { maxCharacters: SNIPPET_MAX_CHARS },
        });
      },
      estimateUsage: (result) => {
        const billableUnits = result.results?.length ?? 0;
        return {
          billableUnits,
          estimatedCostUsd: billableUnits * EXA_CONTENT_COST_PER_PAGE_USD,
        };
      },
    });

    const resultsByUrl = new Map(
      (response.results ?? []).map((result) => [result.url, result])
    );

    return await Promise.all(
      limitedUrls.map(async (url) => {
        const result = resultsByUrl.get(url);
        const snippet = (result?.text ?? "").replace(/\s+/g, " ").trim();
        if (snippet) {
          return {
            url,
            title: result?.title?.trim() || url,
            snippet,
            author: result?.author?.trim() || undefined,
          };
        }

        const fallback = await describeUrlWithHtmlFallback(url);
        return fallback.success
          ? {
              url,
              title: fallback.title?.trim() || url,
              snippet: fallback.content,
              author: fallback.author,
            }
          : {
              url,
              title: url,
              snippet: "",
              error: fallback.error,
            };
      })
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Website read failed";
    return await Promise.all(
      limitedUrls.map(async (url) => {
        const fallback = await describeUrlWithHtmlFallback(url);
        return fallback.success
          ? {
              url,
              title: fallback.title?.trim() || url,
              snippet: fallback.content,
              author: fallback.author,
            }
          : {
              url,
              title: url,
              snippet: "",
              error: `${errorMessage}; ${fallback.error}`,
            };
      })
    );
  }
}

/**
 * Run up to MAX_QUERIES Exa searches in parallel, each returning extracted
 * page text. A failing query degrades to an error entry instead of failing
 * the whole batch.
 */
export async function runDeepResearch(
  queries: string[],
  providerContext: ResearchProviderContext
): Promise<ResearchQueryOutcome[]> {
  const exa = getExaClient();
  const limited = queries
    .map((query) => query.trim())
    .filter(Boolean)
    .slice(0, MAX_QUERIES);

  const outcomes: ResearchQueryOutcome[] = [];
  for (const query of limited) {
    try {
      const response = await trackProviderRequest({
        ctx: providerContext.ctx,
        provider: "exa",
        request: {
          consumer: providerContext.consumer,
          endpoint: "/search",
          workspaceId: providerContext.workspaceId,
          prospectId: providerContext.prospectId,
          autoPlanRunId: providerContext.autoPlanRunId,
        },
        execute: async () => {
          await acquireExaApiBudget(
            providerContext.ctx,
            providerContext.consumer
          );
          return await exa.search(query, {
            type: "auto",
            numResults: RESULTS_PER_QUERY,
            contents: {
              text: { maxCharacters: SNIPPET_MAX_CHARS },
            },
          });
        },
        estimateUsage: (result) => {
          const billableUnits = result.results?.length ?? 0;
          return {
            billableUnits,
            estimatedCostUsd:
              EXA_SEARCH_COST_PER_REQUEST_USD +
              billableUnits * EXA_CONTENT_COST_PER_PAGE_USD,
          };
        },
      });

      const findings: ResearchFinding[] = (response.results ?? []).map(
        (result) => ({
          title: result.title?.trim() || result.url,
          url: result.url,
          publishedDate: result.publishedDate ?? undefined,
          snippet: (result.text ?? "").replace(/\s+/g, " ").trim(),
        })
      );

      outcomes.push({ query, findings });
    } catch (error) {
      outcomes.push({
        query,
        findings: [],
        error: error instanceof Error ? error.message : "Search failed",
      });
      break;
    }
  }
  return outcomes;
}
