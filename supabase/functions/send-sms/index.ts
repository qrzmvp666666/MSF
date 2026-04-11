// Supabase Send SMS Webhook
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const payload = await req.json();
    let phone = payload.user?.phone || '';
    const otp = payload.sms?.otp || '';

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: { http_code: 400, message: 'Missing phone or OTP' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (phone.startsWith('+86')) {
      phone = phone.substring(3);
    } else if (phone.startsWith('+')) {
      phone = phone.substring(1);
    }

    // 从环境变量中获取模板编码，如果未配置则使用占位符
    const templateCode = Deno.env.get('SPUG_TEMPLATE_CODE') || 'A27L****bgEY';
    const spugUrl = `https://push.spug.cc/send/${templateCode}`;
    
    const requestBody = JSON.stringify({
      name: '猛料助手', // 可以自定义为你的短信签名名称
      code: otp,
      targets: phone
    });

    const response = await fetch(spugUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: { http_code: response.status, message: `Failed to send SMS: ${errorText}` } }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorObj = error as Error;
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: errorObj.message } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
