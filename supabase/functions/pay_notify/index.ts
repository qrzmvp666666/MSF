import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import md5 from "https://esm.sh/blueimp-md5@2.19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function text(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function createSign(params: Record<string, string>, key: string) {
  const signSource = Object.keys(params)
    .filter((field) => field !== "sign" && field !== "sign_type" && params[field] !== "")
    .sort((a, b) => a.localeCompare(b))
    .map((field) => `${field}=${params[field]}`)
    .join("&");

  return md5(`${signSource}${key}`);
}

function isPaid(payload: Record<string, string>) {
  const explicitField = Deno.env.get("PAY_NOTIFY_STATUS_FIELD");
  const explicitValue = Deno.env.get("PAY_NOTIFY_SUCCESS_VALUE");
  if (explicitField && explicitValue) {
    return String(payload[explicitField] ?? "").toLowerCase() === explicitValue.toLowerCase();
  }

  const candidates = [
    payload.trade_status,
    payload.pay_status,
    payload.order_status,
    payload.status,
    payload.result,
    payload.return_code,
  ].filter(Boolean).map((value) => String(value).toLowerCase());

  return candidates.some((value) => ["trade_success", "success", "paid", "1", "ok"].includes(value));
}

function tryParseJson(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function extractMaterialId(value: unknown): string | null {
  const parsed = tryParseJson(value);
  if (!parsed) return null;

  const direct = parsed.material_id ?? parsed.materialId ?? parsed.source;
  return typeof direct === "string" && direct.trim() ? direct.trim().toLowerCase() : null;
}

async function parsePayload(req: Request) {
  if (req.method === "GET") {
    return Object.fromEntries(new URL(req.url).searchParams.entries());
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await req.json();
    return Object.fromEntries(Object.entries(data ?? {}).map(([key, value]) => [key, String(value ?? "")]));
  }

  const raw = await req.text();
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return text("ok");
  }

  if (!["GET", "POST"].includes(req.method)) {
    return text("method not allowed", 405);
  }

  const merchantKey = Deno.env.get("PAY_MERCHANT_KEY");
  const notifySuccessResponse = Deno.env.get("PAY_NOTIFY_RESPONSE_SUCCESS") ?? "success";
  const orderField = Deno.env.get("PAY_NOTIFY_ORDER_FIELD") ?? "out_trade_no";
  if (!merchantKey) {
    return text("merchant key missing", 500);
  }

  const payload = await parsePayload(req);
  const receivedSign = String(payload.sign ?? "").toLowerCase();
  const calculatedSign = createSign(payload, merchantKey);

  if (!receivedSign || receivedSign !== calculatedSign) {
    return text("invalid sign", 400);
  }

  const orderNo = payload[orderField] || payload.out_trade_no || payload.order_no;
  if (!orderNo) {
    return text("missing order_no", 400);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: order, error: orderError } = await supabase
    .from("purchase_records")
    .select("payment_status, remark, material_id")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (orderError) {
    return text("query order failed", 500);
  }

  if (!order) {
    return text("order not found", 404);
  }

  if (order.payment_status === "paid") {
    return text(notifySuccessResponse, 200);
  }

  const nextStatus = isPaid(payload) ? "paid" : "failed";
  const now = new Date().toISOString();
  const materialId = order.material_id ?? extractMaterialId(order.remark);

  const updatePayload: Record<string, string | null> = {
    payment_status: nextStatus,
    updated_at: now,
    material_id: materialId,
    remark: JSON.stringify({
      previous_remark: order.remark,
      material_id: materialId,
      notify_payload: payload,
      notified_at: now,
      notify_method: req.method,
    }),
  };

  if (nextStatus === "paid") {
    updatePayload.payment_time = now;
    updatePayload.completed_time = now;
  }

  const { error: updateError } = await supabase
    .from("purchase_records")
    .update(updatePayload)
    .eq("order_no", orderNo);

  if (updateError) {
    return text("update order failed", 500);
  }

  return text(notifySuccessResponse, 200);
});