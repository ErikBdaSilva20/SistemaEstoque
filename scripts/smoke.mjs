#!/usr/bin/env node
/**
 * Smoke test end-to-end do Compras & Estoque.
 *
 * Roda contra o Supabase do cliente. Valida:
 *   1. Schema — todas as tabelas existem e respondem
 *   2. Auth — login + sessão válida
 *   3. CRUD direto via supabase-js (RLS como cliente logado)
 *   4. Edge functions — cada uma responde com schema correto
 *   5. Triggers/RPC — recalc_stock, next_purchase_order_code, close_count_session
 *   6. Integrações — listagem (se configuradas, roda teste)
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_ANON_KEY=eyJ... \
 *   TEST_EMAIL=admin@seudominio.com \
 *   TEST_PASSWORD='senha123' \
 *   node scripts/smoke.mjs
 *
 * Ou com .env (criar .env.test):
 *   node --env-file=.env.test scripts/smoke.mjs
 */

import { createClient } from "@supabase/supabase-js";

// =================== ARGS ===================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "❌ Faltam SUPABASE_URL e SUPABASE_ANON_KEY no ambiente.\n\n" +
      "Dica: pegue em Supabase Dashboard > Project Settings > API.",
  );
  process.exit(1);
}
if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error(
    "❌ Faltam TEST_EMAIL e TEST_PASSWORD no ambiente.\n\n" +
      "Use credenciais de um usuário admin já aprovado.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// =================== UTILS ===================
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const results = [];

function section(title) {
  console.log(`\n${C.bold}${C.cyan}━━━ ${title} ━━━${C.reset}`);
}

async function check(name, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - started;
    if (result === "skipped") {
      console.log(`  ${C.yellow}○${C.reset} ${name} ${C.gray}(skipped)${C.reset}`);
      results.push({ name, status: "skipped", elapsed });
    } else {
      console.log(
        `  ${C.green}✓${C.reset} ${name} ${C.gray}(${elapsed}ms)${C.reset}` +
          (typeof result === "string" ? ` ${C.dim}${result}${C.reset}` : ""),
      );
      results.push({ name, status: "ok", elapsed });
    }
  } catch (e) {
    const elapsed = Date.now() - started;
    console.log(
      `  ${C.red}✗${C.reset} ${name} ${C.gray}(${elapsed}ms)${C.reset}\n    ${C.red}${e.message}${C.reset}`,
    );
    results.push({ name, status: "fail", elapsed, error: e.message });
  }
}

// =================== CHECKS ===================

