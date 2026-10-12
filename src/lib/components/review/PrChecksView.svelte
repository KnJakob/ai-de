<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import type { PrSummary } from '$lib/types';

	let { pr }: { pr: PrSummary } = $props();
</script>

<div class="min-h-0 flex-1 overflow-auto px-[22px] pt-5 pb-10">
	<div class="max-w-[700px]">
		{#each pr.checks as c (c.name)}
			<div class="mb-2 flex items-center gap-3 rounded-[9px] px-3.5 py-3.5" style="background:var(--color-surface-2);box-shadow:0 0 0 1px rgba(233,233,237,0.09)">
				{#if c.state === 'passed'}
					<CircleCheck size={17} style="color:var(--color-approved)" />
				{:else if c.state === 'running'}
					<CircleDashed size={17} style="color:var(--color-accent-400)" />
				{:else}
					<CircleX size={17} style="color:var(--color-changes-requested)" />
				{/if}
				<span class="min-w-0 flex-1">
					<span class="block font-medium text-[13px]" style="color:var(--color-text)">{c.name}</span>
					<span class="mt-0.5 block text-[11.5px]" style="color:var(--color-neutral-600)">{c.detail}</span>
				</span>
			</div>
		{:else}
			<div class="text-[12.5px]" style="color:var(--color-neutral-600)">No checks reported for this pull request.</div>
		{/each}
	</div>
</div>
