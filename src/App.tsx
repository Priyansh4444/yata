import { createSignal } from "solid-js";
import logo from "./assets/logo.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import TaskCard from "./components/task-card";
import TaskList from "./components/task-list";
function App() {
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name: name() }));
  }

  return (
    <main class="container">
      <TaskList
        name="trial"
        tasks={[{ header: "Task 1", tags: ["urgent", "work"] }]}
      />
    </main>
  );
}

export default App;
