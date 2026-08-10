# 電子シール帳 — Cloudflare セットアップ手順

すでに Cloudflare を使っている前提の手順です。

## 1. ファイルを用意

このフォルダ（`sticker-book`）を PC に置きます。

```bash
cd sticker-book
npm install
```

## 2. ログイン（未ログインの場合のみ）

```bash
npx wrangler login
```

## 3. D1 データベース作成

```bash
npx wrangler d1 create sticker-book-db
```

表示される `database_id` をコピーし、`wrangler.toml` を編集します。

```toml
database_id = "ここにコピーしたID"
```

## 4. テーブル作成（本番DB）

```bash
npx wrangler d1 execute sticker-book-db --remote --file=./schema.sql
```

## 5. デプロイ

**必ずプロジェクトのルート（sticker-book フォルダ）で実行**してください。  
`functions/` と `public/` が同じ階層にある状態で:

```bash
npx wrangler pages deploy public --project-name=sticker-book
```

初回は新規プロジェクト作成の確認が出ます → Yes。

完了後に表示される URL（例: `https://sticker-book.pages.dev`）を開きます。

## 6. D1 バインディング確認（重要）

デプロイ後、Cloudflare ダッシュボードで:

1. **Workers & Pages** → **sticker-book**
2. **Settings** → **Functions** → **D1 database bindings**
3. 変数名 `DB` に `sticker-book-db` が紐づいているか確認

`wrangler.toml` の設定で自動付くことも多いですが、付いていない場合はダッシュボードから追加してください。

## 7. 動作確認

1. スマホで pages.dev の URL を開く
2. 位置情報を許可
3. 「現在地を取得して近くを探す」をタップ

サンプルスポットは渋谷・東京駅・明治神宮・浅草寺・スカイツリーです。  
家で試す場合は、自分の緯度経度でスポットを追加してください。

### 自宅テスト用スポット追加例

Googleマップで自宅を長押し → 座標をコピーして:

```bash
npx wrangler d1 execute sticker-book-db --remote --command="INSERT INTO spots (id, name, description, lat, lng, radius_m, sticker_name) VALUES ('spot-home', 'テスト地点', '自宅テスト用', 35.XXXX, 139.XXXX, 300, 'テストシール')"
```

## ローカル開発

```bash
npx wrangler d1 execute sticker-book-db --local --file=./schema.sql
npx wrangler pages dev public --d1=DB=sticker-book-db
```

http://localhost:8788 を開く（位置情報は localhost で動作します）。

## ファイル構成

```
sticker-book/
├── wrangler.toml          # Cloudflare設定（database_id を要編集）
├── schema.sql             # DB定義 + 初期スポット
├── package.json
├── functions/api/         # サーバーAPI（Pages Functions）
│   ├── me.js
│   ├── spots.js
│   ├── claim.js
│   ├── collection.js
│   └── exchange.js
└── public/                # フロント（PWA）
    ├── index.html
    ├── app.js
    ├── style.css
    ├── manifest.json
    └── sw.js
```

## API 一覧

| パス | 説明 |
|------|------|
| POST /api/me | ユーザー登録 |
| GET /api/spots | スポット一覧 |
| POST /api/claim | シール取得 |
| GET /api/collection | 所持一覧 |
| /api/exchange?action=... | 交換（presence / nearby / offer / respond / offers / leave） |
