// ===== 設定 =====
const API_BASE = '/api';

// ===== 状態 =====
const state = {
  userId: null,
  lat: null,
  lng: null,
  accuracy: null,
  spots: [],
  collection: [],
  exchangeOn: false,
  exchangeTimer: null,
  nearby: [],
};

// マップ用インスタンス管理
let map = null;
let userMarker = null;
let spotMarkers = [];

// ===== ユーティリティ =====
function toast(msg, ms = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), ms);
}

function getUserId() {
  let id = localStorage.getItem('sb_user_id');
  if (!id) {
    id = 'u_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    localStorage.setItem('sb_user_id', id);
  }
  return id;
}

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'リクエストに失敗しました');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function formatDistance(m) {
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

// ===== 地図（Leaflet）初期化 =====
function initMap() {
  if (map) return;
  
  // 東京駅周辺を初期位置としてマップ生成
  map = L.map('map').setView([35.681236, 139.767125], 13);

  // OpenStreetMap の無料タイルを読み込み
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}

// ===== 位置情報 =====
function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('この端末では位置情報が使えません'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = '位置情報を取得できませんでした';
        if (err.code === 1) msg = '位置情報の許可が必要です。設定から許可してください。';
        if (err.code === 2) msg = '位置を特定できませんでした。';
        if (err.code === 3) msg = '位置情報の取得がタイムアウトしました。';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// ===== タブ切り替え =====
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    
    // 地図が表示領域に入った際の描画崩れ防止
    if (btn.dataset.tab === 'find' && map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
    if (btn.dataset.tab === 'book') loadCollection();
    if (btn.dataset.tab === 'exchange' && state.exchangeOn) refreshNearby();
  });
});

// ===== 探す =====
document.getElementById('btn-locate').addEventListener('click', async () => {
  const btn = document.getElementById('btn-locate');
  const status = document.getElementById('location-status');
  btn.disabled = true;
  status.textContent = '位置情報を取得中…';
  try {
    const pos = await getPosition();
    state.lat = pos.lat;
    state.lng = pos.lng;
    state.accuracy = pos.accuracy;
    status.textContent = `現在地を取得しました（精度 約${Math.round(pos.accuracy)}m）`;
    
    // 地図を現在地に移動＆現在地マーカー表示
    updateUserLocationOnMap(pos.lat, pos.lng);

    await loadSpots();
  } catch (e) {
    status.textContent = e.message;
    toast(e.message);
  } finally {
    btn.disabled = false;
  }
});

// 地図上の現在地マーカー更新
function updateUserLocationOnMap(lat, lng) {
  initMap();
  map.setView([lat, lng], 15);

  if (userMarker) {
    userMarker.setLatLng([lat, lng]);
  } else {
    // 現在地を示す青い丸アイコン
    userMarker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#3b82f6',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(map).bindPopup('現在地');
  }
}

async function loadSpots() {
  const params = new URLSearchParams({ userId: state.userId });
  if (state.lat != null) {
    params.set('lat', state.lat);
    params.set('lng', state.lng);
  }
  const data = await api('/spots?' + params.toString());
  state.spots = data.spots || [];
  
  renderSpots();
  renderSpotMarkersOnMap();
}

// 地図上にスポットピンと取得可能範囲（円）を描画
function renderSpotMarkersOnMap() {
  initMap();

  // 既存のスポットピンをクリア
  spotMarkers.forEach((m) => map.removeLayer(m));
  spotMarkers = [];

  state.spots.forEach((s) => {
    if (s.lat == null || s.lng == null) return;

    // 状態に応じた色の判定（所持済み: グレー, 範囲内: 赤/ピンク, 範囲外: オレンジ）
    const color = s.owned ? '#6b7280' : s.in_range ? '#ef4444' : '#f59e0b';

    // 1. スポットの取得可能半径を円（Circle）で描画
    const circle = L.circle([s.lat, s.lng], {
      radius: s.radius_m || 200,
      color: color,
      fillColor: color,
      fillOpacity: 0.15,
      weight: 1.5
    }).addTo(map);

    // 2. スポット中心のピン
    const marker = L.circleMarker([s.lat, s.lng], {
      radius: 6,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1
    }).addTo(map);

    // ポップアップ吹き出しの設定
    const canClaim = s.in_range && !s.owned;
    const popupContent = `
      <div>
        <h4>${escapeHtml(s.sticker_name)}</h4>
        <p style="margin:2px 0; color:#aaa;">${escapeHtml(s.name)}</p>
        <p style="margin:2px 0;">${s.owned ? '✅ 所持済み' : s.in_range ? '🟢 範囲内' : '⚪ 範囲外'}</p>
        ${canClaim ? `<button class="btn small primary" onclick="claimStickerFromMap('${s.id}')">ゲットする</button>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent);
    circle.bindPopup(popupContent);

    spotMarkers.push(circle, marker);
  });
}

