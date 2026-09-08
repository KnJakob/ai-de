<script lang="ts">
	import Pin from '@lucide/svelte/icons/pin';
	import type { ReviewState } from '$lib/state.svelte';

	let { state }: { state: ReviewState } = $props();

	const fileNotes = $derived(state.notesFor(state.active));
</script>

<div class="min-h-0 flex-1 overflow-auto p-3">
	<div class="rounded-lg p-2.5" style:background="var(--color-surface-3)" style:box-shadow={`0 0 0 1px ${state.composerLine ? 'rgba(145,132,217,0.32)' : 'rgba(233,233,237,0.10)'}`}>
		<div class="mb-1.5 flex items-center gap-1.5">
			<Pin size={12} style="color:var(--color-brand)" />
			<span class="font-medium text-[11px]" style="color:var(--color-neutral-400)">
				{state.composerLine ? `Pinning to line ${state.composerLine}` : 'Pick a line to pin to'}
			</span>
		</div>
		<textarea
			bind:value={state.composerText}
			placeholder="Note to self about this change…"
			class="min-h-[56px] w-full resize-y rounded-md px-2.5 py-2 text-[12.5px] leading-[1.5]"
			style="border:1px solid var(--color-divider);background:var(--color-bg);color:var(--color-text)"
		></textarea>
		<div class="mt-2 flex items-center gap-2">
			<button
				onclick={() => state.pinNote()}
				class="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-[11.5px]"
				style="border:1px solid var(--color-brand);color:var(--color-accent-300)"
			>
				<Pin size={12} />Pin note
			</button>
			<span class="text-[11px]" style="color:var(--color-neutral-600)">Stored locally · never posted</span>
		</div>
	</div>

	<div class="mt-4 mb-2 font-medium text-[10px] tracking-[0.10em] uppercase" style="color:var(--color-neutral-600)">Pinned in this file</div>

	{#each fileNotes as n (n.id)}
		<button
			onclick={() => (state.composerLine = n.line)}
			class="mb-1.5 w-full rounded-lg px-2.5 py-2.5 text-left"
			style="background:var(--color-surface-2);box-shadow:0 0 0 1px rgba(233,233,237,0.09)"
		>
			<div class="mb-1 flex items-center gap-2">
				<span class="text-[11px]" style="font-family:var(--font-mono);color:var(--color-brand)">L{n.line}</span>
				<div class="flex-1"></div>
				<span class="text-[10.5px]" style="color:var(--color-neutral-600)">{n.time}</span>
			</div>
			<div class="text-[12.5px] leading-[1.5]" style="color:var(--color-neutral-300)">{n.text}</div>
		</button>
	{:else}
		<div class="rounded-lg border border-dashed px-3 py-4.5 text-center text-[12px]" style="border-color:rgba(233,233,237,0.14);color:var(--color-neutral-600)">
			Click any line's left gutter to pin a note there.
		</div>
	{/each}
</div>
