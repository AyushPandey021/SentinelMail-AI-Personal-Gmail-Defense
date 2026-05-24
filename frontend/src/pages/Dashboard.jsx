import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client.js";
import { Metric } from "../ui/Metric.jsx";

export function Dashboard() {
  const [data, setData] = useState({
    summary: {},
    trend: [],
    topAttackers: [],
    categorySummary: [],
  });
  useEffect(() => {
    let active = true;
    api.get("/dashboard/overview").then((res) => {
      if (active) setData(res.data);
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Threat Overview</h2>
        <p className="text-sm text-slate-400">
          Personal Gmail risk telemetry
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Emails analyzed" value={data.summary?.all_time_total ?? data.summary?.total} />
        <Metric
          label="High risk"
          value={data.summary?.high_risk}
          tone="danger"
        />
        <Metric
          label="Quarantined"
          value={data.summary?.quarantined}
          tone="amber"
        />
      </div>
      <div className="panel p-4">
        <h3 className="mb-4 font-semibold">Mail categories</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.categorySummary.length === 0 && (
            <p className="text-sm text-slate-400">No analyzed Gmail categories yet.</p>
          )}
          {data.categorySummary.map((item) => (
            <div key={item.category} className="rounded-md border border-line bg-black/10 p-3">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-cyan">{item.count}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="panel h-80 p-4">
          <h3 className="mb-4 font-semibold">Risk trend</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data.trend}>
              <XAxis dataKey="day" stroke="#8ba5aa" />
              <YAxis stroke="#8ba5aa" />
              <Tooltip
                contentStyle={{
                  background: "#101b20",
                  border: "1px solid #20333a",
                }}
              />
              <Line
                type="monotone"
                dataKey="avg_risk"
                stroke="#3dd6d0"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-4">
          <h3 className="mb-4 font-semibold">Top attackers</h3>
          <div className="space-y-3">
            {data.topAttackers.length === 0 && (
              <p className="text-sm text-slate-400">No high-risk senders found yet.</p>
            )}
            {data.topAttackers.map((item) => (
              <div
                key={item.sender_domain}
                className="flex items-center justify-between border-b border-line pb-2 text-sm"
              >
                <span>{item.sender_domain}</span>
                <span className="text-danger">{item.attempts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
