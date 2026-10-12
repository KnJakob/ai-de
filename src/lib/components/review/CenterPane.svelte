<script lang="ts">
	import type { ReviewState } from '$lib/state.svelte';
	import DiffFileHeader from './DiffFileHeader.svelte';
	import DiffView from './DiffView.svelte';
	import PrGate from './PrGate.svelte';
	import PrDetailsGate from './PrDetailsGate.svelte';
	import PrHeader from './PrHeader.svelte';
	import PrListView from './PrListView.svelte';
	import PrConversationView from './PrConversationView.svelte';
	import PrChecksView from './PrChecksView.svelte';
	import PrCommitsView from './PrCommitsView.svelte';
	import CommitLogView from './CommitLogView.svelte';

	let { state }: { state: ReviewState } = $props();

	const showFiles = $derived(state.mode === 'live' || (state.mode === 'pr' && state.prTab === 'files'));
</script>

<div class="flex h-full min-h-0 min-w-0 flex-col">
	{#if state.mode === 'pr'}
		<PrGate {state}>
			{#snippet children({ prs, owner, repo })}
				{#if state.selectedPrNumber === null}
					<PrListView {state} {prs} {owner} {repo} />
				{:else}
					<PrDetailsGate {state}>
						{#snippet children(pr)}
							<PrHeader {state} {pr} />
							{#if state.prTab === 'files'}
								<DiffFileHeader {state} />
								<DiffView {state} />
							{:else if state.prTab === 'conversation'}
								<PrConversationView {state} {pr} />
							{:else if state.prTab === 'checks'}
								<PrChecksView {pr} />
							{:else if state.prTab === 'commits'}
								<PrCommitsView {pr} />
							{/if}
						{/snippet}
					</PrDetailsGate>
				{/if}
			{/snippet}
		</PrGate>
	{:else if showFiles}
		<DiffFileHeader {state} />
		<DiffView {state} />
	{:else if state.mode === 'history'}
		<CommitLogView />
	{/if}
</div>
