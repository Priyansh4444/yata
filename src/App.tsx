import "./App.css";
import HeaderText from "@components/header-text";
import BottomDock from "./components/bottom-dock";

function App() {
  return (
    <main class="h-screen w-screen bg-transparent text-white p-12">
      <HeaderText />
      <BottomDock />
    </main>
  );
}

export default App;
