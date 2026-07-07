# プロセスガイド (Process Guide)

## 基本原則

### 1. 具体例を豊富に含める

抽象的なルールだけでなく、具体的なコード例を提示します。

**悪い例**:
```
変数名は分かりやすくすること
```

**良い例**:
```python
# ✅ 良い例: 役割が明確
report_generator = ReportGenerator(llm, repository)
task_repository = TaskRepository(db_path)

# ❌ 悪い例: 曖昧
gen = Generator()
repo = Repository()
```

### 2. 理由を説明する

「なぜそうするのか」を明確にします。

**例**:
```
## ユニットテストで実LLMを呼ばない

理由: LLM呼び出しはコストが発生し、出力が非決定的なためテストが不安定になります。
構造化出力のスタブでロジックを検証し、実LLMでの品質確認は
評価用CLIコマンドの手動実行で行います。
```

### 3. 測定可能な基準を設定

曖昧な表現を避け、具体的な数値を示します。

**悪い例**:
```
コードカバレッジは高く保つこと
```

**良い例**:
```
コードカバレッジ目標:
- 全体: 80%以上
- 中核となる集計・判定ロジック: 90%以上
- 整形・CLI層: 60%以上で許容
```

## Git運用ルール

### ブランチ戦略（GitHub Flow採用）

**GitHub Flowとは**:
mainブランチと作業ブランチのみで構成されるシンプルなブランチモデル。個人開発のMVPフェーズに適しています。一般公開・複数人開発に移行する際は、developブランチを加えたGit Flowへの変更を検討します。

**ブランチ構成**:
```
main (安定版)
  ├─ feature/* (新機能開発)
  ├─ fix/* (バグ修正)
  └─ refactor/* (リファクタリング)
```

**運用ルール**:
- **main**: 常に動作する状態を保つ。バッチ等の自動実行はmainから行う
- **feature/\*、fix/\***: mainから分岐し、作業完了後にPRでmainへマージ
- **直接コミット原則禁止**: コードはPR経由でマージ（ドキュメントのみの変更は直接コミット許容）
- **マージ方針**: squash mergeを推奨（mainの履歴を1機能=1コミットに保つ）

**GitHub Flowのメリット**:
- ブランチ管理のオーバーヘッドが最小限で、個人開発のスピードを保てる
- mainが常に動く状態なので、cron等による定期実行が安定する

### コミットメッセージの規約

**Conventional Commitsを推奨**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type一覧**:
```
feat: 新機能 (minor version up)
fix: バグ修正 (patch version up)
docs: ドキュメント
style: フォーマット (コードの動作に影響なし)
refactor: リファクタリング
perf: パフォーマンス改善
test: テスト追加・修正
build: ビルドシステム
ci: CI/CD設定
chore: その他 (依存関係更新など)

BREAKING CHANGE: 破壊的変更 (major version up)
```

**Scope例**: `core`, `data`, `report`, `db`, `cli`

**良いコミットメッセージの例**:

```
feat(report): 週次サマリーレポートを追加

集計ロジックによる機械的な絞り込みとLLM要約の
2段構成で実装しました。

実装内容:
- ReportGeneratorクラスを追加
- 絞り込み条件を設定ファイルから読み込み
- 構造化出力（ReviewResult）でLLM要約結果を取得

Closes #12
```

### プルリクエストのテンプレート

**効果的なPRテンプレート**:

```markdown
## 変更の種類
- [ ] 新機能 (feat)
- [ ] バグ修正 (fix)
- [ ] リファクタリング (refactor)
- [ ] ドキュメント (docs)
- [ ] その他 (chore)

## 変更内容
### 何を変更したか
[簡潔な説明]

### なぜ変更したか
[背景・理由]

### どのように変更したか
- [変更点1]
- [変更点2]

## テスト
### 実施したテスト
- [ ] ユニットテスト追加
- [ ] 統合テスト追加
- [ ] 手動テスト実施（実行コマンドと結果を記載）

### テスト結果
[テスト結果の説明]

## LLMコストへの影響（該当する場合）
[LLM呼び出し回数・トークン数の増減見込み]

## 関連Issue
Closes #[番号]
Refs #[番号]

## レビューポイント
[レビュアーに特に見てほしい点]
```

## テスト戦略

### テストピラミッド

```
       /\
      /E2E\       少 (遅い、高コスト)
     /------\
    / 統合   \     中
   /----------\
  / ユニット   \   多 (速い、低コスト)
 /--------------\
```

**目標比率**:
- ユニットテスト: 70%
- 統合テスト: 20%
- E2Eテスト: 10%

**各テストの対象**:
- **ユニット**: 集計・判定ロジック、Pydanticモデルのバリデーション、パーサー
- **統合**: 処理パイプライン全体の遷移（モックLLM使用）、リポジトリのCRUD、レポート生成
- **E2E**: CLI実行 → 成果物生成までの主要フロー（通知はdry-run、LLMはモック）

### テストの書き方

**Given-When-Then パターン**:

```python
class TestSummaryPipeline:
    def test_returns_entries_with_valid_tasks(self) -> None:
        # Given: 準備
        pipeline = build_summary_pipeline(llm=fake_llm(), repository=in_memory_repository())
        state = initial_state(tasks=sample_tasks(100))

        # When: 実行
        result = pipeline.invoke(state)

        # Then: 検証
        assert result["entries"]
        assert all(entry.rationale for entry in result["entries"])

    def test_records_missing_source_when_data_fetch_fails(self) -> None:
        # Given: 準備
        pipeline = build_summary_pipeline(
            llm=fake_llm(),
            repository=failing_repository(source="external"),
        )

        # When: 実行
        result = pipeline.invoke(initial_state(tasks=sample_tasks(10)))

        # Then: 検証（ソース単位の隔離が機能している）
        assert "external" in result["missing_sources"]
        assert result["entries"]  # 他のソースで結果は出る
```

