import { NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "ホーム" },
  { to: "/tasks", label: "タスク" },
];

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
          <span className="font-semibold">My App</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "text-sm text-muted-foreground hover:text-foreground",
                  isActive && "font-medium text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
