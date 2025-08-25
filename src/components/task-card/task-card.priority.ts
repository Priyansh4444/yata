import { Priority, Option } from "@/types";

type PriorityProps = {
  borderClass: string;
  headerTextClass: string;
  metaTextClass: string;
  rgb: [number, number, number] | null;
  baseCount: number;
  opacity: number;
  sizeRange: number;
  blurRange: number;
};

export function getPriorityProps(priority: Option<Priority>): PriorityProps {
  switch (priority) {
    case "low":
      return {
        borderClass: "border-emerald-500/20 hover:border-emerald-400/30",
        headerTextClass: "text-emerald-100",
        metaTextClass: "text-emerald-300/80",
        rgb: [16, 185, 129],
        baseCount: 4,
        opacity: 0.12,
        sizeRange: 70,
        blurRange: 18,
      };
    case "medium":
      return {
        borderClass: "border-amber-500/25 hover:border-amber-400/35",
        headerTextClass: "text-amber-100",
        metaTextClass: "text-amber-300/80",
        rgb: [245, 158, 11],
        baseCount: 6,
        opacity: 0.16,
        sizeRange: 90,
        blurRange: 22,
      };
    case "high":
      return {
        borderClass: "border-rose-600/30 hover:border-rose-500/40",
        headerTextClass: "text-rose-100",
        metaTextClass: "text-rose-300/80",
        rgb: [244, 63, 94],
        baseCount: 8,
        opacity: 0.22,
        sizeRange: 110,
        blurRange: 28,
      };
    default:
      return {
        borderClass: "border-white/5 hover:border-white/10",
        headerTextClass: "text-zinc-100",
        metaTextClass: "text-zinc-400",
        rgb: null,
        baseCount: 0,
        opacity: 0,
        sizeRange: 0,
        blurRange: 0,
      };
  }
}
