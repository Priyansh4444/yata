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
  const [textColor, bgAlpha] = computeTagColors(props.tag.color);
  return (
    <span
      class={`inline-flex items-center rounded-md border border-white/10 ${padding} ${props.class ?? ""}`}
      style={{
        "background-color": `${applyAlpha(props.tag.color, bgAlpha)}`,
        color: textColor,
      }}
      title={props.tag.label}
    >
      {props.tag.label}
    </span>
  );
}

function computeTagColors(hex: string): [string, string] {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b));
  const isDark = luminance < 0.5;
  // Text: white on dark colors, near-black otherwise
  const text = isDark ? "#ffffff" : hex;
  // Background alpha: slightly stronger for very dark colors
  const alpha = isDark ? "44" : "22"; // ~0.27 vs ~0.13
  return [text, alpha];
}

function srgb(v: number): number {
  const x = v / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let s = hex.replace(/^#/, "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const num = parseInt(s, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function applyAlpha(hex: string, alphaHex: string): string {
  const s = hex.replace(/^#/, "");
  return `#${s}${alphaHex}`;
}
