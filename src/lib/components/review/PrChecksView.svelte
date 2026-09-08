<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import { PR } from '$lib/mock/data';
</script>

<div class="min-h-0 flex-1 overflow-auto px-[22px] pt-5 pb-10">
	<div class="max-w-[700px]">
		{#each PR.checks as c (c.name)}
			<div class="mb-2 flex items-center gap-3 rounded-[9px] px-3.5 py-3.5" style="background:var(--color-surface-2);box-shadow:0 0 0 1px rgba(233,233,237,0.09)">
				{#if c.state === 'passed'}
					<CircleCheck size={17} style="color:var(--color-approved)" />
				{:else}
					<CircleDashed size={17} style="color:var(--color-accent-400)" />
				{/if}
				<span class="min-w-0 flex-1">
					<span class="block font-medium text-[13px]" style="color:var(--color-text)">{c.name}</span>
					<span class="mt-0.5 block text-[11.5px]" style="color:var(--color-neutral-600)">{c.detail}</span>
				</span>
				<span class="text-[11.5px]" style="font-family:var(--font-mono);color:var(--color-neutral-500)">
					{c.state === 'running' ? 'running' : ''}
				</span>
			</div>
		{/each}
	</div>
</div>
