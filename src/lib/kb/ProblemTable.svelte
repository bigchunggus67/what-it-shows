<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import issues from '#lib/data/issues-4471.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEM_LABEL, splitTicket, type Problem } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const rows = (reports as Report[]).length;
  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const counted = $derived(split.groups.reduce((n, g) => n + g.reports.length, 0));
  // Reports whose intake tag names a different problem than the one they belong to.
  const mistagged = $derived(
    split.groups.reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.problem).length, 0),
  );
  const link = (p: string) => (issues as Record<string, { url: string; number: number }>)[p];
  const tags = (t: Record<string, number>) =>
    Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong> problems · each report counted once
  {#if counted !== split.merged.length}<span class="bad">(groups add up to {counted})</span>{/if}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>intake tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const issue = link(g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="label">{PROBLEM_LABEL[g.problem as Problem] ?? 'no cause found'}</span></td>
        <td><strong>{g.reports.length}</strong></td>
        <td class="tags">{tags(g.taggedAs)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issue}<a href={issue.url}>#{issue.number}</a>{:else}<span class="bad">no ticket yet</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  The export has {rows} rows; {rows - split.merged.length} are the same report exported twice and count once.
  Of the reports, intake's tag names the wrong problem on {mistagged}.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .label { color: var(--muted); font-size: 0.85em; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .bad { color: var(--warn); font-weight: 600; }
</style>
