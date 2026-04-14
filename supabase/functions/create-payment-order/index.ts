import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import md5 from "https://esm.sh/blueimp-md5@2.19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateOrderBody = {
  phone?: string;
  planId?: number;
  source?: string;
  materialId?: string;
  material_id?: string;
  paymentMethod?: string;
  device?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 11 && digits.startsWith("86") ? digits.slice(-11) : digits.slice(0, 11);
}

function normalizeSource(value: string) {
  const normalized = value.trim();
  return /^[A-Za-z0-9:_-]{1,128}$/.test(normalized) ? normalized : "";
}

function normalizeMaterialId(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)
    ? normalized
    : "";
}

function normalizePaymentMethod(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["alipay", "ali", "alipayh5"].includes(normalized)) {
    return { gatewayType: "alipay", internalMethod: "alipay" as const };
  }

  if (["wechat", "wx", "wxpay", "wechatpay"].includes(normalized)) {
    return { gatewayType: "wxpay", internalMethod: "wechat" as const };
  }

  return null;
}

function normalizeDevice(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized || "jump";
}

function appendQueryParam(url: string, key: string, value: string) {
  if (!value) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
}

function createSign(params: Record<string, string>, key: string) {
  const signSource = Object.keys(params)
    .filter((field) => field !== "sign" && field !== "sign_type" && params[field] !== "")
    .sort((a, b) => a.localeCompare(b))
    .map((field) => `${field}=${params[field]}`)
    .join("&");

  return md5(`${signSource}${key}`);
}

function getPayUrl(payload: any) {
  return payload?.payurl
    ?? payload?.payUrl
    ?? payload?.url
    ?? payload?.data?.payurl
    ?? payload?.data?.payUrl
    ?? payload?.data?.url
    ?? null;
}

function getGatewayMessage(payload: any) {
  return payload?.msg ?? payload?.message ?? payload?.data?.msg ?? payload?.error ?? "支付网关未返回支付链接";
}

function isGatewayBusinessSuccess(payload: any, payUrl: string | null) {
  if (payUrl) {
    return true;
  }

  const code = payload?.code;
  const status = String(payload?.status ?? payload?.trade_status ?? "").toLowerCase();
  return code === 1 || code === "1" || status === "success" || status === "ok";
}

function getRequestOrigin(req: Request) {
  const origin = req.headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/$/, "");

  const referer = req.headers.get("referer")?.trim();
  if (!referer) return "";

  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

function getRefererUrl(req: Request) {
  const referer = req.headers.get("referer")?.trim();
  if (!referer) return null;

  try {
    return new URL(referer);
  } catch {
    return null;
  }
}

