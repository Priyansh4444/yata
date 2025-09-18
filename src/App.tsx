import "@/App.css";
import HeaderText from "@components/header-text";
import BottomDock from "@components/bottom-dock";
import KanbanBoard from "@components/kanban-board";
import { Route, Router } from "@solidjs/router";
import SettingsPage from "@/pages/settings-page";
import { generateRandomTaskLists } from "@/utils";
import { Index, createSignal, onMount } from "solid-js";
import type { TaskList } from "@/types";
import { loadBoard, saveBoard, writeAppInitSnapshot } from "@/libs/storage";

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
  const [initial, setInitial] = createSignal<TaskList[] | null>(null);

  onMount(async () => {
    const loaded = await loadBoard();
    if (loaded && loaded.length > 0) {
      setInitial(loaded);
    } else {
      const seeded = generateRandomTaskLists(3);
      setInitial(seeded);
      await saveBoard(seeded);
    }
    if (initial()) {
      await writeAppInitSnapshot(initial()!);
    }
  });

  return (
    <main class="min-h-screen w-screen bg-background text-foreground px-6 py-6 flex flex-col pb-24">
      <HeaderText />
      <div class="flex flex-col h-[85vh] py-4 overflow-x-auto">
        {initial() ? (
          <KanbanBoard taskLists={initial()!} />
        ) : (
          <div class="text-zinc-400 text-sm">Loading…</div>
        )}
      </div>
      <BottomDock />
    </main>
  );
}

export default App;
