import { createBrowserRouter } from "react-router";
import { HomePage } from "@/app/home-page";
import { RootLayout } from "@/app/root-layout";
import { taskRoutes } from "@/features/tasks/routes";

// 各機能スライスのルート定義をここで集約する
export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [{ index: true, Component: HomePage }, ...taskRoutes],
  },
]);
