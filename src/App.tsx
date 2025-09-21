import "@/App.css";
import HeaderText from "@components/header-text";
import BottomDock from "@components/bottom-dock";
import KanbanBoard from "@components/kanban-board";
import { Route, Router } from "@solidjs/router";
import SettingsPage from "@/pages/settings-page";
import { Index } from "solid-js";
import FocusPage from "./pages/focus-page";
import TimerPage from "./pages/timer-page";
import ReportsPage from "./pages/reports-page";
import SchedulePage from "./pages/schedule-page";

function App() {
  const routes = [
    { path: "/", component: HomePage },
    {
      path: "/settings",
      component: SettingsPage,
    },
    { path: "/focus", component: FocusPage },
    { path: "/timer", component: TimerPage },
    { path: "/reports", component: ReportsPage },
    { path: "/schedule", component: SchedulePage },
  ];

  return (
    <Router>
      <Index each={routes}>
        {(route) => <Route path={route().path} component={route().component} />}
      </Index>
    </Router>
  );
}

function HomePage() {
  return (
    <main class="min-h-screen w-screen bg-background text-foreground px-6 py-6 flex flex-col pb-24">
      <HeaderText />
      <div class="flex flex-col h-[85vh] py-4 overflow-x-auto">
        <KanbanBoard />
      </div>
      <BottomDock />
    </main>
  );
}

export default App;
