<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';

	const { children } = $props();

	// app.html shows a static spinner before Svelte mounts (CSR-only app —
	// see +layout.ts). svelte's mount() appends into its target rather than
	// clearing it, so that element never goes away on its own; remove it
	// explicitly the moment this root layout — the whole app — mounts.
	onMount(() => {
		document.getElementById('pre-mount-loader')?.remove();
	});
</script>

{@render children()}
