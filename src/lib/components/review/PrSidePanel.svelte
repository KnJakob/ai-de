<script lang="ts">
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import Bot from '@lucide/svelte/icons/bot';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import { PR } from '$lib/mock/data';
</script>

<div class="min-h-0 flex-1 overflow-auto p-3.5">
	<div class="mb-2 flex items-center gap-2">
		<span
			class="inline-flex items-center gap-[5px] rounded-full px-2 py-0.5 font-medium text-[10.5px] tracking-[0.04em] uppercase"
			style="background:rgba(145,132,217,0.14);color:var(--color-accent-300)"
		>
			<GitPullRequest size={11} />Open
		</span>
		<span class="text-[11.5px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">#{PR.number}</span>
	</div>

	<div class="mb-2 font-medium text-[15.5px] leading-[1.35]" style="color:var(--color-text)">{PR.title}</div>
	<div class="mb-3.5 flex items-center gap-2 text-[11.5px]" style="color:var(--color-neutral-500)">
		<Bot size={13} style="color:var(--color-brand)" />{PR.author}
		<span style="color:var(--color-neutral-700)">·</span>{PR.opened}
	</div>

	<div class="text-[12.5px] leading-[1.62]" style="color:var(--color-neutral-300)">{PR.body}</div>

	<div class="my-4 h-px" style="background:linear-gradient(to right,transparent,rgba(233,233,237,0.16) 30px,rgba(233,233,237,0.16) calc(100% - 30px),transparent)"></div>

	{#each PR.checks as c (c.name)}
		<div class="flex items-center gap-2.5 py-1.5">
			{#if c.state === 'passed'}
				<CircleCheck size={14} style="color:var(--color-approved)" />
			{:else}
				<CircleDashed size={14} style="color:var(--color-accent-400)" />
			{/if}
			<span class="flex-1 text-[12px]" style="color:var(--color-neutral-300)">{c.name}</span>
			<span class="text-[11px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">{c.state === 'running' ? 'running' : ''}</span>
		</div>
	{/each}

	<div class="mt-4.5 mb-2 font-medium text-[10px] tracking-[0.10em] uppercase" style="color:var(--color-neutral-600)">Review comments</div>

	{#each PR.comments as c (c.text)}
		<div class="mb-2 rounded-lg px-2.5 py-2.5" style="background:var(--color-surface-2);box-shadow:0 0 0 1px rgba(233,233,237,0.09)">
			<div class="mb-1 flex items-center gap-2">
				<span
					class="flex h-[18px] w-[18px] items-center justify-center rounded-full font-medium text-[9px]"
					style="background:var(--color-neutral-800);color:var(--color-neutral-300)">{c.initials}</span
				>
				<span class="font-medium text-[11.5px]" style="color:var(--color-text)">{c.author}</span>
				{#if c.file}
					<span class="text-[10.5px]" style="font-family:var(--font-mono);color:var(--color-brand)">{c.file}:{c.line}</span>
				{/if}
				<div class="flex-1"></div>
				<span class="text-[10.5px]" style="color:var(--color-neutral-600)">{c.time}</span>
			</div>
			<div class="text-[12.5px] leading-[1.55]" style="color:var(--color-neutral-300)">{c.text}</div>
		</div>
	{/each}
</div>
