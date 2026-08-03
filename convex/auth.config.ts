const clientId = process.env.WORKOS_CLIENT_ID;

// The host application, when this runs embedded inside one. It signs identities with its
// own key and publishes the public half, so Convex verifies them without ever asking it
// anything. Unset means the list below is unchanged.
const hostIssuer = process.env.HOST_JWT_ISSUER?.replace(/\/$/, "");
const hostAudience = process.env.HOST_JWT_AUDIENCE ?? "reacherx";

const hostProvider = hostIssuer
  ? [
      {
        type: "customJwt" as const,
        issuer: `${hostIssuer}/`,
        algorithm: "RS256" as const,
        jwks: `${hostIssuer}/.well-known/jwks.json`,
        applicationID: hostAudience,
      },
    ]
  : [];

const authConfig = {
  providers: [
    ...hostProvider,
    {
      type: "customJwt",
      issuer: `https://api.workos.com/`,
      algorithm: "RS256",
      applicationID: clientId,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
    {
      type: "customJwt",
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
  ],
};

export default authConfig;
