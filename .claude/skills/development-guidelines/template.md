# 開発ガイドライン (Development Guidelines)

## 技術スタック前提

| 項目 | 採用技術 |
|------|---------|
| 言語 | Python 3.11+ |
| フレームワーク | [プロジェクトに応じて記載（例: LangChain / LangGraph, FastAPI）] |
| パッケージマネージャー | uv |
| データベース | [プロジェクトに応じて記載（例: SQLite, PostgreSQL）] |
| Lint・フォーマット | Ruff |
| 型チェック | mypy |
| テスト | pytest |

## コーディング規約

### 命名規則

#### 変数・関数

**Python**:
```python
# ✅ 良い例
task_history = fetch_task_history("TASK-123")
def calculate_completion_rate(tasks: list[Task], window_days: int) -> float: ...

# ❌ 悪い例
data = fetch("TASK-123")
def calc(arr, n): ...
```

**原則**:
- 変数: snake_case、名詞または名詞句
- 関数: snake_case、動詞で始める
- 定数: UPPER_SNAKE_CASE
- Boolean: `is_`, `has_`, `should_`で始める
- プライベート: アンダースコア接頭辞

#### クラス・型

```python
# クラス: PascalCase、名詞
class ReportGenerator: ...
class TaskRepository: ...

# Pydanticモデル: PascalCase、データの役割を表す名詞
class ReviewResult(BaseModel):
    item_id: str
    score: float = Field(ge=0, le=100)
    rationale: str

# Enum・型エイリアス: PascalCase
class Priority(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

TaskId = str
```

### コードフォーマット

**ツール**: Ruff（lintとformatの両方、設定は`pyproject.toml`に集約）

**インデント**: 4スペース

**行の長さ**: 最大[88/100/120]文字

### 型ヒント

すべての公開関数に型ヒントを必須とする。Python 3.11+の組み込みジェネリクス（`list[str]`, `dict[str, int]`, `X | None`）を使用する。

### コメント規約

**関数・クラスのドキュメント（Googleスタイルdocstring）**:
```python
def calculate_completion_rate(tasks: list[Task], window_days: int = 7) -> float:
    """直近期間のタスク完了率を計算する。

    Args:
        tasks: 対象タスクの一覧（作成日の古い順）
        window_days: 集計対象とする直近日数

    Returns:
        完了率（例: 0.25 = 25%）

    Raises:
        InsufficientDataError: 対象期間のタスクが存在しない場合
    """
```

**インラインコメント**:
```python
# ✅ 良い例: なぜそうするかを説明
# アーカイブ済みタスクは完了率の分母を歪めるため除外する
tasks = [t for t in tasks if not t.is_archived]

# ❌ 悪い例: 何をしているか(コードを見れば分かる)
# タスクをフィルタする
tasks = [t for t in tasks if not t.is_archived]
```

### エラーハンドリング

**原則**:
- 予期されるエラー: プロジェクト共通の基底例外を継承したエラークラスを定義
- 予期しないエラー: 上位に伝播
- エラーを無視しない
- [プロジェクト固有の隔離方針があれば記載（例: データソース単位で失敗を隔離し、欠損を記録）]

**例**:
```python
# エラークラス定義
class AppError(Exception):
    """プロジェクト共通の基底例外"""

class DataFetchError(AppError):
    def __init__(self, source: str, resource_id: str | None = None, cause: Exception | None = None):
        self.source = source
        self.resource_id = resource_id
        super().__init__(f"データ取得に失敗: source={source}, resource_id={resource_id}")

# エラーハンドリング
try:
    items = external_source.fetch(candidates)
except DataFetchError as e:
    # 予期されるエラー: ソース単位で隔離し、欠損を記録
    logger.warning("外部ソースの取得をスキップ: %s", e)
    state["missing_sources"].append(e.source)
```

### LLM呼び出しの規約（該当する場合）

- 構造化出力（`with_structured_output` + Pydanticモデル）を必須とし、自由文のパースを禁止
- temperatureは[0/プロジェクトの方針]を基本とする
- LLMを呼ぶ前に機械的な絞り込みを行い、ループ内でLLMを呼ばない
- プロンプトはコードと分離し、[`prompts/`等]で管理する
- 呼び出し回数・トークン数をログに記録する

### 機密情報の管理

- APIキー等は環境変数（pydantic-settings + `.env`）から読み込み、ハードコード禁止
- `.env`はgitignore対象、`.env.example`にキー名のみ記載

## Git運用ルール

### ブランチ戦略

**ブランチ種別**:
- `main`: 常に動作する安定版
- `feature/[機能名]`: 新機能開発
- `fix/[修正内容]`: バグ修正
- `refactor/[対象]`: リファクタリング

**フロー（GitHub Flow）**:
```
main
  ├─ feature/weekly-summary
  ├─ feature/task-search
  └─ fix/cache-stale
```

[個人開発フェーズはGitHub Flow。チーム開発移行時にdevelopブランチ追加（Git Flow）を検討]

### コミットメッセージ規約

**フォーマット**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、補助ツール等

**Scope例**: [`core`, `data`, `report`, `db`, `cli` 等、プロジェクトのパッケージ構成に合わせる]

**例**:
```
feat(report): 週次サマリーレポートを追加

集計ロジックによる機械的な絞り込みとLLM要約の2段構成で
実装しました。
- ReportGeneratorクラスを追加
- 構造化出力（ReviewResult）でLLM要約結果を取得

Closes #12
```

### プルリクエストプロセス

