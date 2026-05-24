import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";

export function EmailDetail() {
  const { id } = useParams();
  const [email, setEmail] = useState(null);
  useEffect(() => {
    let active = true;
    api.get(`/threats/${id}`).then((res) => {
      if (active) setEmail(res.data);
    });
    return () => {
      active = false;
    };
  }, [id]);
  if (!email) return <p className="text-slate-400">Loading...</p>;
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">
        {email.subject || "(no subject)"}
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <p className="text-sm text-slate-400">From</p>
          <p>{email.sender_email}</p>
          <p className="mt-4 text-sm text-slate-400">Category</p>
          <p>{email.category_label}</p>
          <p className="mt-4 text-sm text-slate-400">AI summary</p>
          <p>{email.summary}</p>
          <p className="mt-4 text-sm text-slate-400">Body preview</p>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap text-sm text-slate-300">
            {email.body_text}
          </pre>
        </div>
        <div className="panel p-4">
          <p className="text-sm text-slate-400">Risk</p>
          <p className="text-3xl font-semibold text-danger">
            {email.risk_score}
          </p>
          <p className="mt-3">{email.risk_level}</p>
          <p className="mt-3 text-sm text-slate-400">Action</p>
          <p>{email.action}</p>
          <p className="mt-3 text-sm text-slate-400">Intent</p>
          <p>{email.suspicious_intent}</p>
        </div>
      </div>
    </div>
  );
}
