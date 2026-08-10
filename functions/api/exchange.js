// 交換モード：位置更新・近くの人・提案
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return cors(new Response(null, { status: 204 }));
  }

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'presence';

    if (request.method === 'POST' && action === 'presence') {
      return await updatePresence(request, env);
    }
    if (request.method === 'GET' && action === 'nearby') {
      return await getNearby(request, env);
    }
    if (request.method === 'POST' && action === 'offer') {
      return await createOffer(request, env);
    }
    if (request.method === 'POST' && action === 'respond') {
      return await respondOffer(request, env);
    }
    if (request.method === 'GET' && action === 'offers') {
      return await listOffers(request, env);
    }
    if (request.method === 'POST' && action === 'leave') {
      return await leaveExchange(request, env);
    }

    return cors(json({ error: 'Unknown action' }, 400));
  } catch (e) {
    return cors(json({ error: String(e.message || e) }, 500));
  }
}

async function updatePresence(request, env) {
  const body = await request.json();
  const { userId, lat, lng, accuracy } = body;
  if (!userId || lat == null || lng == null) {
    return cors(json({ error: 'userId, lat, lng が必要です' }, 400));
  }

  await env.DB.prepare(
    `INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING`
  )
    .bind(userId)
    .run();

  await env.DB.prepare(
    `INSERT INTO exchange_presence (user_id, lat, lng, accuracy, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       lat = excluded.lat,
       lng = excluded.lng,
       accuracy = excluded.accuracy,
       updated_at = datetime('now')`
  )
    .bind(userId, lat, lng, accuracy ?? null)
    .run();

  // 古いプレゼンスを掃除（5分以上前）
  await env.DB.prepare(
    `DELETE FROM exchange_presence WHERE updated_at < datetime('now', '-5 minutes')`
  ).run();

  return cors(json({ ok: true }));
}

async function leaveExchange(request, env) {
  const body = await request.json();
  const { userId } = body;
  if (!userId) return cors(json({ error: 'userId が必要です' }, 400));
  await env.DB.prepare('DELETE FROM exchange_presence WHERE user_id = ?')
    .bind(userId)
    .run();
  return cors(json({ ok: true }));
}

async function getNearby(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const lat = parseFloat(url.searchParams.get('lat'));
  const lng = parseFloat(url.searchParams.get('lng'));
  const maxDistance = parseFloat(url.searchParams.get('maxDistance') || '50');

  if (!userId || Number.isNaN(lat) || Number.isNaN(lng)) {
    return cors(json({ error: 'userId, lat, lng が必要です' }, 400));
  }

  // 5分以内のプレゼンスのみ
  const rows = await env.DB.prepare(
    `SELECT ep.user_id, ep.lat, ep.lng, ep.accuracy, ep.updated_at, u.display_name
     FROM exchange_presence ep
     LEFT JOIN users u ON u.id = ep.user_id
     WHERE ep.user_id != ?
       AND ep.updated_at >= datetime('now', '-5 minutes')`
  )
    .bind(userId)
    .all();

  const nearby = (rows.results || [])
    .map((r) => {
      const distance = haversine(lat, lng, r.lat, r.lng);
      return {
        userId: r.user_id,
        displayName: r.display_name || '名無しさん',
        distance_m: Math.round(distance),
        accuracy: r.accuracy,
      };
    })
    .filter((r) => r.distance_m <= maxDistance)
    .sort((a, b) => a.distance_m - b.distance_m);

  return cors(json({ nearby }));
}

