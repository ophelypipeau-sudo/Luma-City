import { createRemoteJWKSet, jwtVerify } from "jose";

export function createNeonPlayerAuth(baseUrl: string, jwksUrl: string) {
  const issuer = new URL(baseUrl).origin;
  const jwks = createRemoteJWKSet(new URL(jwksUrl));
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    async verify(header?: string) {
      const token = /^Bearer (\S+)$/.exec(header ?? "")?.[1];
      if (!token) return null;
      try {
        const { payload } = await jwtVerify(token, jwks, {
          issuer, audience: issuer, algorithms: ["EdDSA"], requiredClaims: ["sub", "exp"],
        });
        return payload.sub && payload.exp ? { id: payload.sub, expires: payload.exp * 1000 } : null;
      } catch {
        return null;
      }
    },
  };
}
