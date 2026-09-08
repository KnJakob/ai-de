<script lang="ts">
	import Pin from '@lucide/svelte/icons/pin';
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import Fingerprint from '@lucide/svelte/icons/fingerprint';
	import { PR } from '$lib/mock/data';
	import type { ReviewState } from '$lib/state.svelte';
	import type { SidePanelTab } from '$lib/types';
	import NotesPanel from './NotesPanel.svelte';
	import PrSidePanel from './PrSidePanel.svelte';
	import BlamePanel from './BlamePanel.svelte';

	let { state }: { state: ReviewState } = $props();

	const tabs = $derived(
		(
			[
				{ id: 'notes', label: state.mode === 'pr' ? 'Local notes' : 'Notes', Icon: Pin, count: state.notes.length },
				...(state.mode === 'pr' ? [] : [{ id: 'pr', label: 'Pull request', Icon: GitPullRequest, count: PR.comments.length }]),
				{ id: 'blame', label: 'Blame', Icon: Fingerprint, count: null }
			] as { id: SidePanelTab; label: string; Icon: typeof Pin; count: number | null }[]
		).filter((t) => (state.mode === 'pr' ? t.id !== 'pr' : true))
	);
</script>

<div class="flex h-full min-h-0 flex-col border-l" style="background:var(--color-panel);border-color:var(--color-divider)">
	<div class="flex h-[34px] gap-0 border-b px-2" style="border-color:var(--color-divider)">
		{#each tabs as t (t.id)}
			<button
				onclick={() => (state.sidePanelTab = t.id)}
				class="flex items-center gap-1.5 px-2.5 font-medium text-[12px]"
				style:color={state.sidePanelTab === t.id ? 'var(--color-text)' : 'var(--color-neutral-500)'}
				style:box-shadow={state.sidePanelTab === t.id ? 'inset 0 -2px 0 0 var(--color-brand)' : 'none'}
			>
				<t.Icon size={13} />{t.label}
				{#if t.count !== null}
					<span class="rounded-full px-[5px] font-medium text-[10px]" style="font-family:var(--font-mono);background:#2a2c3c;color:var(--color-neutral-400)">{t.count}</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if state.sidePanelTab === 'notes'}
		<NotesPanel {state} />
	{:else if state.sidePanelTab === 'pr'}
		<PrSidePanel />
	{:else}
		<BlamePanel />
	{/if}
</div>