async function createOffer(request, env) {
  const body = await request.json();
  const { fromUserId, toUserId, offerSpotId, requestSpotId, fromLat, fromLng, toLat, toLng } = body;

  if (!fromUserId || !toUserId || !offerSpotId || !requestSpotId) {
    return cors(json({ error: '必須項目が不足しています' }, 400));
  }

  // 近接チェック（両方の最新位置、またはリクエスト時の位置）
  if (fromLat != null && fromLng != null && toLat != null && toLng != null) {
    const dist = haversine(fromLat, fromLng, toLat, toLng);
    if (dist > 80) {
      return cors(json({ error: '相手と離れすぎています', distance_m: Math.round(dist) }, 403));
    }
  }

  // 所持チェック
  const fromOwns = await env.DB.prepare(
    'SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?'
  )
    .bind(fromUserId, offerSpotId)
    .first();
  const toOwns = await env.DB.prepare(
    'SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?'
  )
    .bind(toUserId, requestSpotId)
    .first();

  if (!fromOwns) return cors(json({ error: '渡すシールを持っていません' }, 400));
  if (!toOwns) return cors(json({ error: '相手がそのシールを持っていません' }, 400));

  // 自分がすでに request を持っていないか、相手がすでに offer を持っていないか
  const fromHasRequest = await env.DB.prepare(
    'SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?'
  )
    .bind(fromUserId, requestSpotId)
    .first();
  const toHasOffer = await env.DB.prepare(
    'SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?'
  )
    .bind(toUserId, offerSpotId)
    .first();

  if (fromHasRequest) return cors(json({ error: 'すでに受け取りたいシールを持っています' }, 400));
  if (toHasOffer) return cors(json({ error: '相手はすでにそのシールを持っています' }, 400));

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO trade_offers (id, from_user_id, to_user_id, offer_spot_id, request_spot_id, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`
  )
    .bind(id, fromUserId, toUserId, offerSpotId, requestSpotId)
    .run();

  return cors(json({ offerId: id, status: 'pending' }));
}

async function respondOffer(request, env) {
  const body = await request.json();
  const { offerId, userId, accept } = body;
  if (!offerId || !userId || accept == null) {
    return cors(json({ error: 'offerId, userId, accept が必要です' }, 400));
  }

  const offer = await env.DB.prepare(
    'SELECT * FROM trade_offers WHERE id = ? AND status = ?'
  )
    .bind(offerId, 'pending')
    .first();

  if (!offer) return cors(json({ error: '提案が見つかりません' }, 404));
  if (offer.to_user_id !== userId) {
    return cors(json({ error: 'この提案に応答する権限がありません' }, 403));
  }

  if (!accept) {
    await env.DB.prepare(`UPDATE trade_offers SET status = 'rejected' WHERE id = ?`)
      .bind(offerId)
      .run();
    return cors(json({ status: 'rejected' }));
  }

  // 受け入れ：所有権を入れ替え（アトミックに）
  // 1) from から offer を削除、to から request を削除
  // 2) from に request を追加、to に offer を追加
  const fromHasOffer = await env.DB.prepare(
    'SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?'
  )
    .bind(offer.from_user_id, offer.offer_spot_id)
    .first();
  const toHasRequest = await env.DB.prepare(
    'SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?'
  )
    .bind(offer.to_user_id, offer.request_spot_id)
    .first();

  if (!fromHasOffer || !toHasRequest) {
    await env.DB.prepare(`UPDATE trade_offers SET status = 'cancelled' WHERE id = ?`)
      .bind(offerId)
      .run();
    return cors(json({ error: 'シールの所持状態が変わっています' }, 409));
  }

  await env.DB.batch([
    env.DB.prepare('DELETE FROM collections WHERE user_id = ? AND spot_id = ?').bind(
      offer.from_user_id,
      offer.offer_spot_id
    ),
    env.DB.prepare('DELETE FROM collections WHERE user_id = ? AND spot_id = ?').bind(
      offer.to_user_id,
      offer.request_spot_id
    ),
    env.DB.prepare('INSERT INTO collections (user_id, spot_id) VALUES (?, ?)').bind(
      offer.from_user_id,
      offer.request_spot_id
    ),
    env.DB.prepare('INSERT INTO collections (user_id, spot_id) VALUES (?, ?)').bind(
      offer.to_user_id,
      offer.offer_spot_id
    ),
    env.DB.prepare(`UPDATE trade_offers SET status = 'accepted' WHERE id = ?`).bind(offerId),
  ]);

  return cors(json({ status: 'accepted' }));
}

async function listOffers(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return cors(json({ error: 'userId が必要です' }, 400));

  const rows = await env.DB.prepare(
    `SELECT o.*,
       s1.sticker_name as offer_sticker_name,
       s2.sticker_name as request_sticker_name
     FROM trade_offers o
     JOIN spots s1 ON s1.id = o.offer_spot_id
     JOIN spots s2 ON s2.id = o.request_spot_id
     WHERE (o.from_user_id = ? OR o.to_user_id = ?)
       AND o.status = 'pending'
       AND o.created_at >= datetime('now', '-30 minutes')
     ORDER BY o.created_at DESC`
  )
    .bind(userId, userId)
    .all();

  return cors(json({ offers: rows.results || [] }));
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
