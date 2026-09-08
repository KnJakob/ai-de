<script lang="ts">
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import Radio from '@lucide/svelte/icons/radio';
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import RotateCcwClock from '@lucide/svelte/icons/rotate-ccw-clock';
	import type { ReviewState } from '$lib/state.svelte';
	import type { ReviewMode } from '$lib/types';

	let { state }: { state: ReviewState } = $props();

	const modes: { id: ReviewMode; label: string; Icon: typeof GitBranch }[] = [
		{ id: 'live', label: 'Live diff', Icon: Radio },
		{ id: 'pr', label: 'PR #128', Icon: GitPullRequest },
		{ id: 'history', label: 'History', Icon: RotateCcwClock }
	];

	const totalAdd = $derived(state.files.reduce((a, f) => a + f.added, 0));
	const totalDel = $derived(state.files.reduce((a, f) => a + f.removed, 0));
</script>

<div
	class="flex h-[46px] items-center gap-3.5 border-b px-3.5"
	style="background:var(--color-bg);border-color:var(--color-divider)"
>
	<div class="flex min-w-0 items-center gap-1.5">
		<GitBranch size={14} style="color:var(--color-brand)" />
		<span class="font-medium text-[12px]" style="color:var(--color-text)">agent/debounce-watcher</span>
		<span class="px-0.5" style="color:var(--color-neutral-700)">←</span>
		<span class="text-[12px]" style="color:var(--color-neutral-500)">main</span>
	</div>

	<div class="h-[18px] w-px" style="background:var(--color-divider)"></div>

	<div class="flex rounded-md p-0.5" style="background:var(--color-surface-2);box-shadow:0 0 0 1px #2f3242">
		{#each modes as m (m.id)}
			<button
				onclick={() => state.setMode(m.id)}
				class="flex items-center gap-1.5 rounded px-[11px] py-1 font-medium text-[12px]"
				style:background={state.mode === m.id ? '#2e3145' : 'transparent'}
				style:color={state.mode === m.id ? 'var(--color-text)' : 'var(--color-neutral-500)'}
			>
				<m.Icon size={13} />{m.label}
			</button>
		{/each}
	</div>

	<div class="flex-1"></div>

	<div class="flex items-center gap-2.5" style="font:500 12px var(--font-mono)">
		<span style="color:var(--color-add)">+{totalAdd}</span>
		<span style="color:var(--color-del)">−{totalDel}</span>
		<span style="color:var(--color-neutral-700)">·</span>
		<span style="color:var(--color-neutral-500)">{state.files.length} files</span>
	</div>

	<div
		class="flex items-center gap-[7px] rounded-full px-2.5 py-1"
		style="background:rgba(145,132,217,0.10);box-shadow:0 0 0 1px rgba(145,132,217,0.35)"
	>
		<span class="h-1.5 w-1.5 rounded-full" style="background:var(--color-brand);animation:aide-pulse 1.7s ease-in-out infinite"></span>
		<span class="font-medium text-[11px] tracking-[0.02em]" style="color:var(--color-accent-300)">Agent writing · 2s ago</span>
	</div>
</div>
