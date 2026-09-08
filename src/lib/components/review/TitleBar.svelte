<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import type { ReviewState } from '$lib/state.svelte';

	let { state }: { state: ReviewState } = $props();

	const projects = [
		{ name: 'ai-de', active: true },
		{ name: 'notes-sync', active: false }
	];
</script>

<div
	class="flex h-[38px] items-center gap-4 border-b px-3"
	style="background:var(--color-header);border-color:var(--color-divider)"
>
	<div class="flex flex-none items-center gap-2">
		<span class="h-[11px] w-[11px] rounded-full" style="background:#4a4d5c"></span>
		<span class="h-[11px] w-[11px] rounded-full" style="background:#4a4d5c"></span>
		<span class="h-[11px] w-[11px] rounded-full" style="background:#4a4d5c"></span>
	</div>

	<div class="ml-2 flex h-full items-stretch gap-0.5">
		{#each projects as p (p.name)}
			<button
				class="flex items-center gap-[7px] px-[13px] font-medium text-[12px] transition-colors"
				style:background={p.active ? 'var(--color-surface)' : 'transparent'}
				style:color={p.active ? 'var(--color-text)' : 'var(--color-neutral-500)'}
				style:box-shadow={p.active ? 'inset 0 -2px 0 0 var(--color-brand)' : 'none'}
			>
				<span
					class="h-1.5 w-1.5 rounded-full"
					style:background={p.active ? 'var(--color-brand)' : '#4a4d5c'}
					style:animation={p.active ? 'aide-pulse 1.7s ease-in-out infinite' : 'none'}
				></span>
				{p.name}
			</button>
		{/each}
		<button
			class="flex items-center px-[9px] text-[14px]"
			style="color:var(--color-neutral-600)"
			title="Open another project"
		>
			<Plus size={14} />
		</button>
	</div>

	<div class="flex-1"></div>

	<div class="flex items-center gap-[3px]" style="color:var(--color-neutral-500)">
		<button
			onclick={() => state.toggleShortcuts()}
			title="Keyboard shortcuts"
			class="flex h-[24px] w-[26px] items-center justify-center rounded"
			style="color:var(--color-neutral-500)"
		>
			<Keyboard size={15} />
		</button>
		<button
			title="Refresh from Git"
			class="flex h-[24px] w-[26px] items-center justify-center rounded"
			style="color:var(--color-neutral-500)"
		>
			<RefreshCw size={15} />
		</button>
		<button
			title="Settings"
			class="flex h-[24px] w-[26px] items-center justify-center rounded"
			style="color:var(--color-neutral-500)"
		>
			<SlidersHorizontal size={15} />
		</button>
	</div>
</div>
