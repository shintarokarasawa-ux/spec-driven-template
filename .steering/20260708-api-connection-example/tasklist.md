# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 未完了タスク(`[ ]`)を残したまま作業を終了しない

---

## フェーズ1: 依存導入

- [x] zod(dependencies)、msw(devDependencies)を追加
- [x] shadcn/ui inputコンポーネントを追加
- [x] `pnpm exec msw init public/` でworkerスクリプト生成

## フェーズ2: API接続の実装

- [x] lib/api-client.ts(apiFetch + ApiError)
- [x] features/tasks/types.ts をZodスキーマ化
- [x] features/tasks/api.ts を apiFetch + parse に改修、useCreateTaskMutation追加

## フェーズ3: MSW

- [x] src/mocks/(handlers.ts, browser.ts, server.ts)
- [x] main.tsx: 開発時のみworker起動(VITE_API_MOCKで無効化可能)
- [x] test/setup.ts: msw/nodeライフサイクル + 状態リセット

## フェーズ4: UI(更新系の実例)

- [x] components/task-form.tsx(入力+追加、isPending制御)
- [x] tasks-page.tsx にフォーム配置

## フェーズ5: テストと検証

- [x] 既存テストのMSW移行確認
- [x] タスク追加の成功パステスト
- [x] APIエラー表示のテスト(ハンドラ差し替え)
- [x] `pnpm check` / `pnpm test` / `pnpm build` 全て成功(テスト10件。
  MSW生成物public/mockServiceWorker.jsはBiome対象から除外)

## フェーズ6: ドキュメント反映

- [x] frontend/.env.example 追加
- [x] react-frontendスキル更新(SKILL.md, patterns.md, add-feature.md)+ README更新
- [x] コミット・push

---

## 実装後の振り返り

### 実装完了日
2026-07-08

### 計画と実績の差分

**計画と異なった点**:
- ほぼ設計どおり。追加判断として、MSW生成物`public/mockServiceWorker.js`をBiomeの
  対象から除外した(整形すると再生成のたびに差分が出るため)
- shadcn/ui `input`はCLIの`--yes`で非対話追加できた(前回整備したcomponents.jsonが効いた)

### 学んだこと

- モックをqueryFn内からHTTP層(MSW)に移すと、fetch・ApiError正規化・Zod parseまで
  本番同等のコードパスがテストで検証される。エラー系も`server.use`で自然に書ける
- テスト環境(Node)のfetchは相対URLを受け付けないため、APIクライアント側で
  originを付与する設計が必要
- MSWハンドラの状態(モジュール変数)はテスト間で漏れるため、`resetMockTasks()`を
  test/setup.tsのafterEachに組み込む形で解決

### 次回への改善提案
- 認証付きAPI(BFF経由)の実例は実プロジェクトで必要になった時にpatterns.mdへ反映
- CI(GitHub Actions)追加は引き続き未着手の候補
