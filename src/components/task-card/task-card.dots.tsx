import type { Option, Priority } from "@/types";
import { getPriorityProps } from "./task-card.priority";
import { createMemo, type JSXElement } from "solid-js";

export function Dots(props: {
  priority: Option<Priority>;
  seed: string;
}): JSXElement | null {
  const dots = createMemo(() => {
    const { rgb, baseCount, opacity, sizeRange, blurRange } = getPriorityProps(
      props.priority,
    );
    if (!rgb || baseCount === 0) return null;
    const [r, g, b] = rgb;
    return Array.from({ length: baseCount }, () => {
      const left = 5 + Math.random() * 90; // percent
      const top = 5 + Math.random() * 70; // percent
      const size = 40 + Math.random() * sizeRange; // px
      const blur = 12 + Math.random() * blurRange; // px
      return {
        left: `${left}%`,
        top: `${top}%`,
        size,
        blur,
        opacity,
        color: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      };
    });
  });

  const dotsArray = dots();
  if (!dotsArray) return null;
  return (
    <div class="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
      {dots()!.map((d) => (
        <div
          style={{
            position: "absolute",
            left: d.left,
            top: d.top,
            width: `${d.size}px`,
            height: `${d.size}px`,
            background: d.color,
            "border-radius": "9999px",
            filter: `blur(${d.blur}px)`,
          }}
        />
      ))}
    </div>
  );
}