// 地図上のポップアップから直接ゲットを実行するグローバル関数
window.claimStickerFromMap = function (spotId) {
  claimSticker(spotId);
};

function renderSpots() {
  const el = document.getElementById('spots-list');
  if (!state.spots.length) {
    el.innerHTML = '<p class="empty">スポットがありません</p>';
    return;
  }
  el.innerHTML = state.spots
    .map((s) => {
      const badge = s.owned
        ? '<span class="badge owned">所持済み</span>'
        : s.in_range
          ? '<span class="badge in-range">範囲内</span>'
          : '<span class="badge far">範囲外</span>';
      const dist = s.distance_m != null ? formatDistance(s.distance_m) : '-';
      const canClaim = s.in_range && !s.owned;
      return `
        <div class="spot-card">
          <h3>${escapeHtml(s.sticker_name)}</h3>
          <p class="meta">${escapeHtml(s.name)} · ${dist} ${badge}</p>
          <p class="meta">${escapeHtml(s.description || '')}</p>
          ${canClaim ? `<button class="btn small primary" data-claim="${s.id}">このシールをゲット</button>` : ''}
        </div>
      `;
    })
    .join('');

  el.querySelectorAll('[data-claim]').forEach((btn) => {
    btn.addEventListener('click', () => claimSticker(btn.dataset.claim, btn));
  });
}

async function claimSticker(spotId, btn = null) {
  if (state.lat == null) {
    toast('先に現在地を取得してください');
    return;
  }
  if (btn) btn.disabled = true;
  try {
    const data = await api('/claim', {
      method: 'POST',
      body: JSON.stringify({
        userId: state.userId,
        spotId,
        lat: state.lat,
        lng: state.lng,
        accuracy: state.accuracy,
      }),
    });
    toast(`「${data.sticker.name}」をゲットしました！`);
    await loadSpots();
  } catch (e) {
    toast(e.message);
    if (btn) btn.disabled = false;
  }
}

// ===== シール帳 =====
async function loadCollection() {
  const data = await api('/collection?userId=' + encodeURIComponent(state.userId));
  state.collection = data.collection || [];
  renderCollection();
}

function renderCollection() {
  const el = document.getElementById('collection-list');
  if (!state.collection.length) {
    el.innerHTML = '<p class="empty">まだシールがありません。<br>「探す」からゲットしてみよう</p>';
    return;
  }
  el.innerHTML = state.collection
    .map(
      (c) => `
      <div class="sticker-item">
        <div class="icon">🏷️</div>
        <div class="name">${escapeHtml(c.sticker_name)}</div>
        <div class="date">${escapeHtml(c.spot_name)}<br>${formatDate(c.collected_at)}</div>
      </div>
    `
    )
    .join('');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso + (iso.endsWith('Z') ? '' : 'Z'));
    return d.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// ===== 交換 =====
const btnExchange = document.getElementById('btn-exchange-toggle');
const exchangeStatus = document.getElementById('exchange-status');

if (btnExchange) {
  btnExchange.addEventListener('click', async () => {
    if (state.exchangeOn) {
      await stopExchange();
    } else {
      await startExchange();
    }
  });
}

async function startExchange() {
  try {
    const pos = await getPosition();
    state.lat = pos.lat;
    state.lng = pos.lng;
    state.accuracy = pos.accuracy;
    state.exchangeOn = true;
    btnExchange.textContent = '交換モードをOFFにする';
    btnExchange.classList.remove('secondary');
    btnExchange.classList.add('primary');
    exchangeStatus.textContent = '交換モードON · 近くの人を探しています…';
    await sendPresence();
    await refreshNearby();
    await loadOffers();
    state.exchangeTimer = setInterval(async () => {
      try {
        const p = await getPosition();
        state.lat = p.lat;
        state.lng = p.lng;
        state.accuracy = p.accuracy;
        await sendPresence();
        await refreshNearby();
        await loadOffers();
      } catch (_) {}
    }, 8000);
    toast('交換モードをONにしました');
  } catch (e) {
    toast(e.message);
  }
}

async function stopExchange() {
  state.exchangeOn = false;
  if (state.exchangeTimer) {
    clearInterval(state.exchangeTimer);
    state.exchangeTimer = null;
  }
  try {
    await api('/exchange?action=leave', {
      method: 'POST',
      body: JSON.stringify({ userId: state.userId }),
    });
  } catch (_) {}
  btnExchange.textContent = '交換モードをONにする';
  btnExchange.classList.add('secondary');
  btnExchange.classList.remove('primary');
  exchangeStatus.textContent = '交換モードはOFFです';
  document.getElementById('nearby-list').innerHTML = '';
  toast('交換モードをOFFにしました');
}

async function sendPresence() {
  await api('/exchange?action=presence', {
    method: 'POST',
    body: JSON.stringify({
      userId: state.userId,
      lat: state.lat,
      lng: state.lng,
      accuracy: state.accuracy,
    }),
  });
}

