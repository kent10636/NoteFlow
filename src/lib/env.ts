/** Environment variable definitions and validation */

export interface EnvStatus {
  valid: boolean;
  missing: string[];
  warnings: string[];
  optional: { key: string; configured: boolean; description: string }[];
}

const REQUIRED_VARS = [
  { key: "DATABASE_URL", description: "PostgreSQL 数据库连接" },
  { key: "NEXTAUTH_URL", description: "应用公开 URL" },
] as const;

const OPTIONAL_VARS = [
  { key: "XAI_API_KEY", description: "Grok AI 完整功能" },
  { key: "GOOGLE_CLIENT_ID", description: "Google 登录" },
  { key: "GOOGLE_CLIENT_SECRET", description: "Google 登录" },
] as const;

/** Validate required and optional environment variables */
export function checkEnv(): EnvStatus {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const { key, description } of REQUIRED_VARS) {
    if (!process.env[key]?.trim()) {
      missing.push(`${key} — ${description}`);
    }
  }

  // AUTH_SECRET and NEXTAUTH_SECRET are interchangeable in NextAuth v5
  if (
    !process.env.AUTH_SECRET?.trim() &&
    !process.env.NEXTAUTH_SECRET?.trim()
  ) {
    missing.push("AUTH_SECRET — NextAuth 加密密钥（或 NEXTAUTH_SECRET）");
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.NEXTAUTH_URL?.startsWith("https://")) {
      warnings.push("生产环境 NEXTAUTH_URL 应使用 https://");
    }
    if (!process.env.XAI_API_KEY?.trim()) {
      warnings.push("未配置 XAI_API_KEY，AI 功能将使用本地回退");
    }
  }

  const optional = OPTIONAL_VARS.map(({ key, description }) => ({
    key,
    configured: !!process.env[key]?.trim(),
    description,
  }));

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    optional,
  };
}

/** Quick check for database connectivity readiness */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL?.trim();
}