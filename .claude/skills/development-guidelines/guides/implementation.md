# 実装ガイド (Implementation Guide)

## Python 規約

### 型ヒント

**すべての公開関数に型ヒントを必須とする**:
```python
# ✅ 良い例: 明示的な型ヒント
def calculate_total(amounts: list[float]) -> float:
    return sum(amounts)

# ❌ 悪い例: 型ヒントなし
def calculate_total(amounts):
    return sum(amounts)
```

**組み込み型の使用（Python 3.11+）**:
```python
# ✅ 良い例: 組み込みジェネリクスを使用
def group_by_status(tasks: list[Task]) -> dict[str, list[Task]]: ...

# ❌ 悪い例: typingモジュールの旧式記法
from typing import List, Dict
def group_by_status(tasks: List[Task]) -> Dict[str, List[Task]]: ...
```

**Optionalは `| None` で表記**:
```python
# ✅ 良い例
def find_task(task_id: str) -> Task | None: ...

# ❌ 悪い例
from typing import Optional
def find_task(task_id: str) -> Optional[Task]: ...
```

### データ構造はPydanticモデルで定義

LLMの構造化出力・コンポーネント間の受け渡し・DB保存対象のデータは、生のdictではなくPydanticモデルで定義します。

**理由**: バリデーションが自動で効き、インターフェースが型で保証されます。LangChainの`with_structured_output`とも直結します。

```python
# ✅ 良い例: Pydanticモデル
class ReviewResult(BaseModel):
    item_id: str
    score: float = Field(ge=0, le=100)
    rationale: str

result = llm.with_structured_output(ReviewResult).invoke(prompt)

# ❌ 悪い例: 生のdictを引き回す
result = {"item_id": "TASK-123", "score": 85, "rationale": "..."}
```

**ワークフローの状態もTypedDictまたはPydanticモデルで定義（LangGraph等を使う場合）**:
```python
class SummaryState(TypedDict):
    candidates: list[str]
    review_results: dict[str, list[ReviewResult]]
    missing_sources: list[str]
    entries: list[SummaryEntry]
```

**Enum・型エイリアス**:
```python
class Priority(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

TaskId = str  # 例: "TASK-123"
```

### 命名規則

**変数・関数**:
```python
# 変数: snake_case、名詞
user_name = "John"
task_history = []
is_completed = True

# 関数: snake_case、動詞で始める
def fetch_task_history(task_id: str) -> list[Task]: ...
def validate_task_id(task_id: str) -> None: ...
def calculate_completion_rate(tasks: list[Task], window_days: int) -> float: ...

# Boolean: is_, has_, should_, can_で始める
is_business_day = True
has_due_date = False
should_retry = True
can_send_notification = False

# プライベート: アンダースコア接頭辞
def _normalize_task_id(raw: str) -> str: ...
```

**クラス**:
```python
# クラス: PascalCase、名詞
class ReportGenerator: ...
class TaskRepository: ...

# 抽象基底クラス: 役割を表す名詞（ABC・Protocolを使用）
class DataSource(Protocol): ...
```

**定数**:
```python
# UPPER_SNAKE_CASE（モジュールレベルで定義）
MAX_RETRY_COUNT = 3
REQUEST_INTERVAL_SECONDS = 3.0
DEFAULT_PAGE_SIZE = 50
```

**ファイル・モジュール名**:
```python
# モジュール: snake_case
# report_generator.py
# task_repository.py

# パッケージ: snake_case（短く・単数形）
# core/, data/, report/, db/

# テスト: test_接頭辞
# test_report_generator.py
```

### 関数設計

**単一責務の原則**:
```python
# ✅ 良い例: 単一の責務
def calculate_total_price(items: list[CartItem]) -> float:
    return sum(item.price * item.quantity for item in items)

def format_price(amount: float) -> str:
    return f"¥{amount:,.0f}"

# ❌ 悪い例: 複数の責務
def calculate_and_format_price(items: list[CartItem]) -> str:
    total = sum(item.price * item.quantity for item in items)
    return f"¥{total:,.0f}"
```

**関数の長さ**:
- 目標: 20行以内
- 推奨: 50行以内
- 100行以上: リファクタリングを検討

**パラメータの数**:
```python
# ✅ 良い例: Pydanticモデルでまとめる
class CreateReportOptions(BaseModel):
    project_id: str
    period_days: int = 7
    sections: int = 3
    include_archived: bool = False

def create_report(options: CreateReportOptions) -> Report: ...

# ✅ 良い例: 少数ならキーワード専用引数
def create_report(project_id: str, *, period_days: int = 7) -> Report: ...

# ❌ 悪い例: 位置引数が多すぎる
def create_report(project, period, sections, archived, model, temp): ...
```

