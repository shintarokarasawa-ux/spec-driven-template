# 設計書

## アーキテクチャ概要

ルートは言語非依存(CLAUDE.md・docs/・.claude/)のまま、`frontend/` を自己完結した
ワークスペースとして追加する。Pythonプロジェクトでは`frontend/`を、フロントエンド専用
プロジェクトでは`pyproject.toml`等を削除して使う「引き算式」のひな形とする。

```
リポジトリルート(言語非依存: スペック駆動開発の仕組み)
├── pyproject.toml            # Python側(不要なら削除)
└── frontend/                 # React側(不要なら削除)
    └── Vite + React + TS(自己完結: 依存・設定・テストを内包)
```

## コンポーネント設計

### 1. frontend/ ディレクトリ構造(機能スライス)

```
frontend/
├── package.json              # scripts: dev/build/test/check/e2e
├── vite.config.ts            # @vitejs/plugin-react + @tailwindcss/vite + vitestの設定
├── tsconfig.json             # @/* → src/* のパスエイリアス
├── biome.json
├── playwright.config.ts
├── components.json           # shadcn/ui設定
├── index.html
├── e2e/
│   └── smoke.spec.ts
└── src/
    ├── main.tsx              # エントリ(providers + router)
    ├── app/
    │   ├── providers.tsx     # QueryClientProvider等の合成
    │   ├── query-client.ts   # TanStack Query既定値(staleTime・retry)
    │   └── router.tsx        # createBrowserRouter(機能スライスのroutesを集約)
    ├── components/ui/        # shadcn/ui生成コンポーネント
    ├── lib/utils.ts          # cn()ヘルパー
    ├── styles/globals.css    # Tailwind + テーマ変数
    └── features/tasks/       # サンプル機能スライス
        ├── api.ts            # データ取得(Query hooks)。API未接続のためモック実装
        ├── store.ts          # Zustand(クライアント状態: フィルタ)
        ├── components/       # TaskList等(shadcn/ui使用)
        ├── routes.tsx        # このスライスのルート定義
        └── *.test.tsx        # コロケーションでVitest+RTL
```

**サンプル機能「tasks」の配線が示すパターン**:
- サーバー状態(タスク一覧)は`useQuery`、クライアント状態(表示フィルタ)は`zustand`と分離
- ルートは機能スライス側で定義し、`app/router.tsx`が集約(機能追加時にappの変更を最小化)
- コンポーネントはUI(components/ui) → 機能コンポーネント(features/*/components)の2層

### 2. react-frontendスキル

```
.claude/skills/react-frontend/
├── SKILL.md          # 使用タイミング(React実装・レビュー時)とパターンの索引
├── patterns.md       # 配線規約: 状態の置き場所判断・層の責務・命名・エラー/ローディング規約
└── add-feature.md    # 新規機能スライス追加の定型手順(ファイル一式→router登録→テスト)
```

`.claude/settings.json` の許可リストに `Skill(react-frontend)` を追加。

### 3. devcontainer統合

- features に `ghcr.io/devcontainers/features/node:1`(version 22)を追加
- postCreateCommand に pnpm導入(`npm i -g pnpm`)と
  `if [ -f frontend/package.json ]; then (cd frontend && pnpm install); fi` を追加
- Biome/Tailwind/PlaywrightのVS Code拡張を追加

### 4. ドキュメント統合

- CLAUDE.md: 技術スタックにフロントエンド行を追加、frontend/の構造説明を追記
- README: フロントエンドのセットアップ・開発コマンド・カスタマイズ(片側削除)を追記
- .gitignore: node_modules/・dist/・playwright成果物等を追加

## バージョン方針

- 実験環境(Node 22.12 + pnpm 10)で実際にinstall/build/testが通ったバージョンを
  package.jsonに記録し、pnpm-lock.yamlを同梱する(再現性優先)
- Tailwindはv4(@tailwindcss/vite)、shadcn/uiはCLI生成物を同梱

## エラーハンドリング戦略

- shadcn/ui CLIが非対話実行できない場合: components.json・lib/utils.ts・button等を
  公式生成物と同等の内容で手動作成する
- Playwrightのブラウザ取得はスコープ外(設定ファイルのみ同梱、READMEに導入手順を記載)

## テスト戦略

- ユニット: サンプル機能のstore(Zustandのフィルタロジック)とコンポーネント(RTL)
- ビルド: `pnpm build`(tsc + vite build)で型・バンドルを検証
- 静的検査: `pnpm check`(Biome)
- E2E: 設定とスモークテストを同梱(実行は利用者環境)

## 実装の順序

1. スキャフォールド(create vite)と依存導入
2. Tailwind/shadcn/Biome/Vitest/Playwright設定
3. app層(providers/query-client/router)とサンプル機能スライス
4. テスト作成と検証(install/build/test/check)
5. スキル作成(react-frontend)
6. devcontainer・CLAUDE.md・README・.gitignore更新
7. コミット(pushはユーザー実行)

## セキュリティ考慮事項

- APIキー等は`frontend/.env.local`(gitignore対象)で管理し、`VITE_`プレフィックスの
  公開変数と区別することをスキルに明記
