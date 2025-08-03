import "./App.css";
import TaskList from "./components/task-list";

function App() {
  return (
    <main class="container">
      <TaskList
        tasklist={{
          header: "My Task List",
          tasks: [
            {
              header: "Task 1",
              tags: ["urgent", "work"]
            },
            {
              header: "Task 2",
              tags: ["personal"]  
            },
            {
              header: "Task 3",
              tags: ["home", "urgent"]
            }
          ]
        }}
      />
    </main>
  );
}

export default App;