**作成前のチェック**:
- [ ] 全てのテストがパス（`uv run pytest`）
- [ ] Lintエラーがない（`uv run ruff check .`）
- [ ] 型チェックがパス（`uv run mypy .`）
- [ ] 自動テストが実LLM・外部サービスに依存していない
- [ ] 競合が解決されている

**PRテンプレート**:
```markdown
## 概要
[変更内容の簡潔な説明]

## 変更理由
[なぜこの変更が必要か]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] ユニットテスト追加
- [ ] 手動テスト実施（実行コマンドと結果）

## LLMコストへの影響(該当する場合)
[LLM呼び出し回数・トークン数の増減見込み]

## 関連Issue
Closes #[Issue番号]
```

**レビュープロセス**:
1. セルフレビュー
2. 自動テスト実行
3. レビュアーアサイン
4. レビューフィードバック対応
5. 承認後マージ

## テスト戦略

### テストの種類

#### ユニットテスト

**対象**: 集計・判定ロジック、Pydanticモデルのバリデーション、パーサー

**カバレッジ目標**: [80/90/100]%

**例**:
```python
class TestCalculateCompletionRate:
    def test_returns_rate_with_sufficient_data(self) -> None:
        # Given
        tasks = completed_tasks(3) + open_tasks(1)

        # When
        result = calculate_completion_rate(tasks, window_days=7)

        # Then
        assert result == pytest.approx(0.75)

    def test_raises_insufficient_data_error_when_no_tasks(self) -> None:
        with pytest.raises(InsufficientDataError):
            calculate_completion_rate([], window_days=7)
```

#### 統合テスト

**対象**: 処理パイプライン全体の遷移（モックLLM使用）、リポジトリのCRUD、レポート生成

**例**:
```python
def test_summary_pipeline_returns_entries(in_memory_repository) -> None:
    pipeline = build_summary_pipeline(llm=fake_llm(), repository=in_memory_repository)

    result = pipeline.invoke(initial_state(tasks=sample_tasks(100)))

    assert result["entries"]
```

#### E2Eテスト

**対象**: CLI実行 → レポートファイル生成までの主要フロー（通知はdry-run、LLMはモック）

**例**:
```python
def test_report_dry_run_generates_html(tmp_path: Path) -> None:
    result = runner.invoke(app, ["report", "--dry-run", "--output", str(tmp_path)])

    assert result.exit_code == 0
    assert (tmp_path / "report.html").exists()
```

### テスト命名規則

**パターン**: `test_[対象や条件]_[期待結果]`

**例**:
```python
# ✅ 良い例
def test_create_with_empty_title_raises_validation_error(): ...
def test_find_by_id_existing_returns_task(): ...
def test_summary_excludes_archived_tasks(): ...

# ❌ 悪い例
def test_1(): ...
def test_works(): ...
```

### モック・スタブの使用

**原則**:
- 外部依存(LLM API、外部サービス、DB、通知送信)はモック化
- ビジネスロジックは実装を使用
- **自動テストで実LLM API・外部サービスを呼ばない**

**例**:
```python
# LLMは構造化出力スタブでモック化
fake_llm = FakeStructuredLLM(responses=[
    ReviewResult(item_id="TASK-123", score=85, rationale="影響範囲が広く優先度が高い"),
])

# 外部サービスは保存済みレスポンスフィクスチャでパーサーをテスト
payload = (fixtures_dir / "items_response.json").read_text()

# DBはインメモリDBを使用
repository = TaskRepository(":memory:")
```

## コードレビュー基準

### レビューポイント

**機能性**:
- [ ] 要件を満たしているか
- [ ] エッジケース（データ欠損・境界値・削除済みリソース等）が考慮されているか
- [ ] エラーハンドリングが適切か

**可読性**:
- [ ] 命名が明確か
- [ ] 型ヒントとdocstringが適切か
- [ ] 複雑なロジックが説明されているか

**保守性**:
- [ ] 重複コードがないか
- [ ] 責務が明確に分離されているか（取得とパース、計算と整形）
- [ ] データ取得が抽象化レイヤーを経由しているか

**コスト・パフォーマンス**:
- [ ] ループ内でLLM・HTTP・DBを呼んでいないか
- [ ] キャッシュ可能なデータを毎回取得していないか
- [ ] DBクエリが最適化されているか（N+1がないか）

**セキュリティ**:
- [ ] 入力・外部データの検証が適切か
- [ ] 機密情報がハードコードされていないか
- [ ] SQLがプレースホルダを使用しているか

### レビューコメントの書き方

**建設的なフィードバック**:
```markdown
## ✅ 良い例
この実装だと全アイテムでLLMを呼ぶため、コストが大きく膨らみます。
機械的なフィルタで候補を絞ってからLLM精査に回してはどうでしょうか？

## ❌ 悪い例
この書き方は良くないです。
```

**優先度の明示**:
- `[必須]`: 修正必須
- `[推奨]`: 修正推奨
- `[提案]`: 検討してほしい
- `[質問]`: 理解のための質問

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Python | 3.11+ | devcontainerに同梱 |
| uv | 最新 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone [URL]
cd [project-name]

# 2. 依存関係のインストール
uv sync --dev

# 3. 環境変数の設定
cp .env.example .env
# .envファイルを編集（ANTHROPIC_API_KEY等）

# 4. 動作確認
uv run pytest
uv run [CLIコマンド] --help
```

### 推奨開発ツール(該当する場合)

- [ツール1]: [説明]
- [ツール2]: [説明]
