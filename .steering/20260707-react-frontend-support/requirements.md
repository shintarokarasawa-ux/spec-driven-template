# 要求内容

## 概要

spec-driven-templateを拡張し、ReactでFront-endアプリケーションを構築するための
スタック一式と、それらのオーケストレーション(配線パターン+Claude Codeスキルによる
定型実装の自動化)を同梱したひな形にする。

## 背景

現テンプレートはPython/uv前提。フロントエンドプロジェクトでも同じスペック駆動開発
フローを使えるようにしたい。ライブラリ選定・配線・テスト構成を毎回ゼロから決めるのは
コストが高いため、動作する定番構成と実装パターンをテンプレートに焼き込む。

## 採用スタック(ユーザー確定済み)

- ベース: Vite + React + TypeScript(SPA、ルーティングはReact Router)
- サーバー状態: TanStack Query / クライアント状態: Zustand
- UI: Tailwind CSS + shadcn/ui
- テスト: Vitest + Testing Library(ユニット)、Playwright(E2E)
- ツール: pnpm、Biome(Lint/Format)

## 実装対象の機能

### 1. `frontend/` ベースラインアプリ
- 上記スタックが配線済みで、`pnpm install && pnpm dev` で即起動する
- 機能スライス構造(`src/features/`)のサンプル機能を1つ同梱し、
  ルーティング×Query×Zustand×UIコンポーネントの結線例を示す
- ユニットテスト・E2E設定・Biome設定込み

### 2. Reactオーケストレーションのスキル化
- `.claude/skills/react-frontend/`: 実装パターン集(層の責務・配線規約・テスト方針)と
  新規機能追加の定型手順を定義し、/add-feature や会話からの実装時にロードされる

### 3. テンプレート統合
- devcontainerにNode 22 + pnpmを追加(Python環境と共存)
- CLAUDE.md・README・.gitignoreをフロントエンド対応に更新
- Python不要のプロジェクトでは`pyproject.toml`等を削除すれば良いことを明記

## 受け入れ条件

### frontend/ ベースライン
- [ ] `pnpm install` → `pnpm build` が成功する
- [ ] `pnpm test`(Vitest)が成功する(サンプル機能のテスト含む)
- [ ] `pnpm check`(Biome)が成功する
- [ ] サンプル機能がルーティング・Query・Zustand・shadcn/ui・Tailwindを横断して使っている

### スキル
- [ ] react-frontendスキルに配線規約・ディレクトリ規約・新規機能追加手順が記載されている
- [ ] SKILL.mdのdescriptionでReact実装時に自動ロードされる記述になっている

### 統合
- [ ] devcontainer再構築でNode/pnpm/依存が自動セットアップされる定義になっている
- [ ] CLAUDE.md・READMEにフロントエンドの使い方が記載されている

## スコープ外

- Next.js等SSR構成のバリアント
- バックエンドAPIの実装(サンプル機能はモック/ローカルデータで完結)
- Playwright E2Eの実行検証(ブラウザバイナリが大きいため設定同梱のみ。実行は利用者環境で)
- CI(GitHub Actions)ワークフローの追加

## 参照ドキュメント

- `CLAUDE.md` - スペック駆動開発の基本原則
- `.claude/skills/development-guidelines/` - 既存のPython向けガイドライン(粒度の参考)
