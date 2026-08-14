import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10">
        <SearchX className="h-10 w-10 text-blue-500" />
      </div>
      <p className="font-mono text-6xl font-bold tabular-nums text-zinc-950 dark:text-white">
        404
      </p>
      <h1 className="mt-3 font-geist text-xl font-bold tracking-[-0.01em] text-zinc-950 dark:text-white">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700"
      >
        <Home className="h-4 w-4" />
        Retour à l'accueil
      </Link>
    </div>
  );
}
