// スポット一覧・近くのスポット検索
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
    const lat = parseFloat(url.searchParams.get('lat'));
    const lng = parseFloat(url.searchParams.get('lng'));
    const userId = url.searchParams.get('userId');

    const spots = await env.DB.prepare(
      'SELECT id, name, description, lat, lng, radius_m, sticker_name, sticker_image FROM spots'
    ).all();

    let list = spots.results || [];

    // 位置が渡されていれば距離を計算
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      list = list.map((s) => {
        const distance = haversine(lat, lng, s.lat, s.lng);
        return {
          ...s,
          distance_m: Math.round(distance),
          in_range: distance <= s.radius_m,
        };
      });
      list.sort((a, b) => a.distance_m - b.distance_m);
    }

    // 所持済みかどうか
    if (userId) {
      const owned = await env.DB.prepare(
        'SELECT spot_id FROM collections WHERE user_id = ?'
      )
        .bind(userId)
        .all();
      const ownedSet = new Set((owned.results || []).map((r) => r.spot_id));
      list = list.map((s) => ({ ...s, owned: ownedSet.has(s.id) }));
    }

    return cors(json({ spots: list }));
  } catch (e) {
    return cors(json({ error: String(e.message || e) }, 500));
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
