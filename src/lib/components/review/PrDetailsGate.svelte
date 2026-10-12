<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { Snippet } from 'svelte';
	import type { ReviewState } from '$lib/state.svelte';
	import type { PrSummary } from '$lib/types';

	let { state, children }: { state: ReviewState; children: Snippet<[PrSummary]> } = $props();
</script>

{#if state.prDetailsLoading && !state.prDetails}
	<div class="flex min-h-0 flex-1 items-center justify-center text-[12.5px]" style="color:var(--color-neutral-600)">
		Loading pull request…
	</div>
{:else if state.prDetailsError}
	<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-[12.5px]" style="color:var(--color-del)">
		{state.prDetailsError}
		<button onclick={() => state.backToPrList()} class="flex items-center gap-1.5 text-[12px]" style="color:var(--color-neutral-500)">
			<ArrowLeft size={12} />Back to pull requests
		</button>
	</div>
{:else if state.prDetails?.kind === 'notFound'}
	<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-[12.5px]" style="color:var(--color-neutral-500)">
		That pull request couldn't be found anymore.
		<button onclick={() => state.backToPrList()} class="flex items-center gap-1.5 text-[12px]" style="color:var(--color-accent-300)">
			<ArrowLeft size={12} />Back to pull requests
		</button>
	</div>
{:else if state.prDetails?.kind === 'notAuthenticated' || state.prDetails?.kind === 'noRemote'}
	<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-[12.5px]" style="color:var(--color-neutral-500)">
		Lost GitHub access while loading this pull request.
		<button onclick={() => state.backToPrList()} class="flex items-center gap-1.5 text-[12px]" style="color:var(--color-accent-300)">
			<ArrowLeft size={12} />Back to pull requests
		</button>
	</div>
{:else if state.prDetails?.kind === 'found'}
	{@const pr = state.prDetails}
	{@render children(pr)}
{/if}
