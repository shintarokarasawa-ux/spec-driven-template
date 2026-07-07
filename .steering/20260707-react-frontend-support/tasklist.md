# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 未完了タスク(`[ ]`)を残したまま作業を終了しない

---

## フェーズ1: スキャフォールドと依存導入

- [x] `pnpm create vite frontend --template react-ts` でベース作成
- [x] 依存導入
  - [x] react-router、@tanstack/react-query、zustand
  - [x] tailwindcss、@tailwindcss/vite、shadcn/ui関連(clsx等)
  - [x] vitest、@testing-library/react、jsdom、@playwright/test
  - [x] @biomejs/biome

## フェーズ2: 設定ファイル

- [x] vite.config.ts(react + tailwind + vitest設定、@エイリアス)
- [x] tsconfig(パスエイリアス)
- [x] biome.json
- [x] playwright.config.ts + e2e/smoke.spec.ts
- [x] src/index.css(Tailwind+shadcn/uiテーマ。CLI規約に合わせstyles/globals.cssからパス変更)
  + shadcn/ui初期化(components.json手動作成→CLIでbutton/card取得、lib/utils.ts手動作成)
- [x] package.json scripts(dev/build/test/check/format/e2e)

## フェーズ3: app層とサンプル機能スライス

- [x] src/app/(providers.tsx, query-client.ts, router.tsx, root-layout.tsx, home-page.tsx)
- [x] src/features/tasks/(types.ts, api.ts, store.ts, components/, routes.tsx)
- [x] トップページからのナビゲーションを含む最小画面構成

## フェーズ4: テストと検証

- [x] storeのユニットテスト、コンポーネントのRTLテストを作成
- [x] `pnpm install` / `pnpm build` / `pnpm test` / `pnpm check` が全て成功
- [x] 不要ファイル(create viteの残骸)の削除(App.tsx, App.css, assets/, icons.svg, oxlint設定。faviconは自作の汎用アイコンに置換)

## フェーズ5: スキルとテンプレート統合

- [x] `.claude/skills/react-frontend/`(SKILL.md, patterns.md, add-feature.md)
- [x] `.claude/settings.json` に Skill(react-frontend) を許可追加
- [x] devcontainer.json(Node 22 feature + pnpm + frontend install + Biome/Tailwind拡張)
- [x] .gitignore にNode系エントリ追加
- [x] CLAUDE.md 更新(技術スタック・フロントエンド開発ルール)
- [x] README.md 更新(フロントエンド節・カスタマイズ指針)

## フェーズ6: コミット

- [x] 変更をコミット(865d30b)し、origin/main へpush済み

---

## 実装後の振り返り

### 実装完了日
2026-07-08

### 計画と実績の差分

**計画と異なった点**:
- グローバルCSSは設計時の`src/styles/globals.css`ではなく、shadcn/ui CLIとViteの規約に
  合わせて`src/index.css`とした
- create-viteの現行scaffoldがoxlint同梱だったため、Biomeへ統一する除去作業が発生
- TypeScript 6.0で`baseUrl`が非推奨エラーになるため、`paths`のみの相対指定に変更
- Biome 2.5はTailwindディレクティブ(`@apply`等)を既定で拒否するため、
  `css.parser.tailwindDirectives: true`を設定
- pushは前回(履歴置換)と異なり通常の増分pushだったため、Claude Codeから直接成功した

### 学んだこと

- shadcn/ui CLIは`components.json`を事前に手書きしておけば`add`コマンドだけで
  非対話導入できる(`init`の対話を回避できる)。`lib/utils.ts`は生成されない場合が
  あるため手動作成が必要
- 検証環境のNode(18・EOL)と最新フロントエンドスタックの要求(Node 20+)の乖離は、
  `~/.local`へのNodeユーザーインストールで解決できる(corepackは署名鍵問題があり
  npm経由のpnpm導入が確実)
- サンプル機能スライス(features/tasks)を「参照実装」としてスキルから指す構成は、
  規約文書とコードの乖離を防ぐのに有効

### 次回への改善提案
- CI(GitHub Actions)でfrontendのcheck/test/buildを回すワークフロー追加を検討
- shadcn/uiコンポーネント追加やAPI接続(モック→実API差し替え)の実例が増えたら
  patterns.mdに反映する
