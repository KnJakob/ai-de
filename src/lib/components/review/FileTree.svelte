<script lang="ts">
	import Pin from '@lucide/svelte/icons/pin';
	import Radio from '@lucide/svelte/icons/radio';
	import type { ReviewState } from '$lib/state.svelte';
	import { filePath } from '$lib/types';

	let { state }: { state: ReviewState } = $props();

	const groups = $derived.by(() => {
		// git2 delivers deltas in alphabetical path order, so files that share
		// a dir aren't necessarily adjacent (e.g. "src/lib/backend.ts" and
		// "src/lib/state.svelte.ts" sort with "src/lib/components/" and
		// "src/lib/mock/" in between) — bucket by dir instead of assuming runs.
		const byDir = new Map<string, { path: string; name: string; status: string; added: number; removed: number }[]>();
		for (const f of state.files) {
			const path = filePath(f);
			const bucket = byDir.get(f.dir) ?? [];
			bucket.push({ path, name: f.name, status: f.status, added: f.added, removed: f.removed });
			byDir.set(f.dir, bucket);
		}
		return [...byDir.entries()].map(([dir, files]) => ({ dir, files }));
	});

	const statusColor: Record<string, string> = {
		A: 'var(--color-add)',
		D: 'var(--color-del)',
		M: 'var(--color-accent-2, var(--color-accent-400))'
	};
</script>

<div
	class="flex h-full min-h-0 flex-col border-r"
	style="background:var(--color-panel);border-color:var(--color-divider)"
>
	<div class="flex items-center justify-between px-3 pt-[11px] pb-2">
		<span class="font-medium text-[10px] tracking-[0.10em] uppercase" style="color:var(--color-neutral-600)">Changed files</span>
		<span
			class="rounded-full px-1.5 font-medium text-[10px]"
			style="font-family:var(--font-mono);color:var(--color-neutral-500);background:var(--color-surface)"
			>{state.files.length}</span
		>
	</div>

	<div class="flex-1 min-h-0 overflow-auto px-1.5 pb-2.5">
		{#if state.liveDiffLoading}
			<div class="px-3 py-4 text-[12px]" style="color:var(--color-neutral-600)">Loading…</div>
		{:else if state.liveDiffError}
			<div class="px-3 py-4 text-[12px]" style="color:var(--color-del)">{state.liveDiffError}</div>
		{:else if state.files.length === 0}
			<div class="px-3 py-4 text-[12px]" style="color:var(--color-neutral-600)">No local changes.</div>
		{/if}
		{#each groups as group (group.dir)}
			<div class="flex items-center gap-1.5 px-2 pt-[9px] pb-1 text-[11px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">
				{group.dir}
			</div>
			{#each group.files as f (f.path)}
				{@const active = f.path === state.active}
				{@const hasNotes = state.notesFor(f.path).length > 0}
				<button
					onclick={() => state.setActive(f.path)}
					class="flex w-full items-center gap-2 rounded-[5px] py-[5px] pr-2 pl-5 text-left text-[12.5px]"
					style:background={active ? '#2a2c3e' : 'transparent'}
					style:color={active ? 'var(--color-text)' : 'var(--color-neutral-400)'}
				>
					<span class="flex-none font-semibold text-[10px]" style:color={statusColor[f.status]} style="font-family:var(--font-mono)">{f.status}</span>
					<span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{f.name}</span>
					{#if hasNotes}
						<Pin size={11} style="color:var(--color-brand)" />
					{/if}
					<span class="flex-none font-medium text-[10.5px]" style="font-family:var(--font-mono);color:var(--color-add)">+{f.added}</span>
					<span class="flex-none font-medium text-[10.5px]" style="font-family:var(--font-mono);color:var(--color-del)">−{f.removed}</span>
				</button>
			{/each}
		{/each}
	</div>

	<div class="flex items-center gap-[7px] border-t px-3 py-[9px]" style="border-color:var(--color-divider)">
		<Radio size={13} style="color:var(--color-brand)" />
		<span class="text-[11px]" style="color:var(--color-neutral-500)">Watching working directory</span>
	</div>
</div>
