import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// 開発時のブラウザ用ワーカー(main.tsxが起動する)
export const worker = setupWorker(...handlers);
