<script lang="ts">
	import type { ReviewState } from '$lib/state.svelte';
	import DiffFileHeader from './DiffFileHeader.svelte';
	import DiffView from './DiffView.svelte';
	import PrHeader from './PrHeader.svelte';
	import PrConversationView from './PrConversationView.svelte';
	import PrChecksView from './PrChecksView.svelte';
	import CommitLogView from './CommitLogView.svelte';

	let { state }: { state: ReviewState } = $props();

	const showFiles = $derived(state.mode === 'live' || (state.mode === 'pr' && state.prTab === 'files'));
	const showLog = $derived(state.mode === 'history' || (state.mode === 'pr' && state.prTab === 'commits'));
</script>

<div class="flex h-full min-h-0 min-w-0 flex-col">
	{#if state.mode === 'pr'}
		<PrHeader {state} />
	{/if}

	{#if showFiles}
		<DiffFileHeader {state} />
		<DiffView {state} />
	{:else if state.mode === 'pr' && state.prTab === 'conversation'}
		<PrConversationView {state} />
	{:else if state.mode === 'pr' && state.prTab === 'checks'}
		<PrChecksView />
	{:else if showLog}
		<CommitLogView {state} />
	{/if}
</div>
