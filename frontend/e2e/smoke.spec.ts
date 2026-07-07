import { expect, test } from "@playwright/test";

test("トップページからタスク一覧へ遷移できる", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "タスク" }).click();

  await expect(page.getByRole("heading", { name: "タスク一覧" })).toBeVisible();
});
