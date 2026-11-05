// Build setup for the kb export (the export ships src/ only). Pages are .svx (mdsvex); every page uses the runbook layout.
import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [mdsvex({ extensions: ['.svx'], layout: { runbook } })],
  kit: {
    // The built site goes to rendered/, committed: the pages as the desk sees them.
    adapter: adapter({ pages: 'rendered', assets: 'rendered' }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['/kb'] },
  },
};
