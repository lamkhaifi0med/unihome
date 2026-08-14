import { Link } from "react-router-dom";

export default function Logo({ size = "md" }) {
  const sizes = {
    sm: { icon: "w-6 h-6", text: "text-lg" },
    md: { icon: "w-8 h-8", text: "text-xl" },
    lg: { icon: "w-10 h-10", text: "text-2xl" },
  };

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`${sizes[size].icon} relative`}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="9" fill="#2563EB" />
          <path d="M16 6L26 14v12H20v-7h-8v7H6V14L16 6z" fill="white" />
          <circle cx="16" cy="14" r="2.5" fill="white" fillOpacity="0.7" />
        </svg>
      </div>
      <span
        className={`font-geist font-bold tracking-[-0.02em] ${sizes[size].text} text-zinc-950 dark:text-white transition-colors`}
      >
        Uni<span className="text-blue-600 dark:text-blue-400">Home</span>
      </span>
    </Link>
  );
}