async function run() {
  console.log(`${C.bold}Smoke test — Compras & Estoque${C.reset}`);
  console.log(`${C.dim}Target: ${SUPABASE_URL}${C.reset}`);
  console.log(`${C.dim}User:   ${TEST_EMAIL}${C.reset}`);

  // ===== AUTH =====
  section("Autenticação");

  let userId;
  let userRole;

  await check("signInWithPassword", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Sessão não criada");
    userId = data.user.id;
    return `user_id=${userId.slice(0, 8)}...`;
  });

  await check("profile existe", async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, is_approved, is_active")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("profile não encontrado");
    if (!data.is_active) throw new Error("usuário inativo");
    if (!data.is_approved) throw new Error("usuário não aprovado");
    return data.full_name;
  });

  await check("user_roles — é admin", async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Sem role atribuída");
    userRole = data.role;
    if (data.role !== "admin") {
      throw new Error(
        `Role é ${data.role} (testes de admin serão skipped; use um usuário admin pra cobertura total)`,
      );
    }
    return data.role;
  });

  // ===== SCHEMA =====
  section("Schema (tabelas + views)");

  const tables = [
    "profiles",
    "user_roles",
    "project_config",
    "api_keys",
    "integrations",
    "suppliers",
    "products",
    "stock_movements",
    "purchase_orders",
    "purchase_order_items",
    "webhook_events",
    "ai_audit_log",
    "notification_log",
    "locations",
    "product_batches",
    "stock_by_location",
    "count_sessions",
    "count_items",
    "external_product_mappings",
  ];

  for (const t of tables) {
    await check(`SELECT ${t}`, async () => {
      const { error, count } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (error) throw new Error(`${error.code ?? ""} ${error.message}`);
      return `${count ?? 0} linhas`;
    });
  }

  await check("VIEW v_expiring_batches", async () => {
    const { error } = await supabase.from("v_expiring_batches").select("batch_id").limit(1);
    if (error) throw new Error(error.message);
  });

  // ===== RPC =====
  section("RPC (Postgres functions)");

  await check("RPC next_purchase_order_code", async () => {
    const { data, error } = await supabase.rpc("next_purchase_order_code");
    if (error) throw new Error(error.message);
    if (!data?.startsWith("PO-")) throw new Error(`Código inesperado: ${data}`);
    return data;
  });

  await check("RPC has_role(admin)", async () => {
    if (!userId) return "skipped";
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    if (typeof data !== "boolean") throw new Error("retorno inesperado");
    return String(data);
  });

  // ===== CRUD =====
  section("CRUD (via Supabase client, RLS aplicado)");

  let supplierId;
  const supplierName = `SmokeTest Supplier ${Date.now()}`;
  const canWrite = !!userId;

  await check("suppliers INSERT", async () => {
    if (!canWrite) return "skipped";
    const { data, error } = await supabase
      .from("suppliers")
      .insert({ name: supplierName, lead_time_days: 5, is_active: true })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    supplierId = data.id;
  });

  await check("suppliers UPDATE", async () => {
    if (!supplierId) return "skipped";
    const { error } = await supabase
      .from("suppliers")
      .update({ lead_time_days: 7 })
      .eq("id", supplierId);
    if (error) throw new Error(error.message);
  });

  let productId;
  const productSku = `SMOKE-${Date.now()}`;

  await check("products INSERT", async () => {
    if (!canWrite || !supplierId) return "skipped";
    const { data, error } = await supabase
      .from("products")
      .insert({
        sku: productSku,
        name: "Produto Smoke Test",
        unit: "un",
        cost: 10,
        price: 20,
        min_stock: 5,
        supplier_id: supplierId,
      })
      .select("id, current_stock")
      .single();
    if (error) throw new Error(error.message);
    productId = data.id;
    if (Number(data.current_stock) !== 0) {
      throw new Error(`current_stock inicial deveria ser 0, foi ${data.current_stock}`);
    }
  });

  await check("stock_movements INSERT (+ trigger recalc_stock)", async () => {
    if (!productId) return "skipped";
    const { error } = await supabase.from("stock_movements").insert({
      product_id: productId,
      type: "in",
      quantity: 10,
      origin: "manual",
      reason: "Smoke test",
    });
    if (error) throw new Error(error.message);
    const { data: p } = await supabase
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .single();
    if (Number(p.current_stock) !== 10) {
      throw new Error(`Trigger não atualizou estoque. Esperado 10, atual ${p.current_stock}`);
    }
    return "estoque = 10";
  });

  await check("stock_by_location preenchido pelo trigger", async () => {
    if (!productId) return "skipped";
    const { data, error } = await supabase
      .from("stock_by_location")
      .select("quantity")
      .eq("product_id", productId);
    if (error) throw new Error(error.message);
    const total = (data ?? []).reduce((a, r) => a + Number(r.quantity), 0);
    if (total !== 10) throw new Error(`total stock_by_location=${total}, esperado 10`);
  });

  await check("cleanup (movements + product + supplier)", async () => {
    if (productId) {
      await supabase.from("stock_movements").delete().eq("product_id", productId);
      await supabase.from("stock_by_location").delete().eq("product_id", productId);
      await supabase.from("products").delete().eq("id", productId);
    }
    if (supplierId) await supabase.from("suppliers").delete().eq("id", supplierId);
  });

  // ===== EDGE FUNCTIONS =====
  section("Edge Functions");

  const isAdmin = userRole === "admin";

  await check("admin-audit: list ai", async () => {
    if (!isAdmin) return "skipped";
    const { data, error } = await supabase.functions.invoke("admin-audit", {
      body: { action: "list", kind: "ai", limit: 1 },
    });
    if (error) throw new Error(error.message);
    if (!Array.isArray(data?.rows)) throw new Error("rows não é array");
  });

  await check("admin-integrations: list", async () => {
    if (!isAdmin) return "skipped";
    const { data, error } = await supabase.functions.invoke("admin-integrations", {
      body: { action: "list" },
    });
    if (error) throw new Error(error.message);
    if (!Array.isArray(data?.integrations)) throw new Error("integrations não é array");
    return `${data.integrations.length} integrações configuradas`;
  });

  await check("admin-api-keys: list", async () => {
    if (!isAdmin) return "skipped";
    const { data, error } = await supabase.functions.invoke("admin-api-keys", {
      body: { action: "list" },
    });
    if (error) throw new Error(error.message);
    if (!Array.isArray(data?.keys)) throw new Error("keys não é array");
    const keys = data.keys.map((k) => k.provider).join(", ");
    return keys || "nenhuma chave cadastrada";
  });

  let hasAnthropicKey = false;
  await check("api_keys — Anthropic disponível?", async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("provider, is_valid")
      .eq("provider", "anthropic")
      .maybeSingle();
    if (!data) return "nenhuma chave Anthropic (AI vai dar skipped)";
    hasAnthropicKey = data.is_valid;
    return data.is_valid ? "válida" : "inválida (AI vai dar skipped)";
  });

  await check("ai-chat: ping simples", async () => {
    if (!hasAnthropicKey) return "skipped";
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: {
        messages: [{ role: "user", content: "Qual o valor total do meu estoque?" }],
      },
    });
    if (error) throw new Error(error.message);
    if (typeof data?.reply !== "string" || data.reply.length < 5) throw new Error("reply inválido");
    return `${data.tools_used ?? 0} tools · ${data.reply.slice(0, 60).replace(/\n/g, " ")}...`;
  });

  await check("ai-suggest-reorder: roda sem erro", async () => {
    if (!hasAnthropicKey) return "skipped";
    const { data, error } = await supabase.functions.invoke("ai-suggest-reorder", { body: {} });
    if (error) throw new Error(error.message);
    if (typeof data?.summary !== "string") throw new Error("summary inválido");
    return `${data.suggestions?.length ?? 0} sugestões`;
  });

  // ===== INTEGRAÇÕES (leitura apenas; testes reais ficam no UI) =====
  section("Integrações configuradas");

  await check("lista integrações ativas", async () => {
    if (!isAdmin) return "skipped";
    const { data } = await supabase.from("integrations").select("type, is_active");
    const active = (data ?? [])
      .filter((i) => i.is_active)
      .map((i) => i.type)
      .join(", ");
    return active || "nenhuma ativa";
  });

  // ===== RESUMO =====
  const ok = results.filter((r) => r.status === "ok").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  console.log(
    `\n${C.bold}Resumo:${C.reset} ${C.green}${ok} ok${C.reset} · ${C.red}${fail} fail${C.reset} · ${C.yellow}${skipped} skipped${C.reset}`,
  );

  await supabase.auth.signOut();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(`\n${C.red}${C.bold}Erro fatal:${C.reset} ${e.message}`);
  process.exit(2);
});
