import "@/App.css";
import HeaderText from "@components/header-text";
import BottomDock from "@components/bottom-dock";
import KanbanBoard from "@components/kanban-board";
import { Route, Router } from "@solidjs/router";
import SettingsPage from "@/pages/settings-page";
import { generateRandomTaskLists } from "@/utils";
import { Index } from "solid-js";

function App() {
  const routes = [
    { path: "/", component: HomePage },
    {
      path: "/settings",
      component: SettingsPage,
    },
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
      <main class="flex flex-col h-[85vh] py-4 overflow-x-auto">
        <KanbanBoard taskLists={generateRandomTaskLists(3)} />
      </main>
      <BottomDock />
    </main>
  );
}

export default App;
