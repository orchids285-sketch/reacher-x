// convex/lib/planConstants.ts
// Pure constants and types for plan tier system
// Per AGENT_CONTEXT.txt: *Helpers.ts = config, constants, utilities
// This file breaks the circular dependency between planCore.ts and planHelpers.ts

import type { Id } from "../_generated/dataModel";

/**
 * Plan tier configuration
 * Free: internal unpaid fallback, no prospecting
 * Hobby: 100 prospects, 1 workspace
 * Base: 1000 prospects, 2 workspaces
 * Pro: unlimited prospects (-1), 5 workspaces
 */
const HOBBY_LIMITS = {
  prospectsLimit: 100,
  workspacesLimit: 1,
} as const;

export const PLAN_LIMITS = {
  free: {
    prospectsLimit: 0,
    workspacesLimit: 1,
  },
  hobby: HOBBY_LIMITS,
  base: {
    prospectsLimit: 1000,
    workspacesLimit: 2,
  },
  pro: {
    prospectsLimit: -1, // unlimited
    // Generous but finite, and deliberately not -1.
    //
    // -1 means "unlimited" for prospects only: two call sites test for it. Nothing tests
    // for it on workspaces, where the value is used as an actual bound -- `slot <= limit`,
    // `limit - used`, and a `used / limit` percentage. Setting -1 here would therefore not
    // unlock workspaces, it would forbid every one of them and report -100% usage.
    workspacesLimit: 100,
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

/**
 * The tier this deployment grants everybody.
 *
 * This tool is embedded in a product the customer already pays for, so it must not decide
 * for itself whether they may use it: entitlement was settled by the host before the frame
 * ever loaded. Leaving the default at "free" meant a paying customer opened the tool and
 * was met with an upgrade wall for a second subscription -- prospecting disabled, agent
 * paused, a price list where the work should be.
 *
 * Granting at the source rather than hiding the buttons matters: the limits are enforced
 * server-side too, so a hidden button would have left the feature broken instead of paid.
 */
export const GRANTED_PLAN_TIER: PlanTier = "pro";
export type PaidPlanTier = Exclude<PlanTier, "free">;

export const PAID_PLAN_TIERS = ["hobby", "base", "pro"] as const;

export const PLAN_TIER_LABELS = {
  free: "Plan required",
  hobby: "Hobby",
  base: "Base",
  pro: "Pro",
} as const satisfies Record<PlanTier, string>;

export function isPaidPlanTier(tier: PlanTier): tier is PaidPlanTier {
  return tier !== "free";
}

/**
 * Type for the plan object returned by helper functions.
 * Note: _id can be null for virtual plans in query context.
 */
export type UserPlan = {
  _id: Id<"userPlans"> | null;
  _creationTime: number;
  userId: Id<"users">;
  tier: PlanTier;
  prospectsLimit: number;
  workspacesLimit: number;
  currentProspectsCount: number;
  currentProspectsCycleStart?: number;
  currentProspectsCycleEnd?: number;
  currentWorkspacesCount: number;
  updatedAt: number;
  externalSubscriptionId?: string;
  polarCustomerId?: string;
  expiresAt?: number;
};
