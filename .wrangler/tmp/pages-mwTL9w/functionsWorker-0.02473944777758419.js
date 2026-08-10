var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/old/claim_.js
async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return cors(new Response(null, { status: 204 }));
  }
  try {
    if (request.method !== "POST") {
      return cors(json({ error: "Method not allowed" }, 405));
    }
    const body = await request.json();
    const { userId, spotId, lat, lng, accuracy } = body;
    if (!userId || !spotId || lat == null || lng == null) {
      return cors(json({ error: "userId, spotId, lat, lng \u304C\u5FC5\u8981\u3067\u3059" }, 400));
    }
    if (accuracy != null && accuracy > 100) {
      return cors(json({ error: "\u4F4D\u7F6E\u60C5\u5831\u306E\u7CBE\u5EA6\u304C\u4F4E\u3059\u304E\u307E\u3059\u3002\u5C4B\u5916\u3067\u3082\u3046\u4E00\u5EA6\u8A66\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, 400));
    }
    const spot = await env.DB.prepare(
      "SELECT id, name, lat, lng, radius_m, sticker_name FROM spots WHERE id = ?"
    ).bind(spotId).first();
    if (!spot) {
      return cors(json({ error: "\u30B9\u30DD\u30C3\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404));
    }
    const distance = haversine(lat, lng, spot.lat, spot.lng);
    if (distance > spot.radius_m) {
      return cors(
        json({
          error: "\u30B9\u30DD\u30C3\u30C8\u306E\u7BC4\u56F2\u5916\u3067\u3059",
          distance_m: Math.round(distance),
          radius_m: spot.radius_m
        }),
        403
      );
    }
    const existing = await env.DB.prepare(
      "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
    ).bind(userId, spotId).first();
    if (existing) {
      return cors(json({ error: "\u3059\u3067\u306B\u3053\u306E\u30B7\u30FC\u30EB\u3092\u6301\u3063\u3066\u3044\u307E\u3059", alreadyOwned: true }, 409));
    }
    await env.DB.prepare(
      `INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING`
    ).bind(userId).run();
    await env.DB.prepare(
      "INSERT INTO collections (user_id, spot_id) VALUES (?, ?)"
    ).bind(userId, spotId).run();
    return cors(
      json({
        success: true,
        sticker: {
          spotId: spot.id,
          name: spot.sticker_name,
          spotName: spot.name
        }
      })
    );
  } catch (e) {
    return cors(json({ error: String(e.message || e) }, 500));
  }
}
__name(onRequest, "onRequest");
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = /* @__PURE__ */ __name((d) => d * Math.PI / 180, "toRad");
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
__name(haversine, "haversine");
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json, "json");
function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
__name(cors, "cors");

// api/old/claim__.js
async function onRequest2(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return cors2(new Response(null, { status: 204 }));
  }
  try {
    if (request.method !== "POST") {
      return cors2(json2({ error: "Method not allowed" }, 405));
    }
    const body = await request.json();
    const rawSpotId = body.spotId || body.spot_id || body.id;
    const { userId, lat, lng, accuracy } = body;
    if (!userId || !rawSpotId || lat == null || lng == null) {
      return cors2(json2({ error: "userId, spotId, lat, lng \u304C\u5FC5\u8981\u3067\u3059" }, 400));
    }
    const targetSpotId = Number(rawSpotId);
    if (accuracy != null && accuracy > 100) {
      return cors2(json2({ error: "\u4F4D\u7F6E\u60C5\u5831\u306E\u7CBE\u5EA6\u304C\u4F4E\u3059\u304E\u307E\u3059\u3002\u5C4B\u5916\u3067\u3082\u3046\u4E00\u5EA6\u8A66\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, 400));
    }
    const spot = await env.DB.prepare(
      "SELECT id, name, lat, lng, radius_m, sticker_name FROM spots WHERE id = ?"
    ).bind(targetSpotId).first();
    if (!spot) {
      return cors2(json2({ error: "\u30B9\u30DD\u30C3\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404));
    }
    const distance = haversine2(lat, lng, spot.lat, spot.lng);
    if (distance > spot.radius_m) {
      return cors2(
        json2({
          error: "\u30B9\u30DD\u30C3\u30C8\u306E\u7BC4\u56F2\u5916\u3067\u3059",
          distance_m: Math.round(distance),
          radius_m: spot.radius_m
        }),
        403
      );
    }
    const existing = await env.DB.prepare(
      "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
    ).bind(userId, targetSpotId).first();
    if (existing) {
      return cors2(json2({ error: "\u3059\u3067\u306B\u3053\u306E\u30B7\u30FC\u30EB\u3092\u6301\u3063\u3066\u3044\u307E\u3059", alreadyOwned: true }, 409));
    }
    await env.DB.prepare(
      `INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING`
    ).bind(userId).run();
    await env.DB.prepare(
      "INSERT INTO collections (user_id, spot_id) VALUES (?, ?)"
    ).bind(userId, targetSpotId).run();
    return cors2(
      json2({
        success: true,
        sticker: {
          spotId: spot.id,
          name: spot.sticker_name,
          spotName: spot.name
        }
      })
    );
  } catch (e) {
    return cors2(json2({ error: String(e.message || e) }, 500));
  }
}
__name(onRequest2, "onRequest");
function haversine2(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = /* @__PURE__ */ __name((d) => d * Math.PI / 180, "toRad");
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
__name(haversine2, "haversine");
function json2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json2, "json");
function cors2(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
__name(cors2, "cors");

// api/old/claim_v4.js
async function onRequest3(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return cors3(new Response(null, { status: 204 }));
  }
  try {
    if (request.method !== "POST") {
      return cors3(json3({ error: "Method not allowed" }, 405));
    }
    const body = await request.json();
    const rawSpotId = body.spotId || body.spot_id || body.id;
    const { userId, lat, lng, accuracy } = body;
    if (!userId || rawSpotId == null || lat == null || lng == null) {
      return cors3(json3({ error: "userId, spotId, lat, lng \u304C\u5FC5\u8981\u3067\u3059" }, 400));
    }
    const targetSpotId = Number(rawSpotId);
    if (accuracy != null && accuracy > 100) {
      return cors3(json3({ error: "\u4F4D\u7F6E\u60C5\u5831\u306E\u7CBE\u5EA6\u304C\u4F4E\u3059\u304E\u307E\u3059\u3002\u5C4B\u5916\u3067\u3082\u3046\u4E00\u5EA6\u8A66\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, 400));
    }
    const allSpots = await env.DB.prepare("SELECT id, name FROM spots").all();
    const existingIds = (allSpots.results || []).map((s) => `${s.id}:${s.name}`).join(", ");
    const spot = await env.DB.prepare(
      "SELECT id, name, lat, lng, radius_m, sticker_name FROM spots WHERE id = ?"
    ).bind(targetSpotId).first();
    if (!spot) {
      return cors3(
        json3({
          error: `\u30B9\u30DD\u30C3\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 (\u9001\u4FE1\u3055\u308C\u305FID: ${rawSpotId} [\u578B: ${typeof rawSpotId}] / DB\u306B\u3042\u308B\u30B9\u30DD\u30C3\u30C8: ${existingIds || "\u306A\u3057"})`
        }, 404)
      );
    }
    const distance = haversine3(lat, lng, spot.lat, spot.lng);
    if (distance > spot.radius_m) {
      return cors3(
        json3({
          error: "\u30B9\u30DD\u30C3\u30C8\u306E\u7BC4\u56F2\u5916\u3067\u3059",
          distance_m: Math.round(distance),
          radius_m: spot.radius_m
        }),
        403
      );
    }
    const existing = await env.DB.prepare(
      "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
    ).bind(userId, targetSpotId).first();
    if (existing) {
      return cors3(json3({ error: "\u3059\u3067\u306B\u3053\u306E\u30B7\u30FC\u30EB\u3092\u6301\u3063\u3066\u3044\u307E\u3059", alreadyOwned: true }, 409));
    }
    await env.DB.prepare("INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING").bind(userId).run();
    await env.DB.prepare("INSERT INTO collections (user_id, spot_id) VALUES (?, ?)").bind(userId, targetSpotId).run();
    return cors3(
      json3({
        success: true,
        sticker: {
          spotId: spot.id,
          name: spot.sticker_name,
          spotName: spot.name
        }
      })
    );
  } catch (e) {
    return cors3(json3({ error: `\u30B5\u30FC\u30D0\u30FC\u30A8\u30E9\u30FC: ${e.message || String(e)}` }, 500));
  }
}
__name(onRequest3, "onRequest");
function haversine3(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = /* @__PURE__ */ __name((d) => d * Math.PI / 180, "toRad");
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
__name(haversine3, "haversine");
function json3(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json3, "json");
function cors3(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
__name(cors3, "cors");

// api/claim.js
async function onRequest4(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return cors4(new Response(null, { status: 204 }));
  }
  try {
    if (request.method !== "POST") {
      return cors4(json4({ error: "Method not allowed" }, 405));
    }
    const body = await request.json();
    const targetSpotId = String(body.spotId || body.spot_id || body.id || "");
    const { userId, lat, lng, accuracy } = body;
    if (!userId || !targetSpotId || lat == null || lng == null) {
      return cors4(json4({ error: "userId, spotId, lat, lng \u304C\u5FC5\u8981\u3067\u3059" }, 400));
    }
    if (accuracy != null && accuracy > 100) {
      return cors4(json4({ error: "\u4F4D\u7F6E\u60C5\u5831\u306E\u7CBE\u5EA6\u304C\u4F4E\u3059\u304E\u307E\u3059\u3002\u5C4B\u5916\u3067\u3082\u3046\u4E00\u5EA6\u8A66\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, 400));
    }
    const spot = await env.DB.prepare(
      "SELECT id, name, lat, lng, radius_m, sticker_name FROM spots WHERE id = ?"
    ).bind(targetSpotId).first();
    if (!spot) {
      return cors4(json4({ error: "\u30B9\u30DD\u30C3\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404));
    }
    const distance = haversine4(lat, lng, spot.lat, spot.lng);
    if (distance > spot.radius_m) {
      return cors4(
        json4({
          error: "\u30B9\u30DD\u30C3\u30C8\u306E\u7BC4\u56F2\u5916\u3067\u3059",
          distance_m: Math.round(distance),
          radius_m: spot.radius_m
        }),
        403
      );
    }
    const existing = await env.DB.prepare(
      "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
    ).bind(userId, targetSpotId).first();
    if (existing) {
      return cors4(json4({ error: "\u3059\u3067\u306B\u3053\u306E\u30B7\u30FC\u30EB\u3092\u6301\u3063\u3066\u3044\u307E\u3059", alreadyOwned: true }, 409));
    }
    await env.DB.prepare(
      "INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING"
    ).bind(userId).run();
    await env.DB.prepare(
      "INSERT INTO collections (user_id, spot_id) VALUES (?, ?)"
    ).bind(userId, targetSpotId).run();
    return cors4(
      json4({
        success: true,
        sticker: {
          spotId: spot.id,
          name: spot.sticker_name,
          spotName: spot.name
        }
      })
    );
  } catch (e) {
    return cors4(json4({ error: String(e.message || e) }, 500));
  }
}
__name(onRequest4, "onRequest");
function haversine4(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = /* @__PURE__ */ __name((d) => d * Math.PI / 180, "toRad");
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
__name(haversine4, "haversine");
function json4(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json4, "json");
function cors4(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
__name(cors4, "cors");

// api/collection.js
async function onRequest5(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return cors5(new Response(null, { status: 204 }));
  }
  try {
    if (request.method !== "GET") {
      return cors5(json5({ error: "Method not allowed" }, 405));
    }
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return cors5(json5({ error: "userId \u304C\u5FC5\u8981\u3067\u3059" }, 400));
    const rows = await env.DB.prepare(
      `SELECT c.spot_id, c.collected_at, s.name as spot_name, s.sticker_name, s.sticker_image, s.lat, s.lng
       FROM collections c
       JOIN spots s ON s.id = c.spot_id
       WHERE c.user_id = ?
       ORDER BY c.collected_at DESC`
    ).bind(userId).all();
    return cors5(json5({ collection: rows.results || [] }));
  } catch (e) {
    return cors5(json5({ error: String(e.message || e) }, 500));
  }
}
__name(onRequest5, "onRequest");
function json5(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json5, "json");
function cors5(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
__name(cors5, "cors");

// api/exchange.js
async function onRequest6(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return cors6(new Response(null, { status: 204 }));
  }
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "presence";
    if (request.method === "POST" && action === "presence") {
      return await updatePresence(request, env);
    }
    if (request.method === "GET" && action === "nearby") {
      return await getNearby(request, env);
    }
    if (request.method === "POST" && action === "offer") {
      return await createOffer(request, env);
    }
    if (request.method === "POST" && action === "respond") {
      return await respondOffer(request, env);
    }
    if (request.method === "GET" && action === "offers") {
      return await listOffers(request, env);
    }
    if (request.method === "POST" && action === "leave") {
      return await leaveExchange(request, env);
    }
    return cors6(json6({ error: "Unknown action" }, 400));
  } catch (e) {
    return cors6(json6({ error: String(e.message || e) }, 500));
  }
}
__name(onRequest6, "onRequest");
async function updatePresence(request, env) {
  const body = await request.json();
  const { userId, lat, lng, accuracy } = body;
  if (!userId || lat == null || lng == null) {
    return cors6(json6({ error: "userId, lat, lng \u304C\u5FC5\u8981\u3067\u3059" }, 400));
  }
  await env.DB.prepare(
    `INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING`
  ).bind(userId).run();
  await env.DB.prepare(
    `INSERT INTO exchange_presence (user_id, lat, lng, accuracy, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       lat = excluded.lat,
       lng = excluded.lng,
       accuracy = excluded.accuracy,
       updated_at = datetime('now')`
  ).bind(userId, lat, lng, accuracy ?? null).run();
  await env.DB.prepare(
    `DELETE FROM exchange_presence WHERE updated_at < datetime('now', '-5 minutes')`
  ).run();
  return cors6(json6({ ok: true }));
}
__name(updatePresence, "updatePresence");
async function leaveExchange(request, env) {
  const body = await request.json();
  const { userId } = body;
  if (!userId) return cors6(json6({ error: "userId \u304C\u5FC5\u8981\u3067\u3059" }, 400));
  await env.DB.prepare("DELETE FROM exchange_presence WHERE user_id = ?").bind(userId).run();
  return cors6(json6({ ok: true }));
}
__name(leaveExchange, "leaveExchange");
async function getNearby(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const lat = parseFloat(url.searchParams.get("lat"));
  const lng = parseFloat(url.searchParams.get("lng"));
  const maxDistance = parseFloat(url.searchParams.get("maxDistance") || "50");
  if (!userId || Number.isNaN(lat) || Number.isNaN(lng)) {
    return cors6(json6({ error: "userId, lat, lng \u304C\u5FC5\u8981\u3067\u3059" }, 400));
  }
  const rows = await env.DB.prepare(
    `SELECT ep.user_id, ep.lat, ep.lng, ep.accuracy, ep.updated_at, u.display_name
     FROM exchange_presence ep
     LEFT JOIN users u ON u.id = ep.user_id
     WHERE ep.user_id != ?
       AND ep.updated_at >= datetime('now', '-5 minutes')`
  ).bind(userId).all();
  const nearby = (rows.results || []).map((r) => {
    const distance = haversine5(lat, lng, r.lat, r.lng);
    return {
      userId: r.user_id,
      displayName: r.display_name || "\u540D\u7121\u3057\u3055\u3093",
      distance_m: Math.round(distance),
      accuracy: r.accuracy
    };
  }).filter((r) => r.distance_m <= maxDistance).sort((a, b) => a.distance_m - b.distance_m);
  return cors6(json6({ nearby }));
}
__name(getNearby, "getNearby");
async function createOffer(request, env) {
  const body = await request.json();
  const { fromUserId, toUserId, offerSpotId, requestSpotId, fromLat, fromLng, toLat, toLng } = body;
  if (!fromUserId || !toUserId || !offerSpotId || !requestSpotId) {
    return cors6(json6({ error: "\u5FC5\u9808\u9805\u76EE\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059" }, 400));
  }
  if (fromLat != null && fromLng != null && toLat != null && toLng != null) {
    const dist = haversine5(fromLat, fromLng, toLat, toLng);
    if (dist > 80) {
      return cors6(json6({ error: "\u76F8\u624B\u3068\u96E2\u308C\u3059\u304E\u3066\u3044\u307E\u3059", distance_m: Math.round(dist) }, 403));
    }
  }
  const fromOwns = await env.DB.prepare(
    "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
  ).bind(fromUserId, offerSpotId).first();
  const toOwns = await env.DB.prepare(
    "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
  ).bind(toUserId, requestSpotId).first();
  if (!fromOwns) return cors6(json6({ error: "\u6E21\u3059\u30B7\u30FC\u30EB\u3092\u6301\u3063\u3066\u3044\u307E\u305B\u3093" }, 400));
  if (!toOwns) return cors6(json6({ error: "\u76F8\u624B\u304C\u305D\u306E\u30B7\u30FC\u30EB\u3092\u6301\u3063\u3066\u3044\u307E\u305B\u3093" }, 400));
  const fromHasRequest = await env.DB.prepare(
    "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
  ).bind(fromUserId, requestSpotId).first();
  const toHasOffer = await env.DB.prepare(
    "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
  ).bind(toUserId, offerSpotId).first();
  if (fromHasRequest) return cors6(json6({ error: "\u3059\u3067\u306B\u53D7\u3051\u53D6\u308A\u305F\u3044\u30B7\u30FC\u30EB\u3092\u6301\u3063\u3066\u3044\u307E\u3059" }, 400));
  if (toHasOffer) return cors6(json6({ error: "\u76F8\u624B\u306F\u3059\u3067\u306B\u305D\u306E\u30B7\u30FC\u30EB\u3092\u6301\u3063\u3066\u3044\u307E\u3059" }, 400));
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO trade_offers (id, from_user_id, to_user_id, offer_spot_id, request_spot_id, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`
  ).bind(id, fromUserId, toUserId, offerSpotId, requestSpotId).run();
  return cors6(json6({ offerId: id, status: "pending" }));
}
__name(createOffer, "createOffer");
async function respondOffer(request, env) {
  const body = await request.json();
  const { offerId, userId, accept } = body;
  if (!offerId || !userId || accept == null) {
    return cors6(json6({ error: "offerId, userId, accept \u304C\u5FC5\u8981\u3067\u3059" }, 400));
  }
  const offer = await env.DB.prepare(
    "SELECT * FROM trade_offers WHERE id = ? AND status = ?"
  ).bind(offerId, "pending").first();
  if (!offer) return cors6(json6({ error: "\u63D0\u6848\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404));
  if (offer.to_user_id !== userId) {
    return cors6(json6({ error: "\u3053\u306E\u63D0\u6848\u306B\u5FDC\u7B54\u3059\u308B\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093" }, 403));
  }
  if (!accept) {
    await env.DB.prepare(`UPDATE trade_offers SET status = 'rejected' WHERE id = ?`).bind(offerId).run();
    return cors6(json6({ status: "rejected" }));
  }
  const fromHasOffer = await env.DB.prepare(
    "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
  ).bind(offer.from_user_id, offer.offer_spot_id).first();
  const toHasRequest = await env.DB.prepare(
    "SELECT 1 FROM collections WHERE user_id = ? AND spot_id = ?"
  ).bind(offer.to_user_id, offer.request_spot_id).first();
  if (!fromHasOffer || !toHasRequest) {
    await env.DB.prepare(`UPDATE trade_offers SET status = 'cancelled' WHERE id = ?`).bind(offerId).run();
    return cors6(json6({ error: "\u30B7\u30FC\u30EB\u306E\u6240\u6301\u72B6\u614B\u304C\u5909\u308F\u3063\u3066\u3044\u307E\u3059" }, 409));
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM collections WHERE user_id = ? AND spot_id = ?").bind(
      offer.from_user_id,
      offer.offer_spot_id
    ),
    env.DB.prepare("DELETE FROM collections WHERE user_id = ? AND spot_id = ?").bind(
      offer.to_user_id,
      offer.request_spot_id
    ),
    env.DB.prepare("INSERT INTO collections (user_id, spot_id) VALUES (?, ?)").bind(
      offer.from_user_id,
      offer.request_spot_id
    ),
    env.DB.prepare("INSERT INTO collections (user_id, spot_id) VALUES (?, ?)").bind(
      offer.to_user_id,
      offer.offer_spot_id
    ),
    env.DB.prepare(`UPDATE trade_offers SET status = 'accepted' WHERE id = ?`).bind(offerId)
  ]);
  return cors6(json6({ status: "accepted" }));
}
__name(respondOffer, "respondOffer");
async function listOffers(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return cors6(json6({ error: "userId \u304C\u5FC5\u8981\u3067\u3059" }, 400));
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
  ).bind(userId, userId).all();
  return cors6(json6({ offers: rows.results || [] }));
}
__name(listOffers, "listOffers");
function haversine5(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = /* @__PURE__ */ __name((d) => d * Math.PI / 180, "toRad");
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
__name(haversine5, "haversine");
function json6(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json6, "json");
function cors6(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
__name(cors6, "cors");

// api/me.js
async function onRequest7(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return cors7(new Response(null, { status: 204 }));
  }
  try {
    if (request.method === "POST") {
      const body = await request.json();
      const userId = body.userId;
      const displayName = body.displayName || null;
      if (!userId || typeof userId !== "string" || userId.length < 8) {
        return cors7(json7({ error: "userId \u304C\u4E0D\u6B63\u3067\u3059" }, 400));
      }
      await env.DB.prepare(
        `INSERT INTO users (id, display_name) VALUES (?, ?)
         ON CONFLICT(id) DO UPDATE SET display_name = COALESCE(excluded.display_name, users.display_name)`
      ).bind(userId, displayName).run();
      const user = await env.DB.prepare("SELECT id, display_name, created_at FROM users WHERE id = ?").bind(userId).first();
      return cors7(json7({ user }));
    }
    if (request.method === "GET") {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");
      if (!userId) return cors7(json7({ error: "userId \u304C\u5FC5\u8981\u3067\u3059" }, 400));
      const user = await env.DB.prepare("SELECT id, display_name, created_at FROM users WHERE id = ?").bind(userId).first();
      return cors7(json7({ user: user || null }));
    }
    return cors7(json7({ error: "Method not allowed" }, 405));
  } catch (e) {
    return cors7(json7({ error: String(e.message || e) }, 500));
  }
}
__name(onRequest7, "onRequest");
function json7(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json7, "json");
function cors7(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
__name(cors7, "cors");

// api/spots.js
async function onRequest8(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return cors8(new Response(null, { status: 204 }));
  }
  try {
    if (request.method !== "GET") {
      return cors8(json8({ error: "Method not allowed" }, 405));
    }
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get("lat"));
    const lng = parseFloat(url.searchParams.get("lng"));
    const userId = url.searchParams.get("userId");
    const spots = await env.DB.prepare(
      "SELECT id, name, description, lat, lng, radius_m, sticker_name, sticker_image FROM spots"
    ).all();
    let list = spots.results || [];
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      list = list.map((s) => {
        const distance = haversine6(lat, lng, s.lat, s.lng);
        return {
          ...s,
          distance_m: Math.round(distance),
          in_range: distance <= s.radius_m
        };
      });
      list.sort((a, b) => a.distance_m - b.distance_m);
    }
    if (userId) {
      const owned = await env.DB.prepare(
        "SELECT spot_id FROM collections WHERE user_id = ?"
      ).bind(userId).all();
      const ownedSet = new Set((owned.results || []).map((r) => r.spot_id));
      list = list.map((s) => ({ ...s, owned: ownedSet.has(s.id) }));
    }
    return cors8(json8({ spots: list }));
  } catch (e) {
    return cors8(json8({ error: String(e.message || e) }, 500));
  }
}
__name(onRequest8, "onRequest");
function haversine6(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = /* @__PURE__ */ __name((d) => d * Math.PI / 180, "toRad");
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
__name(haversine6, "haversine");
function json8(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json8, "json");
function cors8(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
__name(cors8, "cors");

// ../.wrangler/tmp/pages-mwTL9w/functionsRoutes-0.20047615321411194.mjs
var routes = [
  {
    routePath: "/api/old/claim_",
    mountPath: "/api/old",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/old/claim__",
    mountPath: "/api/old",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/old/claim_v4",
    mountPath: "/api/old",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/claim",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/collection",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/exchange",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/me",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/spots",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
