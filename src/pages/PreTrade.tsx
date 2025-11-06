// src/pages/PreTrade.tsx
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { projectCashflows, Loan } from "../lib/pretrade/engine";

type TapeLoadState = "idle" | "loading" | "loaded" | "error";

export default function PreTrade() {
  const [tapeState, setTapeState] = useState<TapeLoadState>("idle");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [months, setMonths] = useState(60);
  const [pdAnnual, setPdAnnual] = useState(0.025);
  const [lgd, setLgd] = useState(0.725);
  const [cprAnnual, setCprAnnual] = useState(0.22);
  const [servicingBps, setServicingBps] = useState(100);
  const [recoveryLag, setRecoveryLag] = useState(12);

  const [runKey, setRunKey] = useState(0);

  // Load the single Excel file from /public
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTapeState("loading");
        const resp = await fetch("/data/loans.xlsx", { cache: "no-store" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const ab = await resp.arrayBuffer();
        const wb = XLSX.read(ab);
        const ws = wb.Sheets["loan_tape"] || wb.Sheets[wb.SheetNames[0]];
        if (!ws) throw new Error("No sheet found in loans.xlsx");
        const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: null });

        // Map rows to Loan objects. Keep names EXACT where needed.
        const mapped: Loan[] = raw.map((r: any, i: number) => ({
          loan_id: r.loan_id ?? i + 1,
          opening_balance: Number(r.opening_balance ?? 0),
          ["interest_rate (annual)"]: r["interest_rate (annual)"] != null ? Number(r["interest_rate (annual)"]) : undefined,
          maturity_months: r.maturity_months != null ? Number(r.maturity_months) : undefined,
          months_elapsed: r.months_elapsed != null ? Number(r.months_elapsed) : undefined,
          monthly_rate: r.monthly_rate != null ? Number(r.monthly_rate) : undefined,
          remaining_term: r.remaining_term != null ? Number(r.remaining_term) : undefined,
          monthly_payment: r.monthly_payment != null ? Number(r.monthly_payment) : undefined,
          sched_principal_m1: r.sched_principal_m1 != null ? Number(r.sched_principal_m1) : undefined,
          pd: r.pd != null ? Number(r.pd) : undefined,
          lgd: r.lgd != null ? Number(r.lgd) : undefined
        }));

        if (!cancelled) {
          setLoans(mapped);
          setTapeState("loaded");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setTapeState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute WA PD/LGD from tape (OB-weighted) if present
  const { waPD, waLGD, totalOB } = useMemo(() => {
    if (!loans.length) return { waPD: pdAnnual, waLGD: lgd, totalOB: 0 };
    const ob = loans.map(l => l.opening_balance || 0);
    const sumOB = ob.reduce((a, b) => a + b, 0);
    if (sumOB <= 0) return { waPD: pdAnnual, waLGD: lgd, totalOB: 0 };
    const w = (f: (l: Loan) => number) =>
      loans.reduce((acc, l, i) => acc + (f(l) * (l.opening_balance || 0)), 0) / sumOB;

    let pd = w(l => (l.pd ?? pdAnnual));
    let lgdW = w(l => (l.lgd ?? lgd));
    // If PD/LGD came as percentage values, convert to decimals
    if (pd > 1) pd = pd / 100;
    if (lgdW > 1) lgdW = lgdW / 100;

    return { waPD: pd, waLGD: lgdW, totalOB: sumOB };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans, runKey]);

  const [out, setOut] = useState<ReturnType<typeof projectCashflows> | null>(null);

  const runProjection = () => {
    if (!loans.length) return;
    // Use WA PD/LGD from tape if they exist; otherwise inputs
    const pdUse = waPD ?? pdAnnual;
    const lgdUse = waLGD ?? lgd;
    const res = projectCashflows(loans, months, pdUse, lgdUse, cprAnnual, servicingBps, recoveryLag);
    setOut(res);
    setRunKey(k => k + 1);
  };

  if (tapeState === "loading") {
    return <div className="p-6">Loading loan tape…</div>;
  }
  if (tapeState === "error") {
    return <div className="p-6 text-red-600">Could not load /data/loans.xlsx (sheet: loan_tape). Check file path and sheet name.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Pre-Trade – Cashflow Forecaster</h1>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
        <div><label className="block text-sm">Months</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={months} onChange={e => setMonths(Number(e.target.value))} />
        </div>
        <div><label className="block text-sm">CPR (annual, %)</label>
          <input type="number" className="border rounded px-2 py-1 w-full" step="0.1"
                 value={cprAnnual * 100} onChange={e => setCprAnnual(Number(e.target.value) / 100)} />
        </div>
        <div><label className="block text-sm">Servicing (bps p.a.)</label>
          <input type="number" className="border rounded px-2 py-1 w-full" step={5}
                 value={servicingBps} onChange={e => setServicingBps(Number(e.target.value))} />
        </div>
        <div><label className="block text-sm">Recovery lag (months)</label>
          <input type="number" className="border rounded px-2 py-1 w-full"
                 value={recoveryLag} onChange={e => setRecoveryLag(Number(e.target.value))} />
        </div>
        <div className="col-span-2 text-sm">
          <div className="font-medium">WA from tape</div>
          <div>PD: <b>{(waPD * 100).toFixed(2)}%</b> | LGD: <b>{(waLGD * 100).toFixed(2)}%</b> | OB: <b>{totalOB.toLocaleString()}</b></div>
        </div>
        <div className="col-span-2">
          <button onClick={runProjection} className="px-3 py-2 rounded bg-black text-white w-full">⚙️ Run / Re-run</button>
        </div>
      </div>

      {!loans.length && <div className="text-gray-600">No loans loaded yet. Ensure <code>/public/data/loans.xlsx</code> exists with sheet <code>loan_tape</code>.</div>}

      {out && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Metric label="Interest" value={sum(out.monthly.map(m => m.interest_collected))} />
            <Metric label="Scheduled Prin" value={sum(out.monthly.map(m => m.scheduled_principal))} />
            <Metric label="Prepayments" value={sum(out.monthly.map(m => m.prepayments))} />
            <Metric label="Defaults" value={sum(out.monthly.map(m => m.defaults))} />
            <Metric label="Recoveries" value={sum(out.monthly.map(m => m.recoveries))} />
          </div>

          <div className="overflow-auto border rounded">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <Th>Month</Th><Th>Interest</Th><Th>Sched Prin</Th><Th>Prepay</Th><Th>Default</Th><Th>Recoveries</Th><Th>Servicing</Th><Th>Net Cash</Th><Th>End Bal</Th>
                </tr>
              </thead>
              <tbody>
                {out.monthly.map((m) => (
                  <tr key={m.month} className="odd:bg-white even:bg-gray-50">
                    <Td>{m.month}</Td>
                    <Td>{fmt(m.interest_collected)}</Td>
                    <Td>{fmt(m.scheduled_principal)}</Td>
                    <Td>{fmt(m.prepayments)}</Td>
                    <Td>{fmt(m.defaults)}</Td>
                    <Td>{fmt(m.recoveries)}</Td>
                    <Td>{fmt(m.servicing_fee)}</Td>
                    <Td>{fmt(m.net_cash_to_bank)}</Td>
                    <Td>{fmt(m.ending_balance)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-lg font-semibold">{fmt(value)}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2 font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}
function sum(a: number[]) { return a.reduce((x, y) => x + y, 0); }
function fmt(n: number) { return n.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
