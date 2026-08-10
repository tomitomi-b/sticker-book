# 電子シール帳（PWA）

位置情報でシールを集めて、近くにいる人とだけ交換できる電子シール帳です。

- 収集: GPSでスポット範囲内にいると取得可能
- 制限: 同じシールは1人1枚まで
- 交換: 両者が交換モードONかつ約50m以内のときのみ
- 技術: Cloudflare Pages + Functions + D1（無料枠で運用可能）

## 必要なもの

- Cloudflare アカウント（無料）
- Node.js 18以上
- ターミナル（Mac/Windows/Linux）

## セットアップ手順

詳細はチャットの手順に従ってください。

### ざっくり流れ

1. Cloudflare にログイン
2. `npm install` で wrangler を入れる
3. `npx wrangler login` で認証
4. D1 データベース作成 → `schema.sql` を流す
5. `wrangler.toml` に database_id を書く
6. `npx wrangler pages deploy public` で公開

## ローカル開発

```bash
npm install
npx wrangler d1 execute sticker-book-db --local --file=./schema.sql
npx wrangler pages dev public --d1=DB=sticker-book-db
```

ブラウザで `http://localhost:8788` を開く。

※ 位置情報は HTTPS か localhost でのみ動きます。

## API 一覧

| パス | 説明 |
|------|------|
| POST /api/me | ユーザー登録・更新 |
| GET /api/spots | スポット一覧（lat/lng で距離付き） |
| POST /api/claim | シール取得 |
| GET /api/collection | 所持一覧 |
| POST /api/exchange?action=presence | 交換モード位置更新 |
| GET /api/exchange?action=nearby | 近くの人 |
| POST /api/exchange?action=offer | 交換提案 |
| POST /api/exchange?action=respond | 提案に応答 |
| GET /api/exchange?action=offers | 自分の提案一覧 |
| POST /api/exchange?action=leave | 交換モード終了 |