### エラーハンドリング

**カスタム例外クラス（共通基底クラスを持つ）**:
```python
class AppError(Exception):
    """プロジェクト共通の基底例外"""

class DataFetchError(AppError):
    def __init__(self, source: str, resource_id: str | None = None, cause: Exception | None = None):
        self.source = source
        self.resource_id = resource_id
        super().__init__(f"データ取得に失敗: source={source}, resource_id={resource_id}")
        self.__cause__ = cause

class InsufficientDataError(AppError):
    def __init__(self, resource_id: str, required: int, actual: int):
        super().__init__(f"データ不足 [{resource_id}]: 必要={required}件, 実際={actual}件")
```

**エラーハンドリングパターン**:
```python
# ✅ 良い例: 予期されるエラーは処理し、予期しないエラーは伝播
def get_task_history(task_id: str) -> list[Task]:
    try:
        tasks = repository.find_by_task_id(task_id)
    except sqlite3.Error as e:
        raise DataFetchError(source="db", resource_id=task_id, cause=e) from e

    if len(tasks) < MIN_REQUIRED_ITEMS:
        raise InsufficientDataError(task_id, MIN_REQUIRED_ITEMS, len(tasks))

    return tasks

# ❌ 悪い例: エラーを無視
def get_task_history(task_id: str) -> list[Task]:
    try:
        return repository.find_by_task_id(task_id)
    except Exception:
        return []  # エラー情報が失われる
```

**ソース単位の隔離（該当する場合）**:
1つのデータソースの失敗で全体を止めず、欠損として記録します。

```python
# ✅ 良い例: ソース単位で隔離し、欠損を記録
try:
    items = external_source.fetch(candidates)
except DataFetchError as e:
    logger.warning("外部ソースの取得をスキップ: %s", e)
    items = []
    state["missing_sources"].append(e.source)
```

**エラーメッセージ**:
```python
# ✅ 良い例: 具体的で解決策を示す
raise InsufficientDataError(
    "TASK-123", required=25, actual=10
)  # メッセージ: データ不足 [TASK-123]: 必要=25件, 実際=10件

# ❌ 悪い例: 曖昧で役に立たない
raise ValueError("Invalid input")
```

### 非同期処理

**async/await の使用**:
```python
# ✅ 良い例: async/awaitで明示
async def fetch_external_items(resource_id: str) -> list[Item]:
    try:
        async with http_client() as client:
            response = await client.get(items_url(resource_id))
        return parse_items(response.text)
    except httpx.HTTPError as e:
        raise DataFetchError(source="external", resource_id=resource_id, cause=e) from e
```

**並列処理**:
```python
# ✅ 良い例: asyncio.gatherで並列実行（LLM呼び出し等、対象が許す場合のみ）
async def review_all(candidates: list[str]) -> list[ReviewResult]:
    tasks = [review_one(item_id) for item_id in candidates]
    return await asyncio.gather(*tasks)

# ⚠️ 注意: 外部サービスへの並列一斉アクセスは禁止（後述のアクセス規約参照）
# 同一サービスへは逐次 + インターバルでアクセスする
```

## LLM呼び出しの規約（該当する場合）

1. **構造化出力を必須とする**: LLMの評価・分類・要約結果は必ず`with_structured_output` + Pydanticモデルで受け取る。自由文のパースは禁止
2. **temperatureは0を基本とする**: 再現性を優先。多様性が必要な箇所は理由をコメントで明記
3. **LLMを呼ぶ前に機械的に絞り込む**: 全アイテムのループの中でLLMを呼ばない。「機械的な絞り込み → LLM精査」の2段構えを守る
4. **プロンプトはコードと分離する**: `prompts/` 配下で管理し、差分レビューできるようにする
5. **呼び出し回数・トークン数をログに記録する**: 定期実行のコスト監視のため

```python
# ✅ 良い例: 構造化出力 + temperature=0
llm = ChatAnthropic(model=MODEL_NAME, temperature=0)
structured_llm = llm.with_structured_output(ReviewResult)
result = structured_llm.invoke(prompt)

# ❌ 悪い例: 自由文をパース
text = llm.invoke(prompt).content
score = float(text.split("スコア:")[1].split("\n")[0])  # 壊れやすい
```

## 外部サービスアクセスの規約（該当する場合）

- データ取得は必ず抽象化レイヤー（Repositoryパターン）を経由し、取得元を差し替え可能にする
- 同一サービスへのリクエストは逐次実行とし、最低でも数秒のインターバルを設ける
- 取得結果はDBにキャッシュし、同一データを再取得しない
- パース処理は取得処理と分離する（レスポンス構造変更時の修正範囲を限定するため）

