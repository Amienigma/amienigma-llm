import { cn } from "@/lib/utils";

export function OrbitRing({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  if (size === "sm") {
    return (
      <span
        className={cn("relative inline-flex size-7 items-center justify-center", className)}
        aria-hidden
      >
        <span
          className="block size-7 rounded-full"
          style={{
            background:
              "conic-gradient(from 200deg, var(--color-orbit-cyan), var(--color-orbit-blue) 32%, var(--color-orbit-violet) 58%, var(--color-orbit-pink) 78%, var(--color-orbit-cyan))",
            padding: 5,
          }}
        >
          <span className="block size-full rounded-full bg-bg" />
        </span>
      </span>
    );
  }

  return (
    <div className={cn("orbit-ring", className)} aria-hidden>
      <div className="orbit-ring-disk">
        <div className="orbit-ring-core" />
      </div>
    </div>
  );
}
