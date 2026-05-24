import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export function Quarantine() {
  const [rows, setRows] = useState([]);
  const load = () => api.get("/quarantine").then((res) => setRows(res.data.data));
  useEffect(() => {
    let active = true;
    api.get("/quarantine").then((res) => {
      if (active) setRows(res.data.data);
    });
    return () => {
      active = false;
    };
  }, []);
  async function act(id, action) {
    await api.post(`/quarantine/${id}/${action}`);
    load();
  }
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Quarantine Management</h2>
      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5"><tr><th className="p-3">Sender</th><th>Subject</th><th>Risk</th><th>Status</th><th>Decision</th></tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-slate-400" colSpan={5}>
                  No messages are currently quarantined.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="p-3">{row.sender_email}</td><td>{row.subject}</td><td>{row.risk_level} {row.risk_score}</td><td>{row.status}</td>
                <td className="space-x-2">
                  <button className="rounded-md border border-line px-3 py-1" onClick={() => act(row.id, "release")}>Release</button>
                  <button className="rounded-md bg-danger px-3 py-1 text-white" onClick={() => act(row.id, "reject")}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
