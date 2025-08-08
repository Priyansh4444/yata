import "@/App.css";
import HeaderText from "@components/header-text";
import BottomDock from "@components/bottom-dock";
import KanbanBoard from "@components/kanban-board";
import { generateRandomTaskLists } from "@/utils";

function App() {
  const taskLists = generateRandomTaskLists(3); // Show 3 lists for demo
  return (
    <main class="min-h-screen w-screen bg-background text-foreground px-6 py-6 flex flex-col pb-24">
      <HeaderText />
      <main class="flex flex-col h-[85vh] py-4 overflow-x-auto">
        <KanbanBoard taskLists={taskLists} />
      </main>
      <BottomDock />
    </main>
  );
}

export default App;
