// src/lib/pretrade/engine.ts
export type Loan = {
  loan_id: string | number;
  opening_balance: number;
  /** annual as decimal (e.g. 0.12 for 12%). If missing, we derive from monthly_rate*12 */
  ["interest_rate (annual)"]?: number;
  maturity_months?: number;
  months_elapsed?: number;
  monthly_rate?: number;         // decimal per month (e.g. 0.01 for 1%/mo)
  remaining_term?: number;       // months
  monthly_payment?: number;      // currency per month
  sched_principal_m1?: number;   // optional, not required by engine
  pd?: number;                   // annual PD as decimal
  lgd?: number;                  // decimal 0..1
};

export type MonthAgg = {
  month: number;
  interest_collected: number;
  scheduled_principal: number;
  prepayments: number;
  defaults: number;
  recoveries: number;
  servicing_fee: number;
  net_cash_to_bank: number;
  ending_balance: number;
};

export type LoanMonth = {
  month: number;
  opening_balance: number;
  interest: number;
  scheduled_principal: number;
  prepayment: number;
  default: number;
  recovery: number;
  servicing_fee: number;
  ending_balance: number;
};

export type ByLoan = Record<string, LoanMonth[]>;

export function pmt(rate: number, nper: number, pv: number) {
  if (rate === 0) return pv / Math.max(nper, 1);
  const r = rate;
  return pv * (r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1);
}

export function annualToMonthlyPD(pdAnnual: number) {
  // pdAnnual is decimal, e.g., 0.025
  return 1 - Math.pow(1 - pdAnnual, 1 / 12);
}

export function cprToSmm(cpr: number) {
  return 1 - Math.pow(1 - cpr, 1 / 12);
}

function toDec(x: any) {
  const v = Number(x);
  if (!isFinite(v)) return 0;
  return v > 1 ? v / 100 : v;
}

/**
 * Ensure all fields needed for projection exist (like in engine.py).
 */
export function normalizeLoans(loans: Loan[]): Loan[] {
  return loans.map((r) => {
    const out: Loan = { ...r };
    const ob = Number(out.opening_balance) || 0;

    // monthly_rate
    if (out.monthly_rate == null) {
      const ann = toDec(out["interest_rate (annual)"]);
      out.monthly_rate = (ann || 0) / 12;
    }

    // remaining_term
    if (out.remaining_term == null) {
      const mat = Number(out.maturity_months ?? 60) || 60;
      const el = Number(out.months_elapsed ?? 0) || 0;
      out.remaining_term = Math.max(1, Math.round(mat - el));
    }

    // monthly_payment
    if (out.monthly_payment == null) {
      out.monthly_payment = pmt(out.monthly_rate || 0, out.remaining_term || 1, ob);
    }

    return out;
  });
}

/**
 * projectCashflows (core port of your Python engine.project_cashflows)
 */
export function projectCashflows(
  loansInput: Loan[],
  months: number = 60,
  pdAnnual: number = 0.025,
  lgd: number = 0.725,
  cprAnnual: number = 0.22,
  servicingBpsPa: number = 100,
  recoveryLagMonths: number = 12
): { monthly: MonthAgg[]; byLoan: ByLoan } {
  const loans = normalizeLoans(loansInput);

  const pd_m = annualToMonthlyPD(pdAnnual);
  const smm = cprToSmm(cprAnnual);
  const serv_m = (servicingBpsPa / 10000) / 12;

  const byLoan: ByLoan = {};
  const state = loans.map((r) => {
    byLoan[String(r.loan_id)] = [];
    return {
      loan_id: String(r.loan_id),
      bal: Number(r.opening_balance) || 0,
      rate: Number(r.monthly_rate) || 0,
      pmt: Number(r.monthly_payment) || 0,
      mrem: Math.max(0, Number(r.remaining_term) || 0),
      rec_sched: new Map<number, number>() // month -> recovery amount
    };
  });

  const monthly: MonthAgg[] = [];

  for (let t = 1; t <= months; t++) {
    let tot_sched_prin = 0, tot_int = 0, tot_prepay = 0, tot_default = 0, tot_recovery = 0, tot_serv = 0;

    for (const s of state) {
      if (s.bal <= 1e-8 || s.mrem <= 0) {
        byLoan[s.loan_id].push({
          month: t, opening_balance: 0, interest: 0, scheduled_principal: 0,
          prepayment: 0, default: 0, recovery: 0, servicing_fee: 0, ending_balance: 0
        });
        continue;
      }

      const ob = s.bal;
      const r = s.rate;
      const pmt = Math.min(s.pmt, ob * (1 + r) + 1e-9);

      const interest = ob * r;
      let schedPrin = Math.max(0, pmt - interest);
      schedPrin = Math.min(schedPrin, ob);

      const balAfterSched = ob - schedPrin;
      const expDefault = Math.min(balAfterSched * pd_m, balAfterSched);
      const balAfterDefault = balAfterSched - expDefault;

      const expPrepay = Math.min(balAfterDefault * smm, balAfterDefault);
      const eb = balAfterDefault - expPrepay;

      const servFee = ob * serv_m;

      const fut = t + Number(recoveryLagMonths || 0);
      if (expDefault > 0) {
        const prev = s.rec_sched.get(fut) || 0;
        s.rec_sched.set(fut, prev + expDefault * (1 - lgd));
      }
      const rec = s.rec_sched.get(t) || 0;
      if (rec > 0) s.rec_sched.delete(t);

      byLoan[s.loan_id].push({
        month: t,
        opening_balance: ob,
        interest,
        scheduled_principal: schedPrin,
        prepayment: expPrepay,
        default: expDefault,
        recovery: rec,
        servicing_fee: servFee,
        ending_balance: eb
      });

      tot_sched_prin += schedPrin;
      tot_int += interest;
      tot_prepay += expPrepay;
      tot_default += expDefault;
      tot_recovery += rec;
      tot_serv += servFee;

      s.bal = eb;
      s.mrem = Math.max(0, s.mrem - 1);
    }

    monthly.push({
      month: t,
      interest_collected: tot_int,
      scheduled_principal: tot_sched_prin,
      prepayments: tot_prepay,
      defaults: tot_default,
      recoveries: tot_recovery,
      servicing_fee: tot_serv,
      net_cash_to_bank: tot_int + tot_sched_prin + tot_prepay + tot_recovery - tot_serv,
      ending_balance: state.reduce((a, s) => a + s.bal, 0)
    });
  }

  return { monthly, byLoan };
}
