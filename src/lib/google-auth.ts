/** Whether Google OAuth env vars are configured */
export function isGoogleAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

const DEFAULT_PRODUCTION_ORIGIN = "https://noteflow-kent.vercel.app";

function getProductionOrigin(): string {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, "") || DEFAULT_PRODUCTION_ORIGIN;
}

/** Reference constants for Google Cloud Console OAuth setup */
export const GOOGLE_OAUTH_CALLBACK = `${getProductionOrigin()}/api/auth/callback/google`;

export const GOOGLE_OAUTH_ORIGINS = [
  getProductionOrigin(),
  "http://localhost:3000",
] as const;