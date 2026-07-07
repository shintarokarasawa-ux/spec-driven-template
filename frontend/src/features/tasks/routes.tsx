import type { RouteObject } from "react-router";
import { TasksPage } from "./components/tasks-page";

// このスライスが提供するルート。app/router.tsxが集約する
export const taskRoutes: RouteObject[] = [{ path: "tasks", Component: TasksPage }];
