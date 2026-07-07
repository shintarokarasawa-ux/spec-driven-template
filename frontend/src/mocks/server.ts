import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// テスト用サーバー(test/setup.tsがライフサイクルを管理する)
export const server = setupServer(...handlers);
