import { JSX } from "solid-js";

type MiniShellProps = {
  children: JSX.Element;
  class?: string;
  title?: string;
};

export default function MiniShell(props: MiniShellProps) {
  return (
    <main class="min-h-screen w-screen bg-black text-white grid place-items-center">
      <div
        class={`w-full max-w-xl p-4 rounded-2xl border border-white/15 bg-black ${props.class || ""}`}
      >
        {props.title && (
          <div class="text-sm mb-2 opacity-80">{props.title}</div>
        )}
        {props.children}
      </div>
    </main>
  );
}