async function refreshNearby() {
  if (!state.exchangeOn || state.lat == null) return;
  const params = new URLSearchParams({
    userId: state.userId,
    lat: state.lat,
    lng: state.lng,
    maxDistance: '50',
  });
  const data = await api('/exchange?action=nearby&' + params.toString());
  state.nearby = data.nearby || [];
  renderNearby();
}

function renderNearby() {
  const el = document.getElementById('nearby-list');
  if (!state.nearby.length) {
    el.innerHTML = '<p class="empty">近くに交換モード中の人はいません<br>（お互いがONにして、50m以内にいる必要があります）</p>';
    return;
  }
  el.innerHTML = state.nearby
    .map(
      (p) => `
      <div class="person-card">
        <h3>${escapeHtml(p.displayName)}</h3>
        <p class="meta">約 ${formatDistance(p.distance_m)}</p>
        <button class="btn small primary" data-trade="${p.userId}">この人と交換する</button>
      </div>
    `
    )
    .join('');

  el.querySelectorAll('[data-trade]').forEach((btn) => {
    btn.addEventListener('click', () => openTradeModal(btn.dataset.trade));
  });
}

async function openTradeModal(toUserId) {
  const myCol = await api('/collection?userId=' + encodeURIComponent(state.userId));
  const spotsData = await api('/spots?userId=' + encodeURIComponent(state.userId));
  const mine = myCol.collection || [];
  if (!mine.length) {
    toast('渡せるシールがありません');
    return;
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>交換内容を選ぶ</h3>
      <label class="hint">渡すシール</label>
      <select id="offer-select">
        ${mine.map((c) => `<option value="${c.spot_id}">${escapeHtml(c.sticker_name)}</option>`).join('')}
      </select>
      <label class="hint">欲しいシール</label>
      <select id="request-select">
        ${(spotsData.spots || [])
          .filter((s) => !s.owned)
          .map((s) => `<option value="${s.id}">${escapeHtml(s.sticker_name)}</option>`)
          .join('')}
      </select>
      <div class="actions">
        <button class="btn secondary" id="modal-cancel">キャンセル</button>
        <button class="btn primary" id="modal-ok">提案する</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.querySelector('#modal-cancel').onclick = () => backdrop.remove();
  backdrop.querySelector('#modal-ok').onclick = async () => {
    const offerSpotId = backdrop.querySelector('#offer-select').value;
    const requestSpotId = backdrop.querySelector('#request-select').value;
    if (!requestSpotId) {
      toast('欲しいシールを選んでください');
      return;
    }
    try {
      await api('/exchange?action=offer', {
        method: 'POST',
        body: JSON.stringify({
          fromUserId: state.userId,
          toUserId,
          offerSpotId,
          requestSpotId,
          fromLat: state.lat,
          fromLng: state.lng,
        }),
      });
      toast('交換を提案しました');
      backdrop.remove();
      await loadOffers();
    } catch (e) {
      toast(e.message);
    }
  };
}

async function loadOffers() {
  const data = await api('/exchange?action=offers&userId=' + encodeURIComponent(state.userId));
  renderOffers(data.offers || []);
}

function renderOffers(offers) {
  const el = document.getElementById('offers-list');
  if (!offers.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML =
    '<p class="hint" style="margin:8px 0">交換の提案</p>' +
    offers
      .map((o) => {
        const isIncoming = o.to_user_id === state.userId;
        return `
          <div class="offer-card">
            <h3>${isIncoming ? '提案が届いています' : '提案中'}</h3>
            <p class="meta">
              渡す: ${escapeHtml(o.offer_sticker_name)} ↔ 欲しい: ${escapeHtml(o.request_sticker_name)}
            </p>
            ${
              isIncoming
                ? `
              <button class="btn small primary" data-accept="${o.id}">受け入れる</button>
              <button class="btn small secondary" data-reject="${o.id}">断る</button>
            `
                : '<span class="badge far">相手の応答待ち</span>'
            }
          </div>
        `;
      })
      .join('');

  el.querySelectorAll('[data-accept]').forEach((btn) => {
    btn.addEventListener('click', () => respondOffer(btn.dataset.accept, true));
  });
  el.querySelectorAll('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', () => respondOffer(btn.dataset.reject, false));
  });
}

async function respondOffer(offerId, accept) {
  try {
    await api('/exchange?action=respond', {
      method: 'POST',
      body: JSON.stringify({ offerId, userId: state.userId, accept }),
    });
    toast(accept ? '交換が成立しました！' : '提案を断りました');
    await loadOffers();
    await loadCollection();
  } catch (e) {
    toast(e.message);
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== 初期化 =====
async function init() {
  state.userId = getUserId();
  initMap();

  try {
    await api('/me', {
      method: 'POST',
      body: JSON.stringify({ userId: state.userId }),
    });
  } catch (_) {}

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

init();