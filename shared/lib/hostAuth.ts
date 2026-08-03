/**
 * Signing in from the host, with no sign-in screen.
 *
 * This build runs inside a product the user has already authenticated with, so it must
 * never ask them to make a second account. Convex verifies a signed token against a
 * published key, which means the invisible way in is for the host to *be* an identity
 * provider: it mints a token for the user it already knows and we present it.
 *
 * The token is deliberately short-lived, which is what makes one acceptable in a browser
 * at all — it is replaceable at any moment by asking again. So this caches it, refreshes
 * it before it expires rather than after, and asks again on demand when Convex says the
 * current one was rejected.
 *
 * Nothing here decides who the user is. The subject inside the token is derived by the
 * host from its own session; this side only carries it.
 */

const SKEW_MS = 60_000;

export type HostIdentity = { frUser: string; ticket: string };

type Cached = { token: string; expiresAt: number };

let cached: Cached | null = null;
let inFlight: Promise<string | null> | null = null;

const HOST_BACKEND = (process.env.NEXT_PUBLIC_FR_BACKEND ?? "").replace(/\/$/, "");

/** The host's identity for this frame, or null when opened directly. */
export function readHostIdentity(): HostIdentity | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const frUser = (params.get("fr_user") ?? "").trim();
  const ticket = (params.get("t") ?? "").trim();
  // "shared" and "anon" identify nobody, so there is no workspace to open.
  if (!frUser || frUser === "shared" || frUser === "anon") return null;
  return { frUser, ticket };
}

export function isEmbedded(): boolean {
  return readHostIdentity() !== null;
}

/**
 * A valid token, minting a new one only when the cached one is spent.
 *
 * Requests are de-duplicated: Convex asks several times in quick succession while a page
 * mounts, and without this each ask would be a separate round trip to the host — visible
 * as a slow first paint and a burst of identical requests in its logs.
 */
export async function fetchHostToken(force = false): Promise<string | null> {
  const identity = readHostIdentity();
  if (!identity || !HOST_BACKEND) return null;

  if (!force && cached && Date.now() < cached.expiresAt - SKEW_MS) {
    return cached.token;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const url =
        `${HOST_BACKEND}/api/reacherx/user-session` +
        `?fr_user=${encodeURIComponent(identity.frUser)}` +
        (identity.ticket ? `&t=${encodeURIComponent(identity.ticket)}` : "");
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) return null;
      const body = (await response.json()) as {
        ok?: boolean;
        token?: string;
        expires_in?: number;
      };
      if (!body?.ok || !body.token) return null;
      cached = {
        token: body.token,
        expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
      };
      return cached.token;
    } catch {
      // An unreachable host is a signed-out frame, not a crash.
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function clearHostToken(): void {
  cached = null;
}
