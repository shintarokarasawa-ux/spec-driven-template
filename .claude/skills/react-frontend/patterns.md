# React 実装パターン(配線規約)

## ディレクトリ構造(機能スライス)

```
frontend/src/
├── main.tsx              # エントリ(providers + router を合成)
├── app/                  # アプリ全体の配線(機能を持たない)
│   ├── providers.tsx     # Provider類の合成(QueryClientProvider等)
│   ├── query-client.ts   # TanStack Queryの既定ポリシー
│   ├── router.tsx        # 各スライスのroutesを集約
│   ├── root-layout.tsx   # 共通レイアウト(ヘッダー・ナビ)
│   └── home-page.tsx     # トップページ
├── components/ui/        # shadcn/ui生成コンポーネント(手書き変更しない)
├── lib/                  # 汎用ユーティリティ(cn、api-client等)
├── mocks/                # MSWハンドラ(API契約のドキュメントを兼ねる)
├── test/setup.ts         # Vitestセットアップ(MSWライフサイクル込み)
└── features/[機能名]/     # 機能スライス(自己完結)
    ├── types.ts          # この機能のドメイン型(Zodスキーマ + z.inferで導出)
    ├── api.ts            # データ取得・更新(Query/Mutationフック + クエリキー)
    ├── store.ts          # クライアント状態(Zustand)+ 純粋関数
    ├── routes.tsx        # この機能のルート定義
    ├── components/       # この機能のコンポーネント
    └── *.test.{ts,tsx}   # テスト(コロケーション)
```

**依存方向**: `features/* → components/ui, lib` のみ許可。
`features/`間の相互import、`app/ → features/`のroutes集約以外のimportは禁止。
スライスを跨いで使いたくなったら `components/` か `lib/` に昇格させる。

## 状態の置き場所判断(最重要)

| 状態の種類 | 置き場所 | 例 |
|-----------|---------|-----|
| サーバー由来のデータ | TanStack Query | 一覧・詳細・検索結果 |
| UIの表示条件(複数コンポーネントで共有) | Zustand | フィルタ・選択中ID・モーダル開閉 |
| 単一コンポーネント内で閉じる | useState | 入力途中の値・ホバー状態 |
| URLで共有すべき状態 | React Router(searchParams) | ページ番号・検索クエリ |

**アンチパターン**: Queryの結果をZustand/useStateにコピーしない
(キャッシュの二重管理になる。表示加工は描画時に純粋関数で行う)。

## データ取得・更新(TanStack Query + APIクライアント)

```tsx
// api.ts — クエリキーはファクトリで一元管理し、
// HTTPは lib/api-client.ts のapiFetch経由、レスポンスはZodでparseしてから使う
export const taskKeys = {
  all: ["tasks"] as const,
  detail: (id: string) => ["tasks", id] as const,
};

async function fetchTasks(): Promise<Task[]> {
  const payload = await apiFetch("/tasks");
  return taskListSchema.parse(payload); // 契約違反はここで例外化
}

export function useTasksQuery() {
  return useQuery({ queryKey: taskKeys.all, queryFn: fetchTasks });
}

// 更新系の基本形: 成功したら関連クエリをinvalidateして再取得
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
```

- フックは `use[名詞]Query` / `use[動詞]Mutation` で命名し、`api.ts` に集約
- コンポーネントから直接fetchしない(必ずapi.tsのフック経由)
- `lib/api-client.ts` がベースURL・JSONヘッダ・HTTPエラーの`ApiError`正規化を一元化する。
  各featureで素のfetchを書かない
- ドメイン型はZodスキーマで定義し`z.infer`で導出(`types.ts`)。APIレスポンスは
  境界で必ず`parse`する(黙って壊れたデータを描画しない)
- 既定ポリシー(staleTime・retry)は `app/query-client.ts` で一元管理し、個別上書きは理由をコメント
- mutationの`isPending`中は送信ボタンをdisabledにし、二重送信を防ぐ

## APIモック(MSW)

バックエンド不在でも本番同等のコードパス(fetch→エラー処理→parse)で動作・テストするため、
モックはqueryFn内ではなく**HTTP層(MSW)**に置く。

- `src/mocks/handlers.ts` が唯一のモック定義。**API契約のドキュメントを兼ねる**ため、
  実バックエンド実装時はこのパス・リクエスト/レスポンス形式に合わせる
