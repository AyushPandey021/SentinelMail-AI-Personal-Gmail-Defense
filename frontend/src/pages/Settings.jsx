import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export function Settings() {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => api.get("/gmail/status").then((res) => setStatus(res.data));

  useEffect(() => {
    let active = true;
    api.get("/gmail/status").then((res) => {
      if (active) setStatus(res.data);
    });
    return () => {
      active = false;
    };
  }, []);

  async function syncNow() {
    setSyncing(true);
    setMessage("");
    try {
      const res = await api.post("/gmail/sync");
      setMessage(`Analyzed ${res.data.analyzed ?? 0} message(s), skipped ${res.data.skipped ?? 0}.`);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.error ?? "Gmail sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <div className="panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium">Gmail analyzer</p>
            <p className="mt-1 text-sm text-slate-400">
              {status?.configured ? status.email : "Add Gmail credentials in .env to enable analysis."}
            </p>
          </div>
          <button
            className="focus-ring rounded-md bg-cyan px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!status?.configured || syncing}
            onClick={syncNow}
          >
            {syncing ? "Syncing..." : "Sync now"}
          </button>
        </div>
        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-slate-400">Status</dt>
            <dd>{status?.configured ? "Configured" : "Not configured"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Last sync</dt>
            <dd>{status?.last_sync ? new Date(status.last_sync).toLocaleString() : "Never"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Poll interval</dt>
            <dd>{status?.poll_interval_seconds ?? 60}s</dd>
          </div>
        </dl>
        {status?.last_result && (
          <p className="mt-4 text-sm text-slate-300">
            Last result: analyzed {status.last_result.analyzed ?? 0}, skipped {status.last_result.skipped ?? 0}. Full inbox sync may take time on large Gmail accounts.
          </p>
        )}
        {(message || status?.last_error) && (
          <p className={`mt-4 text-sm ${status?.last_error && !message ? "text-danger" : "text-slate-300"}`}>{message || status.last_error}</p>
        )}
      </div>
    </div>
  );
}
