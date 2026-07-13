// Local stand-in for the real tenant-gateway (Better-Auth + /data/:table),
// used only for local dev against the Dockerized Postgres in docker-compose.yml.
// Auth is mocked (always logged in as the seeded dev user); `db.table()` reads
// and writes hit real Postgres, so the app itself needs zero changes.
import { createServer } from "node:http";
import pg from "pg";

const PORT = process.env.PORT ?? 8787;
const MOCK_ROLE = process.env.MOCK_ROLE ?? "admin";
const MOCK_USER = { id: "dev-admin", name: "Dev Admin", email: "admin@dev.local" };
const TABLE_NAME_RE = /^[a-z_][a-z0-9_]*$/;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://dev:dev@localhost:5432/compras_estoque",
});

async function tableColumns(table) {
  const { rows } = await pool.query(
    "select column_name from information_schema.columns where table_name = $1",
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

function withCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Tenant-Id");
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleData(req, res, method, parts) {
  const [table, id] = parts;
  if (!TABLE_NAME_RE.test(table)) return send(res, 400, { message: "Invalid table name." });
  const columns = await tableColumns(table);
  if (columns.size === 0) return send(res, 404, { message: `Unknown table "${table}".` });

  if (method === "GET") {
    const { rows } = await pool.query(`select * from "${table}" order by created_at desc`);
    return send(res, 200, rows);
  }

  if (method === "POST") {
    const body = (await readJson(req)) ?? {};
    if (columns.has("owner_id")) body.owner_id = MOCK_USER.id;
    const keys = Object.keys(body).filter((k) => columns.has(k));
    const values = keys.map((k) => body[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const cols = keys.map((k) => `"${k}"`).join(",");
    const { rows } = await pool.query(
      `insert into "${table}" (${cols}) values (${placeholders.join(",")}) returning *`,
      values,
    );
    return send(res, 200, rows[0]);
  }

  if (method === "PATCH") {
    const body = (await readJson(req)) ?? {};
    const keys = Object.keys(body).filter((k) => columns.has(k) && k !== "id");
    if (keys.length === 0) {
      const { rows } = await pool.query(`select * from "${table}" where id = $1`, [id]);
      return send(res, 200, rows[0] ?? null);
    }
    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(",");
    const values = keys.map((k) => body[k]);
    const { rows } = await pool.query(
      `update "${table}" set ${sets} where id = $${keys.length + 1} returning *`,
      [...values, id],
    );
    return send(res, 200, rows[0] ?? null);
  }

  if (method === "DELETE") {
    await pool.query(`delete from "${table}" where id = $1`, [id]);
    return send(res, 204);
  }

  return send(res, 405, { message: "Method not allowed." });
}

const server = createServer(async (req, res) => {
  withCors(req, res);
  if (req.method === "OPTIONS") return send(res, 204);

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (url.pathname === "/api/auth/get-session" && req.method === "GET") {
      return send(res, 200, { user: MOCK_USER, role: MOCK_ROLE });
    }
    if (
      req.method === "POST" &&
      (url.pathname === "/api/auth/sign-in/email" || url.pathname === "/api/auth/sign-up/email")
    ) {
      return send(res, 200, { user: MOCK_USER });
    }
    if (url.pathname === "/api/auth/sign-out" && req.method === "POST") {
      return send(res, 204);
    }
    if (parts[0] === "data" && parts.length >= 2) {
      return await handleData(req, res, req.method, parts.slice(1));
    }
    return send(res, 404, { message: "Not found." });
  } catch (err) {
    console.error(err);
    return send(res, 500, { message: err.message ?? "Internal error." });
  }
});

server.listen(PORT, () => {
  console.log(`Dev gateway (mocked auth, real Postgres) listening on http://localhost:${PORT}`);
});
