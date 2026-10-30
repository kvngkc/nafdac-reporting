"use client";

import { useActionState } from "react";
import { Status } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/labels";
import { updateStatus } from "./actions";

export function StatusForm({ complaintId, current }: { complaintId: string; current: Status }) {
  const [error, action, pending] = useActionState(updateStatus, null);
  return (
    <form action={action} className="space-y-3" key={current}>
      <input type="hidden" name="complaintId" value={complaintId} />
      <div>
        <label htmlFor="status" className="label">
          Status
        </label>
        <select id="status" name="status" defaultValue={current} className="input">
          {Object.values(Status).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note" className="label">
          Note <span className="font-normal text-slate-400">(internal)</span>
        </label>
        <textarea id="note" name="note" rows={3} className="input text-sm" placeholder="e.g. Included in weekly report to NAFDAC Lagos office" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Update status"}
      </button>
    </form>
  );
}
