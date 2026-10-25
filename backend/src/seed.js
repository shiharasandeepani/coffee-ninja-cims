import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "./db.js";

const users = [
  { email: "alice@coffeeninja.test", name: "Alice Perera", role: "staff" },
  { email: "bob@coffeeninja.test", name: "Bob Silva", role: "staff" },
  { email: "admin@coffeeninja.test", name: "Admin", role: "admin" },
];

const PASSWORD = "password123";
const hash = await bcrypt.hash(PASSWORD, 10);

for (const u of users) {
  await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [u.email, hash, u.name, u.role]
  );
}

console.log("Seeded users");
await pool.end();