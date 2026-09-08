<script lang="ts">
	import Pin from '@lucide/svelte/icons/pin';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { DIFFS } from '$lib/mock/data';
	import { tokenize } from '$lib/mock/tokenize';
	import type { ReviewState } from '$lib/state.svelte';
	import type { Note } from '$lib/types';

	let { state }: { state: ReviewState } = $props();

	const diffs = $derived(state.mode === 'pr' ? DIFFS : state.diffs);
	const rows = $derived(diffs[state.active] ?? []);
	const notesByLine = $derived.by(() => {
		const map = new Map<number, Note>();
		for (const n of state.notesFor(state.active)) map.set(n.line, n);
		return map;
	});
</script>

<div class="min-h-0 flex-1 overflow-auto py-1.5" style="background:var(--color-bg)">
	{#if state.mode === 'live' && rows.length === 0}
		<div class="px-3.5 py-4 text-[12.5px]" style="color:var(--color-neutral-600)">
			{#if state.liveDiffLoading}
				Loading…
			{:else if state.liveDiffError}
				<span style="color:var(--color-del)">{state.liveDiffError}</span>
			{:else if state.files.length === 0}
				No local changes to show.
			{:else}
				Select a file to see its diff.
			{/if}
		</div>
	{/if}
	{#each rows as row, i (i)}
		{#if row.kind === 'hunk'}
			<div
				class="my-3.5 flex items-center gap-2.5 border-y px-3.5 py-1"
				style="background:var(--color-surface-2);border-color:rgba(233,233,237,0.08)"
			>
				<span class="font-medium text-[11px]" style="font-family:var(--font-mono);color:var(--color-brand)">{row.range}</span>
				<span class="text-[11px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">{row.context}</span>
			</div>
		{:else}
			{@const isAdd = row.kind === 'add'}
			{@const isDel = row.kind === 'del'}
			{@const note = row.newLine ? notesByLine.get(row.newLine) : undefined}
			<div
				class="grid grid-cols-[26px_46px_46px_16px_minmax(0,1fr)] items-start border-l-2"
				style:background={isAdd ? 'var(--color-add-bg)' : isDel ? 'var(--color-del-bg)' : 'transparent'}
				style:border-color={isAdd ? 'var(--color-add-edge)' : isDel ? 'var(--color-del-edge)' : 'transparent'}
			>
				<button
					disabled={!row.newLine}
					onclick={() => row.newLine && state.pinLine(row.newLine as number)}
					class="flex h-[23px] items-center justify-center text-[11px]"
					style:color={note ? 'var(--color-brand)' : 'transparent'}
				>
					{#if row.newLine}
						{#if note}<Pin size={11} />{:else}<Plus size={11} class="opacity-0 hover:opacity-100" />{/if}
					{/if}
				</button>
				<span class="pr-2.5 text-right leading-[23px] select-none" style="color:var(--color-neutral-700)">{row.oldLine}</span>
				<span class="pr-2.5 text-right leading-[23px] select-none" style="color:var(--color-neutral-700)">{row.newLine}</span>
				<span
					class="leading-[23px] select-none"
					style:color={isAdd ? 'var(--color-add)' : isDel ? 'var(--color-del)' : 'transparent'}
					>{isAdd ? '+' : isDel ? '−' : ''}</span
				>
				<span
					class="overflow-wrap-anywhere pr-4.5 leading-[23px] text-[12.5px]"
					style:white-space={state.wrap ? 'pre-wrap' : 'pre'}
					style="font-family:var(--font-mono)"
				>
					{#each tokenize(row.text) as seg, j (j)}<span style:color={seg.color}>{seg.text}</span>{/each}
				</span>
			</div>
			{#if note}
				<div
					class="mx-4.5 my-1.5 rounded-lg px-3 py-2.5"
					style="margin-left:74px;background:var(--color-surface-3);box-shadow:0 0 0 1px rgba(145,132,217,0.32)"
				>
					<div class="mb-1 flex items-center gap-2">
						<Pin size={11} style="color:var(--color-brand)" />
						<span class="font-medium text-[11px]" style="color:var(--color-accent-300)">{note.author}</span>
						<span class="text-[11px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">L{note.line}</span>
						<div class="flex-1"></div>
						<span class="text-[10.5px]" style="color:var(--color-neutral-600)">{note.time}</span>
						<button onclick={() => state.deleteNote(note.id)} style="color:var(--color-neutral-600)"><X size={12} /></button>
					</div>
					<div class="text-[12.5px] leading-[1.5]" style="color:var(--color-neutral-300)">{note.text}</div>
				</div>
			{/if}
		{/if}
	{/each}
</div>
