-- ユーザー（端末IDベースの簡易認証）
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- スポット（シール取得場所）
CREATE TABLE IF NOT EXISTS spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 150,
  sticker_name TEXT NOT NULL,
  sticker_image TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 所持シール（同じシールは1人1枚）
CREATE TABLE IF NOT EXISTS collections (
  user_id TEXT NOT NULL,
  spot_id TEXT NOT NULL,
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, spot_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (spot_id) REFERENCES spots(id)
);

-- 交換モード中の位置情報（近接マッチング用）
CREATE TABLE IF NOT EXISTS exchange_presence (
  user_id TEXT PRIMARY KEY,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  accuracy REAL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 交換提案
CREATE TABLE IF NOT EXISTS trade_offers (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  offer_spot_id TEXT NOT NULL,
  request_spot_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending / accepted / rejected / cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id),
  FOREIGN KEY (offer_spot_id) REFERENCES spots(id),
  FOREIGN KEY (request_spot_id) REFERENCES spots(id)
);

-- 初期スポット例（東京周辺・テスト用）
INSERT OR IGNORE INTO spots (id, name, description, lat, lng, radius_m, sticker_name, sticker_image) VALUES
  ('spot-shibuya', '渋谷スクランブル交差点', '渋谷のシンボル。近くにいるとゲットできます', 35.6595, 139.7005, 200, '渋谷スクランブルシール', NULL),
  ('spot-tokyo-station', '東京駅丸の内', '東京駅丸の内口周辺', 35.6812, 139.7671, 200, '東京駅シール', NULL),
  ('spot-meiji-jingu', '明治神宮', '原宿・明治神宮の参道付近', 35.6764, 139.6993, 250, '明治神宮シール', NULL),
  ('spot-sensoji', '浅草寺', '雷門・浅草寺周辺', 35.7148, 139.7967, 200, '浅草寺シール', NULL),
  ('spot-skytree', '東京スカイツリー', '押上・スカイツリー周辺', 35.7101, 139.8107, 200, 'スカイツリーシール', NULL);
