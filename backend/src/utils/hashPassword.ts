/**
 * Generates a bcrypt hash for a plaintext password.
 * Use this to create the ADMIN_PASSWORD_HASH value for your .env file.
 *
 * Usage:
 *   npx tsx src/utils/hashPassword.ts yourplaintextpassword
 *
 * Example:
 *   npx tsx src/utils/hashPassword.ts murali1996
 *
 * Copy the printed hash into .env as:
 *   ADMIN_PASSWORD_HASH=<printed hash>
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx src/utils/hashPassword.ts <plaintext-password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nAdd this to your .env file:");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
