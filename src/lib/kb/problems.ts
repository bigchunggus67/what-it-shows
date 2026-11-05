// The problems inside one merged ticket. causes.ts sorts a report by its tenant and channel;
// this file also takes the reports the desk read as a one-day move (desk-notes.json). A date
// that moves by one day is not a flipped day and month, so those reports get a problem of
// their own. The desk counts them where they are filed too (CauseTable, readAs), so they stay
// in their tenant's cause as well: the same count the desk's own view gives.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day-move';

export const PROBLEM_LABEL: Record<Problem, string> = {
  parser: 'shared parser reads day-first dates month first',
  hint: 'booking-v3 form hint asks day-first tenants for MM/DD/YYYY',
  'one-day-move': 'dates move one day earlier',
};

// Every problem a report counts toward: its tenant's cause, and one-day-move if the desk read it so.
export function problemsOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): (Problem | 'unplaced')[] {
  const filed = causeOf(r, t) ?? 'unplaced';
  return oneDayMove.includes(r.id) ? [filed, 'one-day-move'] : [filed];
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  taggedAs: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

// Every report merged into `ticket`, counted once per problem it belongs to.
export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: Report[]; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of merged) {
    for (const p of problemsOf(r, tenantOf(r), oneDayMove)) byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        taggedAs: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { merged, groups };
}
