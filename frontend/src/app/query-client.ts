import { QueryClient } from "@tanstack/react-query";

// サーバー状態の既定ポリシーはここで一元管理する
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
