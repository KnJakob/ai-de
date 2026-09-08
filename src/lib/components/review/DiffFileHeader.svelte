<script lang="ts">
	import FileCode from '@lucide/svelte/icons/file-code';
	import TextWrap from '@lucide/svelte/icons/text-wrap';
	import type { ReviewState } from '$lib/state.svelte';
	import { filePath } from '$lib/types';

	let { state }: { state: ReviewState } = $props();

	const activeFile = $derived(state.activeFiles.find((f) => filePath(f) === state.active));
	const hunkCount = $derived((state.activeDiffs[state.active] ?? []).filter((r) => r.kind === 'hunk').length);
	const hunkLabel = $derived(
		activeFile
			? `${hunkCount} ${hunkCount === 1 ? 'hunk' : 'hunks'} · +${activeFile.added} −${activeFile.removed}`
			: ''
	);
</script>

<div
	class="flex h-[34px] items-center gap-2.5 border-b px-3"
	style="background:var(--color-bg);border-color:var(--color-divider)"
>
	<FileCode size={13} style="color:var(--color-neutral-500)" />
	<span class="overflow-hidden text-ellipsis whitespace-nowrap text-[12px]" style="font-family:var(--font-mono);color:var(--color-neutral-400)">
		{#if activeFile}
			{activeFile.dir}{activeFile.dir ? '/' : ''}<span class="font-medium" style="color:var(--color-text)">{activeFile.name}</span>
		{:else}
			<span style="color:var(--color-neutral-600)">No file selected</span>
		{/if}
	</span>
	<div class="flex-1"></div>
	<span class="flex-none whitespace-nowrap text-[11px]" style="color:var(--color-neutral-600)">{hunkLabel}</span>
	<button
		onclick={() => state.toggleWrap()}
		class="flex items-center gap-1.5 rounded px-2.5 py-[3px] font-medium text-[11px]"
		style:border={state.wrap ? '1px solid var(--color-brand)' : '1px solid var(--color-divider)'}
		style:color={state.wrap ? 'var(--color-accent-300)' : 'var(--color-neutral-500)'}
	>
		<TextWrap size={12} />{state.wrap ? 'Wrap on' : 'Wrap off'}
	</button>
</div>
