import Link from "next/link";

export const BRAND = "CommentPilot";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 font-display font-semibold tracking-tight text-foreground ${className}`}
    >
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 via-green-500 to-green-400 text-white shadow-[0_0_24px_rgba(34,197,94,0.45)]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3a8.38 8.38 0 0 1 8.5 8.5Z" />
          <path d="M8.5 10.5h7" />
          <path d="M8.5 13.5h4" />
        </svg>
      </span>
      <span className="text-lg">{BRAND}</span>
    </Link>
  );
}