```python
# ✅ 良い例: 取得とパースを分離し、Protocolで抽象化
class ItemSource(Protocol):
    def fetch_items(self, resource_id: str) -> list[Item]: ...

class FileSource:
    """ローカルに配置されたデータファイルを読み込む"""
    def fetch_items(self, resource_id: str) -> list[Item]: ...

class ExternalApiSource:
    """外部サービスから取得（レート制限つき）"""
    def fetch_items(self, resource_id: str) -> list[Item]:
        payload = self._fetch_with_interval(items_url(resource_id))  # 取得
        return parse_items(payload)                                   # パース（別関数）
```

## コメント規約

### docstring（Googleスタイル）

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

### インラインコメント

**良いコメント**:
```python
# ✅ 理由を説明
# アーカイブ済みタスクは完了率の分母を歪めるため除外する
tasks = [t for t in tasks if not t.is_archived]

# ✅ 複雑なロジックを説明
# 期限超過は営業日ベースで判定する（暦日だと週末を含んで過大評価になるため）
overdue_days = business_days_between(task.due_date, today)

# ✅ TODO・FIXMEを活用
# TODO: 外部API v2対応 (Issue #123)
# FIXME: 削除済みリソースでKeyError (Issue #456)
```

**悪いコメント**:
```python
# ❌ コードの内容を繰り返すだけ
# iを1増やす
i += 1

# ❌ コメントアウトされたコード（削除すべき）
# old_implementation()
```

## セキュリティ

### 入力検証

```python
# ✅ 良い例: Pydanticで宣言的に検証
class TaskIdInput(BaseModel):
    task_id: str = Field(pattern=r"^TASK-\d+$")  # 例: TASK-123

# ✅ 良い例: 外部サービスのパース結果も検証してから使う
item = Item.model_validate(parsed_row)  # 不正データはここで弾く

# ❌ 悪い例: 検証なしで外部データを使用
score = float(row[2])  # レスポンス構造変更で意味の違う列を読む危険
```

### 機密情報の管理

```python
# ✅ 良い例: pydantic-settingsで環境変数から読み込み
class Settings(BaseSettings):
    anthropic_api_key: SecretStr
    db_path: Path = Path("data/app.db")

settings = Settings()  # .envまたは環境変数から読み込み

# ❌ 悪い例: ハードコード
api_key = "sk-ant-1234567890abcdef"  # 絶対にしない！
```

- `.env` はgitignore対象。`.env.example` にキー名のみ記載する
- APIキー・個人情報等をログ・レポート・コミットに含めない

### SQL

```python
# ✅ 良い例: プレースホルダを使用
cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))

# ❌ 悪い例: 文字列結合（SQLインジェクション）
cursor.execute(f"SELECT * FROM tasks WHERE id = '{task_id}'")
```

## パフォーマンス

### データ構造の選択

```python
# ✅ 良い例: dictで O(1) アクセス
task_map = {t.id: t for t in tasks}
task = task_map[task_id]  # O(1)

# ❌ 悪い例: リストで O(n) 検索
task = next(t for t in tasks if t.id == task_id)  # O(n)
```

### ループ内での高コスト呼び出しの禁止

```python
# ✅ 良い例: 一括取得してからループ
tasks_by_id = repository.find_all(task_ids)  # 1クエリ
for task_id in task_ids:
    process(tasks_by_id[task_id])

# ❌ 悪い例: ループ内でDB・LLM・HTTPを呼ぶ（N+1）
for task_id in task_ids:
    task = repository.find_by_id(task_id)   # N回のクエリ
    result = llm.invoke(prompt(task_id))    # N回のLLM呼び出し（コスト爆発）
```

### キャッシュ・メモ化

```python
# 純粋な計算のメモ化
@functools.lru_cache(maxsize=1024)
def business_days_between(start: date, end: date) -> int: ...

# 外部データはDBにキャッシュ（取得日時つき）し、鮮度条件で再利用を判断する
```

## テストコード

### テストの構造 (Given-When-Then)

```python
class TestCalculateCompletionRate:
    def test_returns_rate_with_sufficient_data(self) -> None:
        # Given: 準備
        tasks = completed_tasks(3) + open_tasks(1)

        # When: 実行
        result = calculate_completion_rate(tasks, window_days=7)

        # Then: 検証
        assert result == pytest.approx(0.75)

    def test_raises_insufficient_data_error_when_no_tasks(self) -> None:
        # Given: 準備
        tasks: list[Task] = []

        # When/Then: 実行と検証
        with pytest.raises(InsufficientDataError):
            calculate_completion_rate(tasks, window_days=7)
```

