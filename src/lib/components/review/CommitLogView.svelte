<script lang="ts">
	import { COMMITS } from '$lib/mock/data';
	import type { ReviewState } from '$lib/state.svelte';

	let { state }: { state: ReviewState } = $props();

	const commits = $derived(state.mode === 'pr' ? COMMITS.slice(0, 3) : COMMITS);
</script>

<div class="min-h-0 flex-1 overflow-auto py-2.5 pb-8">
	{#each commits as c, i (c.sha)}
		<div
			class="grid grid-cols-[20px_78px_minmax(0,1fr)_132px_92px] items-center gap-3 border-b px-4 py-2.5"
			style="border-color:rgba(233,233,237,0.07)"
		>
			<span class="h-2 w-2 rounded-full" style:background={i < 2 ? 'var(--color-brand)' : '#4a4d5c'} style="box-shadow:0 0 0 3px rgba(145,132,217,0.10)"></span>
			<span class="text-[11.5px]" style="font-family:var(--font-mono);color:var(--color-brand)">{c.sha}</span>
			<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]" style="color:var(--color-text)">{c.subject}</span>
			<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px]" style="color:var(--color-neutral-500)">{c.author}</span>
			<span class="text-right text-[11px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">{c.when}</span>
		</div>
	{/each}
</div>
