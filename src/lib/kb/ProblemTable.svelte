<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import issues from '#lib/data/issues-4471.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEM_LABEL, splitTicket, type Problem } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  type Issue = { number: number; url: string; state: string; note: string };

  const rows = (reports as Report[]).length;
  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const oneDay = $derived(split.groups.find((g) => g.problem === 'one-day-move')?.reports.length ?? 0);
  // Reports whose intake tag names a different cause than the one they are filed under.
  const mistagged = $derived(
    split.groups
      .filter((g) => g.problem !== 'one-day-move')
      .reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.problem).length, 0),
  );
  const link = (p: string) => (issues as Record<string, Issue>)[p];
  const tags = (t: Record<string, number>) =>
    Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>intake tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const issue = link(g.problem)}
      <tr class:open={issue?.state === 'open'}>
        <td><code>{g.problem}</code><br /><span class="label">{PROBLEM_LABEL[g.problem as Problem] ?? 'no cause found'}</span></td>
        <td><strong>{g.reports.length}</strong></td>
        <td class="tags">{tags(g.taggedAs)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issue}
            <a href={issue.url}>#{issue.number}</a> <b class="state">{issue.state}</b><br /><span class="label">{issue.note}</span>
          {:else}<span class="bad">no ticket yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  Counted as the desk counts: the {oneDay} one-day-move reports also count under the cause they are filed
  under by tenant. The export has {rows} rows; {rows - split.merged.length} are the same report exported twice
  and count once. Intake's tag names the wrong cause on {mistagged} reports.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .label { color: var(--muted); font-size: 0.85em; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .state { white-space: nowrap; }
  .open td { background: var(--warn-bg); }
  .open .state { color: var(--warn); }
  .bad { color: var(--warn); font-weight: 600; }
</style>
