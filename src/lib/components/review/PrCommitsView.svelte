<script lang="ts">
	import { formatRelativeTime } from '$lib/types';
	import type { PrSummary } from '$lib/types';

	let { pr }: { pr: PrSummary } = $props();
</script>

<div class="min-h-0 flex-1 overflow-auto py-2.5 pb-8">
	{#each pr.commits as c (c.sha)}
		<div
			class="grid grid-cols-[78px_minmax(0,1fr)_132px_92px] items-center gap-3 border-b px-4 py-2.5"
			style="border-color:rgba(233,233,237,0.07)"
		>
			<span class="text-[11.5px]" style="font-family:var(--font-mono);color:var(--color-brand)">{c.sha.slice(0, 7)}</span>
			<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]" style="color:var(--color-text)">{c.message.split('\n')[0]}</span>
			<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px]" style="color:var(--color-neutral-500)">{c.authorName}</span>
			<span class="text-right text-[11px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">
				{c.authorDate ? formatRelativeTime(c.authorDate) : ''}
			</span>
		</div>
	{/each}
</div>
