import { JSX } from "solid-js";

type MiniShellProps = {
  children: JSX.Element;
  class?: string;
  title?: string;
};

export default function MiniShell(props: MiniShellProps) {
  return (
    <main class="h-screen w-screen bg-black text-white grid place-items-center overflow-hidden">
      <div
        class={`box-border rounded-2xl bg-black overflow-hidden ${props.class || ""}`}
        style={{
          width: "clamp(300px, 94vw, 720px)",
          height: "auto",
          "max-height": "calc(100vh - 16px)",
          padding: "clamp(8px, 3vw, 16px)",
        }}
      >
        {props.title && (
          <div class="text-sm mb-2 opacity-80 leading-tight">{props.title}</div>
        )}
        {props.children}
      </div>
    </main>
  );
}
