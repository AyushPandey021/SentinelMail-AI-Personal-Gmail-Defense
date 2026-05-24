import { Link, useRouteError } from "react-router-dom";

export function AppError() {
  const error = useRouteError();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6">
      <div className="panel max-w-lg p-6">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page hit an unexpected error. You can return to the dashboard and keep working.
        </p>
        {error?.message && (
          <p className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm text-danger">
            {error.message}
          </p>
        )}
        <Link className="focus-ring mt-5 inline-flex rounded-md bg-cyan px-4 py-2 text-sm font-semibold text-ink" to="/dashboard">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
