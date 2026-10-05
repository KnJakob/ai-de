<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import type { ReviewState } from '$lib/state.svelte';

	let { state }: { state: ReviewState } = $props();
</script>

<div
	class="flex h-[38px] items-center gap-4 border-b px-3"
	style="background:var(--color-header);border-color:var(--color-divider)"
>
	<div class="flex h-full items-stretch gap-0.5">
		<button
			class="flex items-center gap-[7px] px-[13px] font-medium text-[12px] transition-colors"
			style="background:var(--color-surface);color:var(--color-text);box-shadow:inset 0 -2px 0 0 var(--color-brand)"
			title={state.workspacePath ?? 'Current repository'}
		>
			<span
				class="h-1.5 w-1.5 rounded-full"
				style="background:var(--color-brand);animation:aide-pulse 1.7s ease-in-out infinite"
			></span>
			{state.workspaceName}
		</button>
		<button
			onclick={() => state.pickWorkspace()}
			class="flex items-center px-[9px] text-[14px]"
			style="color:var(--color-neutral-600)"
			title="Open a different folder"
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
			onclick={() => state.loadLiveDiff()}
			disabled={state.liveDiffLoading}
			title="Refresh from Git"
			class="flex h-[24px] w-[26px] items-center justify-center rounded disabled:opacity-50"
			style="color:var(--color-neutral-500)"
		>
			<RefreshCw size={15} class={state.liveDiffLoading ? 'animate-spin' : ''} />
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
