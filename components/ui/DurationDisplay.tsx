import { formatDuration } from "@/lib/duration";

interface Props {
  ms: number;
  className?: string;
}

export function DurationDisplay({ ms, className = "" }: Props) {
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {formatDuration(ms)}
    </span>
  );
}
