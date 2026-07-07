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

- [ ] 変更をコミット(pushはユーザーが実行)

---

## 実装後の振り返り

### 実装完了日
{YYYY-MM-DD}

### 計画と実績の差分

**計画と異なった点**:
- {記入}

### 学んだこと

- {記入}

### 次回への改善提案
- {記入}
