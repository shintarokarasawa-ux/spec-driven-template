# 要求内容

## 概要

frontend/のサンプル機能(tasks)を「実APIに接続する形」に進化させる。
現状のqueryFn内モックを実際のfetchベースに置き換え、バックエンド不在でも
動作・テストできるようMSWでHTTP層をモックする。

## 背景

現サンプルはqueryFnが固定配列を返すだけで、実プロジェクトで最初に必要になる
「バックエンドAPIへの接続」の実例がない。APIクライアントの置き場所・レスポンス検証・
更新系(mutation)・モック維持の規約を、動くコードとスキル文書の両方で示したい。

## 実装対象の機能

### 1. 共通APIクライアント(`src/lib/api-client.ts`)
- ベースURL(`VITE_API_BASE_URL`、既定 `/api`)とJSON処理・エラー変換を一元化
- HTTPエラーをステータス付きの`ApiError`に変換

### 2. レスポンスの型検証(Zod)
- tasksのレスポンスをZodスキーマでパースしてから使う(型はz.inferで導出)

### 3. 更新系の実例(useMutation)
- タスク追加フォーム(POST /api/tasks)を追加
- 成功時に`invalidateQueries`で一覧を再取得する基本形を示す

### 4. MSWによるHTTPモック
- 開発時: ブラウザworkerで`/api/*`をインターセプト(実バックエンド接続時は環境変数で無効化)
- テスト時: msw/nodeで同じハンドラを使用(fetch層まで含めてテスト)
- ハンドラがAPI契約のドキュメントを兼ねる

### 5. スキル・ドキュメント反映
- react-frontendスキル(patterns.md / add-feature.md / SKILL.md)にAPI接続規約を追記
- frontend/.env.example を追加

## 受け入れ条件

- [ ] `pnpm build` / `pnpm test` / `pnpm check` が全て成功する
- [ ] タスク追加(mutation)がUIから動作し、テストで検証されている
- [ ] api.tsに固定配列モックが残っていない(モックはMSWハンドラに一元化)
- [ ] `VITE_API_MOCK=false`で実APIに切り替えられる構成になっている
- [ ] スキル文書がコードと一致している

## スコープ外

- 実バックエンド(FastAPI等)の実装
- 認証(トークン付与)の実例(パターンの記述のみ)
- Playwright E2Eの実行検証

## 参照ドキュメント

- `.steering/20260707-react-frontend-support/` - 前回のフロントエンド基盤導入
- `.claude/skills/react-frontend/` - 更新対象のスキル
