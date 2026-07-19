const { ensureSchema, getUserFromRequest, sendJson, sql } = require("./_db");

function normalizeData(data) {
  return {
    rooms: Array.isArray(data?.rooms) ? data.rooms : [],
    stays: Array.isArray(data?.stays) ? data.stays : []
  };
}

module.exports = async function handler(req, res) {
  if (!["GET", "PUT"].includes(req.method)) {
    return sendJson(res, 405, { message: "Method not allowed." });
  }

  try {
    await ensureSchema();
    const user = await getUserFromRequest(req);
    if (!user) {
      return sendJson(res, 401, { message: "Sign in required." });
    }

    if (req.method === "GET") {
      const rows = await sql()`select data, updated_at from room_data where user_id = ${user.id} limit 1`;
      return sendJson(res, 200, rows[0] || { data: null, updated_at: null });
    }

    const data = normalizeData((req.body || {}).data);
    const rows = await sql()`
      insert into room_data (user_id, data, updated_at)
      values (${user.id}, ${JSON.stringify(data)}, now())
      on conflict (user_id)
      do update set data = excluded.data, updated_at = now()
      returning data, updated_at
    `;
    return sendJson(res, 200, rows[0]);
  } catch (error) {
    return sendJson(res, 500, { message: error.message || "Data request failed." });
  }
};
