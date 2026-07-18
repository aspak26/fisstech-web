import { cn } from "@/lib/utils/cn";

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent",
        className,
      )}
    >
      {initial}
    </div>
  );
}
