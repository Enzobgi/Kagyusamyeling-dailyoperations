const {
  createSession,
  ensureSchema,
  hashPassword,
  normalizeEmail,
  sendJson,
  sql,
  verifyPassword
} = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { message: "Method not allowed." });
  }

  try {
    await ensureSchema();
    const { action, email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!["signin", "signup"].includes(action)) {
      return sendJson(res, 400, { message: "Unknown account action." });
    }
    if (!normalizedEmail || !String(password || "").trim()) {
      return sendJson(res, 400, { message: "Email and password are required." });
    }
    if (String(password).length < 8) {
      return sendJson(res, 400, { message: "Password must be at least 8 characters." });
    }

    if (action === "signup") {
      const existing = await sql()`select id from app_users where email = ${normalizedEmail} limit 1`;
      if (existing.length) {
        return sendJson(res, 409, { message: "An account already exists for this email." });
      }
      const rows = await sql()`
        insert into app_users (email, password_hash)
        values (${normalizedEmail}, ${hashPassword(password)})
        returning id, email
      `;
      const session = await createSession(rows[0].id);
      return sendJson(res, 200, { ...session, user: rows[0] });
    }

    const rows = await sql()`select id, email, password_hash from app_users where email = ${normalizedEmail} limit 1`;
    if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
      return sendJson(res, 401, { message: "Invalid email or password." });
    }

    const session = await createSession(rows[0].id);
    return sendJson(res, 200, { ...session, user: { id: rows[0].id, email: rows[0].email } });
  } catch (error) {
    return sendJson(res, 500, { message: error.message || "Account request failed." });
  }
};
