interface Props {
  minDate: Date;
  totalMs: number;
}

export default function GanttTodayLine({ minDate, totalMs }: Props) {
  const now = new Date();
  const leftPct = ((now.getTime() - minDate.getTime()) / totalMs) * 100;
  if (leftPct < 0 || leftPct > 100) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
      style={{ left: `${leftPct}%` }}
    >
      <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
    </div>
  );
}
