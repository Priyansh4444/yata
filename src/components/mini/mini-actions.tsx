import { JSX } from "solid-js";

type ButtonProps = {
  disabled?: boolean;
  onClick?: () => void;
  children: JSX.Element;
};

export function MiniButton(props: ButtonProps) {
  return (
    <button
      class="px-3 py-2 rounded-md border border-white/25 text-white hover:bg-white/10 disabled:opacity-40"
      disabled={props.disabled}
      onClick={props.onClick}
      type="button"
    >
      {props.children}
    </button>
  );
}

type ActionsProps = {
  children: JSX.Element;
};

export default function MiniActions(props: ActionsProps) {
  return (
    <div class="flex items-center justify-center gap-2">{props.children}</div>
  );
}
