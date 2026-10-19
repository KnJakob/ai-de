<script lang="ts">
	import type { ReviewState } from '$lib/state.svelte';
	import { formatRelativeTime } from '$lib/types';

	let { state }: { state: ReviewState } = $props();
</script>

<div class="min-h-0 flex-1 overflow-auto py-2.5 pb-8">
	{#if state.commitLogLoading && !state.commitLog}
		<div class="px-4 py-4 text-[12.5px]" style="color:var(--color-neutral-600)">Loading…</div>
	{:else if state.commitLogError}
		<div class="px-4 py-4 text-[12.5px]" style="color:var(--color-del)">{state.commitLogError}</div>
	{:else if state.commitLog?.length === 0}
		<div class="px-4 py-4 text-[12.5px]" style="color:var(--color-neutral-600)">No commits yet.</div>
	{:else}
		{#each state.commitLog ?? [] as c (c.sha)}
			<div
				class="grid grid-cols-[20px_78px_minmax(0,1fr)_132px_92px] items-center gap-3 border-b px-4 py-2.5"
				style="border-color:rgba(233,233,237,0.07)"
			>
				<span class="h-2 w-2 rounded-full" style="background:#4a4d5c"></span>
				<span class="text-[11.5px]" style="font-family:var(--font-mono);color:var(--color-brand)">{c.sha.slice(0, 7)}</span>
				<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]" style="color:var(--color-text)">{c.subject}</span>
				<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px]" style="color:var(--color-neutral-500)">{c.authorName}</span>
				<span class="text-right text-[11px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">
					{formatRelativeTime(new Date(c.authorDate * 1000).toISOString())}
				</span>
			</div>
		{/each}
	{/if}
</div>
