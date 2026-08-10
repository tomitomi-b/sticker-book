// 位置情報でシールを取得（デバッグ版）
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return cors(new Response(null, { status: 204 }));
  }

  try {
    if (request.method !== 'POST') {
      return cors(json({ error: 'Method not allowed' }, 405));
    }

    const body = await request.json();
    const rawSpotId = body.spotId || body.spot_id || body.id;
    const { userId, lat, lng, accuracy } = body;

    if (!userId || rawSpotId == null || lat == null || lng == null) {
      return cors(json({ error: 'userId, spotId, lat, lng が必要です' }, 400));
    }

    const targetSpotId = Number(rawSpotId);

    // 精度チェック（100m超はエラー）
    if (accuracy != null && accuracy > 100) {
      return cors(json({ error: '位置情報の精度が低すぎます。屋外でもう一度試してください。' }, 400));
    }

    // デバッグ用: 実際にDBに存在するスポット一覧を取得してみる
    const allSpots = await env.DB.prepare('SELECT id, name FROM spots').all();
    const existingIds = (allSpots.results || []).map(s => `${s.id}:${s.name}`).join(', ');

    // 該当のスポットを検索
    const spot = await env.DB.prepare(
      'SELECT id, name, lat, lng, radius_m, sticker_name FROM spots WHERE id = ?'
    )
      .bind(targetSpotId)
      .first();

    if (!spot) {
      return cors(
        json({
          error: `スポットが見つかりません (送信されたID: ${rawSpotId} [型: ${typeof rawSpotId}] / DBにあるスポット: ${existingIds || 'なし'})`
        }, 404)
      );
    }

    const distance = haversine(lat, lng, spot.lat, spot.lng);
    if (distance > spot.radius_m) {
      return cors(
        json({
          error: 'スポットの範囲外です',
          distance_m: Math.round(distance),
          radius_m: spot.radius_m,
        }),
        403
      );
    }

    // すでに持っているかチェック
    const existing = await env.DB.prepare(
      'SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?'
    )
      .bind(userId, targetSpotId)
      .first();

    if (existing) {
      return cors(json({ error: 'すでにこのシールを持っています', alreadyOwned: true }, 409));
    }

    // ユーザー作成
    await env.DB.prepare('INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING')
      .bind(userId)
      .run();

    // コレクションに追加
    await env.DB.prepare('INSERT INTO collections (user_id, spot_id) VALUES (?, ?)')
      .bind(userId, targetSpotId)
      .run();

    return cors(
      json({
        success: true,
        sticker: {
          spotId: spot.id,
          name: spot.sticker_name,
          spotName: spot.name,
        },
      })
    );
  } catch (e) {
    return cors(json({ error: `サーバーエラー: ${e.message || String(e)}` }, 500));
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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