### テスト命名規則

**パターン**: `test_[対象や条件]_[期待結果]`

```python
# ✅ 良い例
def test_create_with_empty_title_raises_validation_error(): ...
def test_find_by_id_existing_returns_task(): ...
def test_summary_excludes_archived_tasks(): ...

# ❌ 悪い例
def test_1(): ...
def test_works(): ...
```

### モック・フィクスチャの使用

**原則**:
- **ユニットテスト・統合テストで実際のLLM API・外部サービスを呼ばない**（コスト・再現性・CI安定性のため）
- LLMは`FakeListChatModel`等または構造化出力のスタブでモック化
- 外部サービスは保存済みレスポンスフィクスチャ（`tests/fixtures/`）でパーサーをテスト
- DBはインメモリDB（`:memory:`）または一時ファイルを使用

```python
# ✅ 良い例: 構造化出力をスタブ化
def test_reviewer_returns_scored_results() -> None:
    fake_llm = FakeStructuredLLM(responses=[
        ReviewResult(item_id="TASK-123", score=85, rationale="影響範囲が広く優先度が高い"),
    ])
    reviewer = Reviewer(llm=fake_llm, repository=in_memory_repository())

    results = reviewer.review(["TASK-123"])

    assert results[0].score == 85

# ✅ 良い例: レスポンスフィクスチャでパーサーをテスト
def test_parse_items_extracts_fields(fixtures_dir: Path) -> None:
    payload = (fixtures_dir / "items_response.json").read_text()

    items = parse_items(payload)

    assert items[0].title == "サンプルタスク"
```

### 実LLMでの動作確認

実際のLLMを使った品質確認は、自動テストではなく評価用CLIコマンドによる手動実行で行います（例: `uv run [CLIコマンド] review TASK-123`）。

## リファクタリング

### マジックナンバーの排除

```python
# ✅ 良い例: 定数を定義
MAX_RETRY_COUNT = 3
RETRY_DELAY_SECONDS = 1.0

for attempt in range(MAX_RETRY_COUNT):
    try:
        return fetch_data()
    except DataFetchError:
        if attempt < MAX_RETRY_COUNT - 1:
            time.sleep(RETRY_DELAY_SECONDS)

# ❌ 悪い例: マジックナンバー
for attempt in range(3):
    try:
        return fetch_data()
    except DataFetchError:
        if attempt < 2:
            time.sleep(1.0)
```

### 関数の抽出

```python
# ✅ 良い例: 工程ごとに関数を抽出
def build_summary(state: SummaryState) -> SummaryState:
    candidates = apply_status_filter(state["tasks"])
    candidates = apply_priority_filter(candidates)
    return {**state, "candidates": candidates}

def apply_status_filter(tasks: list[Task]) -> list[Task]:
    """アーカイブ済み・完了済みを除外する"""
    ...

# ❌ 悪い例: 1関数にすべての工程を詰め込む
def build_summary(state):
    # 100行のフィルタ処理...
    ...
```

## チェックリスト

実装完了前に確認:

### コード品質
- [ ] 命名が明確で一貫している（snake_case / PascalCase / UPPER_SNAKE_CASE）
- [ ] 関数が単一の責務を持っている
- [ ] マジックナンバーがない
- [ ] 型ヒントが全公開関数に記載されている
- [ ] エラーハンドリングが実装されている（ソース単位の隔離を含む・該当する場合）

### LLM・データ取得（該当する場合）
- [ ] LLM出力が構造化出力（Pydantic）で受け取られている
- [ ] ループ内でLLM・HTTP・DBを呼んでいない
- [ ] データ取得が抽象化レイヤーを経由している
- [ ] 外部サービスへのアクセスにインターバルが設定されている

### セキュリティ
- [ ] 入力・外部データの検証が実装されている
- [ ] 機密情報がハードコードされていない
- [ ] SQLがプレースホルダを使用している

### テスト
- [ ] ユニットテストが書かれている
- [ ] テストがパスする（`uv run pytest`）
- [ ] LLM・外部サービスがモック化されている
- [ ] エッジケース（データ欠損・境界値・削除済みリソース）がカバーされている

### ドキュメント
- [ ] 公開関数・クラスにdocstring（Googleスタイル）がある
- [ ] 複雑なロジックに理由を説明するコメントがある

### ツール
- [ ] `uv run ruff check .` がパス
- [ ] `uv run ruff format --check .` がパス
- [ ] `uv run mypy .` がパス