function getNotifyUrl(supabaseUrl: string) {
  const configured = Deno.env.get("PAY_NOTIFY_URL")?.trim();
  if (configured) return configured;
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/pay_notify`;
}

function getReturnUrl(req: Request) {
  const configured = Deno.env.get("PAY_RETURN_URL")?.trim();
  if (configured) return configured;

  const origin = getRequestOrigin(req);
  if (origin) return `${origin}/payment-result`;

  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const payApiUrl = Deno.env.get("PAY_API_URL");
  const merchantId = Deno.env.get("PAY_MERCHANT_ID");
  const merchantKey = Deno.env.get("PAY_MERCHANT_KEY");
  const clientIp = Deno.env.get("PAY_CLIENT_IP") ?? "192.168.1.100";

  if (!payApiUrl || !merchantId || !merchantKey) {
    return json({ error: "支付环境变量未配置完整" }, 500);
  }

  const notifyUrl = getNotifyUrl(supabaseUrl);
  const returnUrl = getReturnUrl(req);
  if (!returnUrl) {
    return json({ error: "缺少返回地址，需配置 PAY_RETURN_URL 或从请求来源自动推导" }, 500);
  }

  let body: CreateOrderBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "请求体格式错误" }, 400);
  }

  const refererUrl = getRefererUrl(req);
  const phone = normalizePhone(body.phone ?? "");
  const planId = Number(body.planId);
  const source = normalizeSource(
    String(body.source ?? refererUrl?.searchParams.get("source") ?? ""),
  );
  const materialId = normalizeMaterialId(
    String(
      body.materialId
        ?? body.material_id
        ?? refererUrl?.searchParams.get("material_id")
        ?? refererUrl?.searchParams.get("materialId")
        ?? source,
    ),
  );
  const paymentMethod = normalizePaymentMethod(String(body.paymentMethod ?? "wechat"));
  const device = normalizeDevice(String(body.device ?? "jump"));

  if (!/^1\d{10}$/.test(phone)) {
    return json({ error: "手机号格式错误" }, 400);
  }

  if (!Number.isFinite(planId)) {
    return json({ error: "套餐参数错误" }, 400);
  }

  if (!paymentMethod) {
    return json({ error: "支付方式错误，仅支持 alipay 或 wechat" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  if (materialId) {
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("id")
      .eq("id", materialId)
      .maybeSingle();

    if (materialError) {
      return json({ error: "查询资料失败", detail: materialError.message }, 500);
    }

    if (!material) {
      return json({ error: "资料不存在或已下架" }, 404);
    }
  }

  const { data: users, error: userLookupError } = await supabase.rpc("find_auth_user_by_phone", {
    p_phone: phone,
  });

  if (userLookupError) {
    return json({ error: "查询用户失败", detail: userLookupError.message }, 500);
  }

  const authUserId = users?.[0]?.auth_user_id as string | undefined;
  if (!authUserId) {
    return json({ error: "未找到绑定该手机号的用户" }, 404);
  }

  const { data: plan, error: planError } = await supabase
    .from("membership_plans")
    .select("id, name, price, is_active")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (planError) {
    return json({ error: "查询套餐失败", detail: planError.message }, 500);
  }

  if (!plan) {
    return json({ error: "套餐不存在或已关闭" }, 404);
  }

  const orderNo = `H5${Date.now()}${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
  const amount = Number(plan.price).toFixed(2);
  const returnUrlWithContext = appendQueryParam(
    appendQueryParam(returnUrl, "source", source || materialId),
    "material_id",
    materialId,
  );

  const baseRemark = {
    channel: "h5",
    source: source || materialId || null,
    material_id: materialId || null,
    phone,
    requested_payment_method: paymentMethod.gatewayType,
    requested_device: device,
    created_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase.from("purchase_records").insert({
    auth_user_id: authUserId,
    order_no: orderNo,
    product_name: plan.name,
    amount,
    payment_method: paymentMethod.internalMethod,
    payment_status: "pending",
    plan_id: plan.id,
    material_id: materialId || null,
    remark: JSON.stringify(baseRemark),
  });

  if (insertError) {
    return json({ error: "创建订单失败", detail: insertError.message }, 500);
  }

  const gatewayParams: Record<string, string> = {
    pid: merchantId,
    type: paymentMethod.gatewayType,
    out_trade_no: orderNo,
    notify_url: notifyUrl,
    return_url: returnUrlWithContext,
    name: plan.name,
    money: amount,
    device,
    param: phone,
    clientip: clientIp,
    sign_type: "MD5",
  };

  gatewayParams.sign = createSign(gatewayParams, merchantKey);

  try {
    const gatewayResponse = await fetch(payApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(gatewayParams).toString(),
    });

    const rawText = await gatewayResponse.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { raw: rawText };
    }

    const payUrl = getPayUrl(payload);

    await supabase.from("purchase_records").update({
      material_id: materialId || null,
      remark: JSON.stringify({
        ...baseRemark,
        notify_url: notifyUrl,
        return_url: returnUrlWithContext,
        gateway_request: gatewayParams,
        gateway_response: payload,
        raw: rawText,
      }),
      updated_at: new Date().toISOString(),
    }).eq("order_no", orderNo);

    if (!gatewayResponse.ok || !isGatewayBusinessSuccess(payload, payUrl)) {
      await supabase.from("purchase_records").update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("order_no", orderNo);

      return json({ error: getGatewayMessage(payload), detail: payload }, 502);
    }

    return json({
      success: true,
      orderNo,
      payUrl,
      source: source || materialId || null,
      materialId: materialId || null,
      notifyUrl,
      returnUrl: returnUrlWithContext,
      paymentMethod: paymentMethod.gatewayType,
      device,
      gateway: payload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    await supabase.from("purchase_records").update({
      payment_status: "failed",
      updated_at: new Date().toISOString(),
      material_id: materialId || null,
      remark: JSON.stringify({
        ...baseRemark,
        notify_url: notifyUrl,
        return_url: returnUrlWithContext,
        gateway_exception: message,
      }),
    }).eq("order_no", orderNo);

    return json({ error: "调用支付网关异常", detail: message }, 500);
  }
});