### 外部依存のモック方針

- **LLM**: `FakeListChatModel`等または構造化出力スタブを使用。**自動テストで実LLM APIを呼ばない**
- **外部サービス**: 保存済みレスポンスフィクスチャ（`tests/fixtures/`）でパーサーをテスト
- **DB**: インメモリDB（`:memory:`）または`tmp_path`の一時ファイル
- **通知送信**: dry-runモードまたは送信クライアントのモック

### カバレッジ目標

**測定可能な目標（pyproject.tomlで管理）**:

```toml
# pyproject.toml
[tool.coverage.report]
fail_under = 80

[tool.pytest.ini_options]
addopts = "--cov=src --cov-report=term-missing"
```

**理由**:
- 中核となる集計・判定ロジックは誤りの影響が大きいため90%以上を要求
- 整形・CLI層は低めでも許容
- 100%を目指さない (コストと効果のバランス)

## コードレビュープロセス

### レビューの目的

1. **品質保証**: バグの早期発見（特に計算・判定ロジックの誤り）
2. **知識共有**: コードベース全体の理解
3. **学習機会**: ベストプラクティスの共有

### 効果的なレビューのポイント

**レビュアー向け**:

1. **建設的なフィードバック**
```markdown
## ❌ 悪い例
このコードはダメです。

## ✅ 良い例
この実装だと全アイテムでLLMを呼ぶため、1回の実行で
コストが大きく膨らみます。機械的なフィルタで候補を絞ってから
LLM精査に回す2段構えにしましょう:

```python
candidates = apply_mechanical_filter(items)     # まず機械的に絞る
results = reviewer.review_with_llm(candidates)  # 絞った候補だけLLM精査
```
```

2. **優先度の明示**
```markdown
[必須] セキュリティ: APIキーがログに出力されています
[必須] コスト: ループ内でLLMを呼んでいます
[推奨] パフォーマンス: ループ内でのDB呼び出しを避けましょう
[提案] 可読性: この関数名をもっと明確にできませんか？
[質問] この閾値（スコア80）の根拠を教えてください
```

3. **ポジティブなフィードバックも**
```markdown
✨ この実装は分かりやすいですね！
👍 データ欠損のエッジケースがしっかり考慮されています
💡 このフィクスチャの作り方は他のパーサーテストでも使えそうです
```

**レビュイー向け**:

1. **セルフレビューを実施**
   - PR作成前に自分でコードを見直す
   - 説明が必要な箇所にコメントを追加

2. **小さなPRを心がける**
   - 1PR = 1機能
   - 変更ファイル数: 10ファイル以内を推奨
   - 変更行数: 300行以内を推奨

3. **説明を丁寧に**
   - なぜこの実装にしたか
   - 検討した代替案
   - 特に見てほしいポイント

### レビュー時間の目安

- 小規模PR (100行以下): 15分
- 中規模PR (100-300行): 30分
- 大規模PR (300行以上): 1時間以上

**原則**: 大規模PRは避け、分割する

## 自動化の推進

### 品質チェックの自動化

**自動化項目と採用ツール**:

1. **Lint・コードフォーマット**
   - **Ruff**
     - lintとformatを1ツールで高速に実行
     - 潜在的なバグや非推奨パターンを自動検出
     - 設定ファイル: `pyproject.toml` (`[tool.ruff]`)

2. **型チェック**
   - **mypy**
     - 型ヒントの整合性を静的に検証
     - Pydanticプラグインでモデルの型も検証
     - 設定ファイル: `pyproject.toml` (`[tool.mypy]`)

3. **テスト実行**
   - **pytest** + **pytest-cov**
     - フィクスチャによる外部依存の差し替えが容易
     - カバレッジ測定を標準化
     - 設定ファイル: `pyproject.toml` (`[tool.pytest.ini_options]`)

4. **依存関係管理**
   - **uv**
     - `uv.lock`による再現可能な環境構築
     - `uv sync --dev`で開発環境を一発構築

**実装方法**:

**1. CI/CD (GitHub Actions)**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
        with:
          python-version: '3.11'
      - run: uv sync --dev
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run mypy .
      - run: uv run pytest
```

**注意**: CIではLLM API・外部サービスに一切アクセスしない（すべてモック・フィクスチャで完結させる）。APIキーをCIのシークレットに登録するのは、実LLM評価用の手動トリガーワークフローのみとする。

**2. Pre-commit フック (pre-commit)**
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
```
```bash
# 導入
uv run pre-commit install
```

**導入効果**:
- コミット前に自動チェックが走り、不具合コードの混入を防止
- PR作成時に自動でCI実行され、マージ前に品質を担保
- APIキー等の機密情報のコミットを`detect-private-key`で防止

**この構成を選んだ理由**:
- Ruff・uvはRust製で高速、Pythonエコシステムの現行標準
- 設定が`pyproject.toml`に集約され、管理がシンプル
- LLMアプリ特有のリスク（コスト暴発・キー漏洩）をCI設計でカバー

## チェックリスト

- [ ] ブランチ戦略が決まっている（MVPはGitHub Flow）
- [ ] コミットメッセージ規約が明確である
- [ ] PRテンプレートが用意されている（LLMコスト影響の欄を含む・該当する場合）
- [ ] テストの種類とカバレッジ目標が設定されている
- [ ] LLM・外部サービスのモック方針が定義されている
- [ ] コードレビュープロセスが定義されている
- [ ] CI/CDパイプラインが構築されている（実LLM・外部サービスに非依存）
