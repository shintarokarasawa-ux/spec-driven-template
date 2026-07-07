export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ベースURLはVITE_API_BASE_URL(既定は同一オリジンの /api)。
// 相対指定はoriginを付与する(テスト環境のfetchが絶対URLを要求するため)
function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || "/api";
  const absolute = configured.startsWith("http")
    ? configured
    : new URL(configured, window.location.origin).toString();
  return absolute.replace(/\/$/, "");
}

// fetchの共通処理(ベースURL・JSONヘッダ・エラー正規化)を一元化する。
// レスポンスの型検証は呼び出し側(各featureのapi.ts)がZodで行う
export async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const method = init?.method ?? "GET";
    throw new ApiError(
      response.status,
      `APIリクエストに失敗: ${method} ${path} (${response.status})`,
    );
  }
  if (response.status === 204) {
    return undefined;
  }
  return response.json();
}