- 開発時: `main.tsx`がDEVかつ`VITE_API_MOCK !== "false"`のときworkerを起動。
  実APIへの接続は`.env.local`に`VITE_API_MOCK=false`を設定するだけ
- テスト時: `test/setup.ts`がmsw/nodeのlisten/reset/closeとモック状態リセットを管理済み。
  エラー系のテストは`server.use(...)`でそのテストに限りハンドラを差し替える
- ハンドラのパスは`*/api/tasks`形式(ブラウザ/Node両対応のワイルドカード)
- `public/mockServiceWorker.js`はMSW生成物。手で編集せず、Biome対象外

## クライアント状態(Zustand)

```ts
// store.ts — 状態は最小限、導出は純粋関数に切り出す
export const useTaskFilterStore = create<TaskFilterState>()((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
}));

export function applyFilter(tasks: Task[], filter: TaskFilter): Task[] { ... }
```

- ストアは機能スライスごとに定義(グローバルな巨大ストアを作らない)
- セレクタで購読する: `useTaskFilterStore((state) => state.filter)`(オブジェクトごと取らない)
- 導出ロジックは純粋関数に切り出す(単体テストが容易になる)

## ルーティング

- ルートは機能スライスの `routes.tsx` で `RouteObject[]` として定義し、
  `app/router.tsx` が集約する(機能追加時にapp側の変更を1行に保つ)
- ページコンポーネントは `[機能名]-page.tsx`、`Component:` プロパティで登録

## UIコンポーネント

- `components/ui/` はshadcn/ui CLIの生成物。直接編集せず、必要なら
  `pnpm dlx shadcn@latest add [component]` で追加する
- 機能固有のコンポーネントはスライス内 `components/` に置く
- クラス結合は `cn()`(lib/utils)を使う
- ローディング(`isPending`)・エラー(`isError`)・空(0件)の3状態を必ずUIに反映する

## 命名・スタイル

- ファイル名: kebab-case(`task-list.tsx`)/ コンポーネント: PascalCase / フック: `use`始まり
- `import type` を使う(`verbatimModuleSyntax`が有効)
- パスエイリアス `@/` = `src/`。スライス内は相対import、スライス外は`@/`
- Biomeが規約の最終権威(`pnpm check`がパスすること)

## 環境変数

- クライアントに公開してよい値のみ `VITE_` プレフィックスで `.env.local` に定義
  (`.env.local`はgitignore対象。キー名は`frontend/.env.example`に記載)
- `VITE_API_BASE_URL`: APIのベースURL(既定は同一オリジンの`/api`)
- `VITE_API_MOCK=false`: 開発時のMSWモックを無効化して実APIに接続
- **秘密情報(APIシークレット等)はフロントエンドに置かない**(バンドルに埋め込まれ公開される)。
  認証が必要なAPIはバックエンド(BFF)経由で呼び、トークンはサーバー側で付与する

## テスト

- 純粋関数・ストア: 通常のVitestテスト(`store.test.ts`)
- コンポーネント: Testing Libraryでユーザー視点のテスト
  (`getByRole`優先。QueryClientProviderはテスト用に都度生成し`retry: false`)
- データ取得はMSW経由で検証する(fetch・parse・エラー処理まで通る)。
  APIエラーのテストは`server.use`で500応答に差し替える
- Zustandはグローバルなので `beforeEach` で `setState` によりリセットする
  (MSWのモック状態は`test/setup.ts`が自動リセット)
- E2E: 主要導線のスモークのみ`e2e/`に置く(網羅はユニットで)

## レビュー観点

- [ ] サーバー状態がZustand/useStateにコピーされていないか
- [ ] fetchがapi.tsの外に書かれていないか(素のfetchではなくapiFetch経由か)
- [ ] APIレスポンスがZodでparseされてから使われているか
- [ ] 更新系が`invalidateQueries`で一覧を再取得しているか・二重送信防止があるか
- [ ] モックがqueryFn内ではなくMSWハンドラに置かれているか
- [ ] features/間の相互importがないか
- [ ] ローディング・エラー・空状態の欠落がないか
- [ ] クエリキーがファクトリ経由か(文字列リテラルの直書きがないか)
- [ ] 秘密情報が`VITE_`変数やコードに埋め込まれていないか
