// 所持シール一覧
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return cors(new Response(null, { status: 204 }));
  }

  try {
    if (request.method !== 'GET') {
      return cors(json({ error: 'Method not allowed' }, 405));
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return cors(json({ error: 'userId が必要です' }, 400));

    const rows = await env.DB.prepare(
      `SELECT c.spot_id, c.collected_at, s.name as spot_name, s.sticker_name, s.sticker_image, s.lat, s.lng
       FROM collections c
       JOIN spots s ON s.id = c.spot_id
       WHERE c.user_id = ?
       ORDER BY c.collected_at DESC`
    )
      .bind(userId)
      .all();

    return cors(json({ collection: rows.results || [] }));
  } catch (e) {
    return cors(json({ error: String(e.message || e) }, 500));
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(response.body, { status: response.status, headers });
}
