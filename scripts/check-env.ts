import "dotenv/config";
import { checkEnv } from "../src/lib/env";

const env = checkEnv();

console.log("=== NoteFlow 环境变量检查 ===\n");

if (env.valid) {
  console.log("✅ 所有必填环境变量已配置\n");
} else {
  console.log("❌ 缺少必填环境变量:\n");
  env.missing.forEach((m) => console.log(`   • ${m}`));
  console.log();
}

if (env.warnings.length > 0) {
  console.log("⚠️  警告:\n");
  env.warnings.forEach((w) => console.log(`   • ${w}`));
  console.log();
}

console.log("可选功能:\n");
env.optional.forEach(({ key, configured, description }) => {
  const icon = configured ? "✅" : "⬜";
  console.log(`   ${icon} ${key} — ${description}`);
});

console.log();
process.exit(env.valid ? 0 : 1);