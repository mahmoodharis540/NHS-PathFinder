import { execSync } from "child_process";

export async function setup() {
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
    cwd: process.cwd(),
  });
}
