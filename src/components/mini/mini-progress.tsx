type MiniProgressProps = {
  value: number; // 0..1
};

export default function MiniProgress(props: MiniProgressProps) {
  const pct = Math.max(0, Math.min(1, props.value)) * 100;
  return (
    <div class="h-1.5 w-full rounded bg-white/10 overflow-hidden">
      <div class="h-full bg-white/80" style={{ width: `${pct}%` }} />
    </div>
  );
}
