<script lang="ts">
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { SHORTCUTS } from '$lib/mock/data';
	import type { ReviewState } from '$lib/state.svelte';

	let { state }: { state: ReviewState } = $props();
</script>

<Dialog.Root bind:open={state.shortcutsOpen}>
	<Dialog.Content
		showCloseButton={false}
		class="w-[min(620px,100%)] max-w-none rounded-[14px] p-0"
		style="background:var(--color-surface-2);box-shadow:0 0 0 1px var(--color-neutral-500),0 16px 40px rgba(0,0,0,0.65)"
	>
		<div class="px-6 pt-5.5 pb-5">
			<div class="mb-1 flex items-center gap-2.5">
				<Keyboard size={18} style="color:var(--color-brand)" />
				<span class="font-medium text-[19px] tracking-[-0.015em]" style="color:var(--color-text)">Keyboard</span>
				<div class="flex-1"></div>
				<span class="text-[11px]" style="color:var(--color-neutral-600)">Esc to close</span>
			</div>
			<div class="mb-4 text-[12px]" style="color:var(--color-neutral-500)">Reviewing is a keyboard job — the mouse is optional.</div>
			<div class="grid grid-cols-2 gap-x-[34px] gap-y-[22px]">
				{#each SHORTCUTS as g (g.name)}
					<div>
						<div class="mb-2 font-medium text-[10px] tracking-[0.10em] uppercase" style="color:var(--color-neutral-600)">{g.name}</div>
						{#each g.items as s (s.key)}
							<div class="flex items-center gap-2.5 py-1">
								<span
									class="min-w-16 rounded-[5px] px-1.5 py-0.5 text-center font-medium text-[11px]"
									style="font-family:var(--font-mono);background:#262838;box-shadow:0 0 0 1px var(--color-neutral-800);color:var(--color-accent-300)"
									>{s.key}</span
								>
								<span class="text-[12.5px]" style="color:var(--color-neutral-300)">{s.label}</span>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
