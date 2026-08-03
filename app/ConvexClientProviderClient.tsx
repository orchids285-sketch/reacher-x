"use client";

import { type ReactNode, useCallback } from "react";
import { ConvexProviderWithAuth } from "convex/react";
import {
  AuthKitProvider,
  useAccessToken,
  useAuth as useWorkosAuth,
} from "@workos-inc/authkit-nextjs/components";
import type { NoUserInfo, UserInfo } from "@workos-inc/authkit-nextjs";
import { convex } from "@/shared/lib/convex";
import { fetchHostToken, isEmbedded } from "@/shared/lib/hostAuth";

export type AuthKitInitialAuth = Omit<UserInfo | NoUserInfo, "accessToken">;

export function ConvexClientProviderClient({
  children,
  initialAuth,
}: {
  children: ReactNode;
  initialAuth: AuthKitInitialAuth;
}) {
  return (
    <AuthKitProvider initialAuth={initialAuth}>
      {/* Embedded, the host is the identity provider and there is no sign-in screen.
          Standalone, the original provider is untouched -- this fork stays usable on its
          own, which also means the swap can be reasoned about by reading one hook. */}
      <ConvexProviderWithAuth
        client={convex}
        useAuth={isEmbedded() ? useAuthFromHost : useAuthFromWorkos}
      >
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  );
}

/**
 * The embedded path: a token minted by the host for the user it already authenticated.
 *
 * `isAuthenticated` starts true because the host would not have opened this frame for a
 * user it did not know. Waiting for the first token instead would show a loading state on
 * every mount for a session that is already decided.
 */
function useAuthFromHost() {
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) =>
      await fetchHostToken(forceRefreshToken),
    []
  );
  return { isLoading: false, isAuthenticated: true, fetchAccessToken };
}

function useAuthFromWorkos() {
  const { user, loading: isLoading } = useWorkosAuth();
  const { refresh, getAccessToken } = useAccessToken();

  // Keep Convex's auth provider state tied to the stable WorkOS session only.
  // Token fetch/refresh loading is handled inside fetchAccessToken; exposing it
  // here makes Convex reset auth on every token refresh, which causes UI flicker.
  const loading = isLoading ?? false;
  const authenticated = !!user;

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const token = forceRefreshToken
          ? await refresh()
          : await getAccessToken();
        return token ?? null;
      } catch {
        return null;
      }
    },
    [getAccessToken, refresh]
  );

  return {
    isLoading: loading,
    isAuthenticated: authenticated,
    fetchAccessToken,
  };
}
