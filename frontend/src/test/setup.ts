import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetMockTasks } from "@/mocks/handlers";
import { server } from "@/mocks/server";

// テストはMSW経由でfetch層まで検証する(実HTTPは遮断)
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  resetMockTasks();
});

afterAll(() => server.close());
