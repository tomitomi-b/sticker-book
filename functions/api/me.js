// 簡易ユーザー登録・取得（端末IDベース）
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return cors(new Response(null, { status: 204 }));
  }

  try {
    if (request.method === 'POST') {
      const body = await request.json();
      const userId = body.userId;
      const displayName = body.displayName || null;

      if (!userId || typeof userId !== 'string' || userId.length < 8) {
        return cors(json({ error: 'userId が不正です' }, 400));
      }

      await env.DB.prepare(
        `INSERT INTO users (id, display_name) VALUES (?, ?)
         ON CONFLICT(id) DO UPDATE SET display_name = COALESCE(excluded.display_name, users.display_name)`
      )
        .bind(userId, displayName)
        .run();

      const user = await env.DB.prepare('SELECT id, display_name, created_at FROM users WHERE id = ?')
        .bind(userId)
        .first();

      return cors(json({ user }));
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      if (!userId) return cors(json({ error: 'userId が必要です' }, 400));

      const user = await env.DB.prepare('SELECT id, display_name, created_at FROM users WHERE id = ?')
        .bind(userId)
        .first();

      return cors(json({ user: user || null }));
    }

    return cors(json({ error: 'Method not allowed' }, 405));
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
