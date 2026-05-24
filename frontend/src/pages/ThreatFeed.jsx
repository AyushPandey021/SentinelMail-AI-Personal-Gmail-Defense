import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export function ThreatFeed() {
const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let active = true;
    api.get("/threats", { params: { ...(level ? { level } : {}), ...(category ? { category } : {}) } }).then((res) => {
      if (active) setRows(res.data.data);
    });
    return () => {
      active = false;
    };
  }, [level, category]);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Threat Feed</h2>
        <div className="flex flex-wrap gap-2">
          <select className="focus-ring rounded-md border border-line bg-panel px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            <option value="ADS">Ads / Promotions</option>
            <option value="NO_REPLY">No-reply / System</option>
            <option value="SOCIAL">Social</option>
            <option value="FINANCE">Finance</option>
            <option value="SECURITY">Security Alerts</option>
            <option value="DEVELOPER">Developer / Tools</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="PERSONAL">Personal / Other</option>
          </select>
          <select className="focus-ring rounded-md border border-line bg-panel px-3 py-2" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">All levels</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
          </select>
        </div>
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300"><tr><th className="p-3">Sender</th><th>Category</th><th>Subject</th><th>Risk</th><th>Action</th><th>Received</th></tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-slate-400" colSpan={6}>
                  No analyzed Gmail messages yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line hover:bg-white/5">
                <td className="p-3">{row.sender_email}</td>
                <td>{row.category_label}</td>
                <td><Link className="text-cyan" to={`/threats/${row.id}`}>{row.subject || "(no subject)"}</Link></td>
                <td>{row.risk_level} {row.risk_score}</td>
                <td>{row.action}</td>
                <td>{new Date(row.received_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
