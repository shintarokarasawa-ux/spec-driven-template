---
name: react-frontend
description: frontend/(Vite + React + TypeScript)の実装パターンと機能追加の定型手順。React画面・コンポーネント・状態管理・データ取得の実装時、フロントエンドのコードレビュー時に使用する。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# React Frontend スキル

`frontend/` ディレクトリのReactアプリケーションを、テンプレートに焼き込まれた
スタックと配線規約に沿って実装するためのスキルです。

## 採用スタック

| 役割 | 採用技術 |
|------|---------|
| ビルド | Vite + TypeScript |
| ルーティング | React Router(`createBrowserRouter`のデータルーター) |
| サーバー状態 | TanStack Query |
| クライアント状態 | Zustand |
| スキーマ検証 | Zod(APIレスポンスを境界でparse) |
| APIモック | MSW(開発・テスト共通、`src/mocks/handlers.ts`) |
| UI | Tailwind CSS + shadcn/ui |
| ユニットテスト | Vitest + Testing Library |
| E2E | Playwright |
| Lint/Format | Biome(`pnpm check` / `pnpm format`) |
| パッケージマネージャー | pnpm |

## クイックリファレンス

### 実装パターン(配線規約)
状態の置き場所判断・層の責務・命名・エラー/ローディング規約: ./patterns.md

### 新規機能の追加手順
機能スライス一式の作成からルーター登録・テストまでの定型手順: ./add-feature.md

## 使用シーン別ガイド

### 新しい画面・機能を追加する時
1. ./add-feature.md の定型手順に従い、`src/features/[機能名]/` にスライスを作成
2. ./patterns.md の配線規約(サーバー状態/クライアント状態の分離)を守る
3. スライス内にテストをコロケーションで作成

### 既存機能を変更する時
1. 対象スライス(`src/features/[機能名]/`)の構造を読む
2. ./patterns.md で層の責務を確認してから変更
3. `pnpm test` と `pnpm check` で検証

### コードレビュー時
- ./patterns.md の「レビュー観点」を参照

## 開発コマンド(frontend/ で実行)

```bash
pnpm dev          # 開発サーバー(http://localhost:5173)
pnpm build        # 型チェック + 本番ビルド
pnpm test         # ユニットテスト(Vitest)
pnpm check        # Lint + Format検査(Biome)
pnpm format       # 自動修正
pnpm e2e          # E2E(Playwright。初回は pnpm exec playwright install chromium)
```

## チェックリスト(実装完了前)

- [ ] サーバー状態はTanStack Query、クライアント状態はZustandに分離されている
- [ ] HTTPは`apiFetch`経由、レスポンスはZodスキーマでparseされている
- [ ] モックはMSWハンドラ(`src/mocks/handlers.ts`)に一元化されている
- [ ] 新規ルートは機能スライスの`routes.tsx`で定義し、`app/router.tsx`で集約されている
- [ ] ローディング・エラー・空状態がUIに反映されている
- [ ] テストがスライス内にコロケーションされ、`pnpm test`がパスする
- [ ] `pnpm check`(Biome)と`pnpm build`(型チェック込み)がパスする
