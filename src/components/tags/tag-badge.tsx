import type { Tag } from "@/types";

type Props = {
  tag: Tag;
  size?: "sm" | "md";
  class?: string;
};

export default function TagBadge(props: Props) {
  const padding =
    props.size === "sm"
      ? "px-1.5 py-0.5 text-[10px]"
      : "px-2 py-0.5 text-[11px]";
  return (
    <span
      class={`inline-flex items-center rounded-md border border-white/10 ${padding} ${props.class ?? ""}`}
      style={{
        "background-color": `${props.tag.color}22`,
        color: props.tag.color,
      }}
      title={props.tag.label}
    >
      {props.tag.label}
    </span>
  );
}
