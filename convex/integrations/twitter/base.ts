/**
 * Where the X data API lives.
 *
 * Hard-coded in five files until now, which meant using a different provider was an edit
 * in each of them. It is one setting instead: unset keeps the original endpoint, and a
 * self-hosted replacement only has to answer in the same shape.
 */
export const SOCIAL_API_BASE = (
  process.env.SOCIALAPI_BASE_URL?.replace(/\/$/, "") || "https://api.socialapi.me"
);
