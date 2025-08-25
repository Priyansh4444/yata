/**
 * useRerenderLogger - A custom SolidJS hook to log when a property, signal, or store field re-renders.
 *
 * Usage:
 *   useRerenderLogger(() => mySignal(), "mySignal");
 *   useRerenderLogger(() => myStore.someField, "myStore.someField");
 *   // Place inside your component to track when a signal or store field changes and triggers a re-render.
 */

import { createEffect } from "solid-js";

export default function useRerenderLogger(getter: () => any, label: string) {
  createEffect(() => {
    const value = getter();
    console.log(
      `%c🔄 [RERENDER] "${label}" changed!`,
      "background: #222; color: #bada55; font-size: 1.2em; padding: 2px 8px; border-radius: 4px;",
    );
    // Optionally, log the new value:
    console.log(`%cValue:`, "color: #bada55; font-weight: bold;", value);
  });
}

/*
Example usage in a SolidJS component:

import { createSignal, createStore } from "solid-js";

function MyComponent() {
  const [count, setCount] = createSignal(0);
  const [store, setStore] = createStore({ clicks: 0 });

  useRerenderLogger(() => count(), "count");
  useRerenderLogger(() => store.clicks, "store.clicks");

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count()}
      </button>
      <button onClick={() => setStore("clicks", c => c + 1)}>
        Store Clicks: {store.clicks}
      </button>
    </>
  );
}

*/
