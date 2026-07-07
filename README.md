# Spec-Driven Template

Claude Codeでスペック駆動開発を行うためのプロジェクトひな形です。

「何を作るか」を永続ドキュメント(`docs/`)で定義し、「今回何をするか」をステアリングファイル(`.steering/`)で計画してから実装する開発スタイルを、Claude Codeのスキル・コマンドとして体系化しています。

## 特徴

| 要素 | 内容 |
|------|------|
| 永続ドキュメント | PRD・機能設計・アーキテクチャ・リポジトリ構造・開発ガイドライン・用語集の6点を対話的に作成 |
| ステアリングファイル | 作業単位の要求・設計・タスクリストを`.steering/`に記録し、進捗をリアルタイムに追跡 |
| スキル群 | 各ドキュメントの作成ガイド・テンプレートを`.claude/skills/`に同梱 |
| サブエージェント | ドキュメントレビュー・実装検証の専用エージェントを同梱 |
| フロントエンド基盤 | Vite + React + TypeScriptのベースライン(`frontend/`)。TanStack Query・Zustand・Zod・MSW・Tailwind CSS・shadcn/ui・Vitest・Playwright・Biomeが配線済みで、実装パターンは`react-frontend`スキルに定義 |
| エージェントバックエンド | Snowflake Cortex Agentsの多層(マスター+サブ)構造のSQL資産(`snowflake/`)と、Run APIを叩くFastAPI BFF(`backend/`)。設計規約は`snowflake-agents`スキルに定義 |
| 開発環境 | Dev Container(Python 3.11+ / uv、Node 22 / pnpm、Snowflake CLI) / ruff / mypy / pytest / pre-commit |

## 使い方

### 1. このテンプレートからリポジトリを作成

GitHubの「Use this template」、または clone して利用してください。

```bash
git clone [このリポジトリ] my-project
cd my-project
```

Dev Containerに対応しています。Visual Studio Codeで「Reopen in Container」を選択すると、uv・pnpmと依存関係が自動でセットアップされます。手動の場合:

```bash
uv sync --dev                  # Python側
uv run pre-commit install
cd frontend && pnpm install    # フロントエンド側
```

### 2. プロジェクトの初期化

Claude Codeを起動し、アイデアや要件のメモを `docs/ideas/` に置いてから:

```
/setup-project
```

対話を通じて6つの永続ドキュメントを1つずつ作成します(各ドキュメントはユーザー承認後に次へ進みます)。

### 3. 機能の追加

```
/add-feature ユーザープロフィール編集
```

ステアリングファイル(要求・設計・タスクリスト)の作成 → 実装 → 検証の定型フローが実行されます。定型フロー以外は普通に会話で依頼してください:

```
> PRDに新機能を追加してください
> architecture.mdのパフォーマンス要件を見直して
> /review-docs docs/product-requirements.md   # 詳細レビューが必要なとき
```

## ディレクトリ構造

```
.
├── CLAUDE.md              # プロジェクトメモリ(開発フローの定義)
├── docs/                  # 永続ドキュメント(プロジェクト全体の「北極星」)
│   └── ideas/             # 下書き・アイデア(自由形式)
├── .steering/             # 作業単位のドキュメント(要求・設計・タスクリスト)
├── .claude/
│   ├── commands/          # /setup-project, /add-feature, /review-docs
│   ├── skills/            # 各ドキュメントの作成ガイドとテンプレート
│   └── agents/            # doc-reviewer, implementation-validator
├── .devcontainer/         # Python 3.11 + Node 22 + uv/pnpm + Claude Code
├── frontend/              # Vite + React + TS ベースライン(サンプル機能スライス入り)
├── backend/               # FastAPI BFF(Cortex Agents Run APIクライアント)
├── snowflake/             # Cortex Agents多層構造のSQL資産(番号順に実行)
└── pyproject.toml         # ruff / mypy / pytest 設定込みの最小構成
```

開発フローの詳細は [CLAUDE.md](CLAUDE.md) を参照してください。

## 開発コマンド

```bash
# Python
uv run ruff check .           # Lint
uv run ruff format .          # フォーマット
uv run mypy .                 # 型チェック
uv run pytest                 # テスト

# フロントエンド(frontend/ で実行)
pnpm dev                      # 開発サーバー(http://localhost:5173)
pnpm build                    # 型チェック + 本番ビルド
pnpm test                     # ユニットテスト(Vitest)
pnpm check                    # Lint + Format検査(Biome)
pnpm e2e                      # E2E(初回は pnpm exec playwright install chromium)

# バックエンドBFF(backend/ で実行)
uv run uvicorn backend.main:app --reload --port 8000
uv run pytest                 # テスト(実Snowflake不要・HTTPは全てモック)
```

## フロントエンドの実装パターン

`frontend/` は機能スライス構造(`src/features/`)を採用しており、サンプル機能
`features/tasks/` がルーティング(React Router)× データ取得・更新(TanStack Query +
Zod検証)× クライアント状態(Zustand)× UI(Tailwind + shadcn/ui)の配線例になっています。

バックエンドAPIは開発・テストともMSW(`src/mocks/handlers.ts`)がモックしており、
バックエンドなしで `pnpm dev` がそのまま動きます。実APIに接続する際は
`frontend/.env.local` に `VITE_API_MOCK=false` を設定するだけです(ハンドラ定義が
そのままAPI契約のドキュメントになります)。

配線規約と新規機能追加の定型手順は `.claude/skills/react-frontend/` に定義されており、
Claude CodeがReact実装時に自動で参照します。

## Snowflakeエージェントバックエンド

Snowflake Cortex Agents/CoWorkで多層エージェント構造を作るための資産を同梱しています:

- `snowflake/` — マスター+サブエージェントのCREATE AGENT、サブ呼び出しUDF(Run API)、
  セマンティックビュー・Cortex Searchサービスなどを番号順に実行するSQL一式
- `backend/` — マスターエージェントを`POST /api/agent/messages`で呼べるFastAPI BFF。
  フロントエンドの`/api/tasks`契約の実装例も含み、`VITE_API_MOCK=false`でReact側と直結できます

アカウント側の手順(PAT発行→デプロイ→CoWork確認)は
`.claude/skills/snowflake-agents/setup.md` を参照してください。
**注意**: SQL資産は実アカウントでの実行検証を行っていません(公式ドキュメント構文準拠)。
初回デプロイは手順書に従って1ファイルずつ確認してください。

## カスタマイズ

- **フロントエンド不要のプロジェクト**: `frontend/` と `.claude/skills/react-frontend/` を削除
- **Snowflake不要のプロジェクト**: `snowflake/`・`backend/` と `.claude/skills/snowflake-agents/` を削除
- **Python不要のプロジェクト**: `pyproject.toml`・`.pre-commit-config.yaml` を削除
- `pyproject.toml` の `name`、`frontend/package.json` の `name` をプロジェクトに合わせて変更してください(ドキュメント体系とスキルは言語非依存です)

## ライセンス

[MIT License](LICENSE)
