/** Whether Google OAuth env vars are configured */
export function isGoogleAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export const GOOGLE_OAUTH_CALLBACK =
  "https://noteflow-mu-three.vercel.app/api/auth/callback/google";

export const GOOGLE_OAUTH_ORIGINS = [
  "https://noteflow-mu-three.vercel.app",
  "http://localhost:3000",
] as const;