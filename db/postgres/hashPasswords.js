/**
 * Run from repo root: node db/postgres/hashPasswords.js
 * Prints bcrypt hashes for password "energy123" (use when rotating seed passwords).
 */
import bcrypt from "bcryptjs";

const password = process.env.SEED_PASSWORD || "energy123";
const hash = bcrypt.hashSync(password, 10);
console.log("Password:", password);
console.log("Bcrypt hash:", hash);
console.log("\nUse this hash in seed.sql for all seeded users, or run UPDATE:");
console.log(
  `UPDATE users SET password_hash = '${hash}' WHERE email IN ('admin@energy.com','ravi@energy.com','priya@energy.com','demo@energy.com');`
);
