<script lang="ts">
	import { BLAME } from '$lib/mock/data';
</script>

<div class="min-h-0 flex-1 overflow-auto py-2 pb-5">
	{#each BLAME as b (b.line)}
		<div class="grid grid-cols-[34px_62px_minmax(0,1fr)] items-baseline gap-2.5 border-b px-3 py-1.5" style="border-color:rgba(233,233,237,0.06)">
			<span class="text-right text-[11px]" style="font-family:var(--font-mono);color:var(--color-neutral-700)">{b.line}</span>
			<span class="text-[11px]" style="font-family:var(--font-mono);color:var(--color-brand)">{b.sha}</span>
			<span class="min-w-0">
				<span class="block overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px]" style="color:var(--color-neutral-300)">{b.subject}</span>
				<span class="mt-0.5 block text-[10.5px]" style="color:var(--color-neutral-600)">{b.author} · {b.when}</span>
			</span>
		</div>
	{/each}
</div>
