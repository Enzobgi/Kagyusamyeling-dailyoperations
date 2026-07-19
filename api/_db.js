const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

let sqlClient = null;
let schemaReady = false;

function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

async function ensureSchema() {
  if (schemaReady) return;
  const db = sql();
  await db`create extension if not exists pgcrypto`;
  await db`
    create table if not exists app_users (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    )
  `;
  await db`
    create table if not exists app_sessions (
      token_hash text primary key,
      user_id uuid not null references app_users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `;
  await db`
    create table if not exists room_data (
      user_id uuid primary key references app_users(id) on delete cascade,
      data jsonb not null default '{"rooms":[],"stays":[]}'::jsonb,
      updated_at timestamptz not null default now()
    )
  `;
  schemaReady = true;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex"), iterations = 120000) {
  const hash = crypto.pbkdf2Sync(String(password), salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [scheme, iterations, salt, hash] = String(storedHash || "").split("$");
  if (scheme !== "pbkdf2_sha256" || !iterations || !salt || !hash) return false;
  const candidate = hashPassword(password, salt, Number(iterations)).split("$")[3];
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

async function createSession(userId) {
  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  await sql()`insert into app_sessions (token_hash, user_id, expires_at) values (${tokenHash}, ${userId}, ${expiresAt})`;
  return { token, expires_at: expiresAt };
}

async function getUserFromRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  await ensureSchema();
  const rows = await sql()`
    select app_users.id, app_users.email
    from app_sessions
    join app_users on app_users.id = app_sessions.user_id
    where app_sessions.token_hash = ${hashToken(token)}
      and app_sessions.expires_at > now()
    limit 1
  `;
  return rows[0] || null;
}

function sendJson(res, status, payload) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(payload);
}

module.exports = {
  createSession,
  ensureSchema,
  getUserFromRequest,
  hashPassword,
  hashToken,
  normalizeEmail,
  sendJson,
  sql,
  verifyPassword
};
