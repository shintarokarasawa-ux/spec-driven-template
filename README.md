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
| 開発環境 | Python 3.11+ / uv / Dev Container / ruff / mypy / pytest / pre-commit |

## 使い方

### 1. このテンプレートからリポジトリを作成

GitHubの「Use this template」、または clone して利用してください。

```bash
git clone [このリポジトリ] my-project
cd my-project
```

Dev Containerに対応しています。Visual Studio Codeで「Reopen in Container」を選択すると、uvと依存関係が自動でセットアップされます。手動の場合:

```bash
uv sync --dev
uv run pre-commit install
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
├── .devcontainer/         # Python 3.11 + uv + Claude Code
└── pyproject.toml         # ruff / mypy / pytest 設定込みの最小構成
```

開発フローの詳細は [CLAUDE.md](CLAUDE.md) を参照してください。

## 開発コマンド

```bash
uv run ruff check .           # Lint
uv run ruff format .          # フォーマット
uv run mypy .                 # 型チェック
uv run pytest                 # テスト
```

## カスタマイズ

- `pyproject.toml` の `name` と依存関係をプロジェクトに合わせて変更してください
- Python以外のスタックで使う場合は、`pyproject.toml`・`.devcontainer/`・`.pre-commit-config.yaml` を差し替えてください(ドキュメント体系とスキルは言語非依存です)

## ライセンス

[MIT License](LICENSE)
