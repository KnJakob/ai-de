<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import type { ReviewState } from '$lib/state.svelte';
	import { formatRelativeTime } from '$lib/types';
	import type { PrSummary } from '$lib/types';
	import Avatar from './Avatar.svelte';

	let { state, pr }: { state: ReviewState; pr: PrSummary } = $props();

	const allComments = $derived(
		[...pr.comments, ...pr.reviewComments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
	);
</script>

<div class="min-h-0 flex-1 overflow-auto p-3.5">
	<button
		onclick={() => state.backToPrList()}
		class="mb-2 flex items-center gap-1 text-[11px]"
		style="color:var(--color-neutral-500)"
	>
		<ArrowLeft size={11} />All PRs
	</button>
	<div class="mb-2 flex items-center gap-2">
		<span
			class="inline-flex items-center gap-[5px] rounded-full px-2 py-0.5 font-medium text-[10.5px] tracking-[0.04em] uppercase"
			style="background:rgba(145,132,217,0.14);color:var(--color-accent-300)"
		>
			<GitPullRequest size={11} />Open
		</span>
		<span class="text-[11.5px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">#{pr.number}</span>
	</div>

	<div class="mb-2 font-medium text-[15.5px] leading-[1.35]" style="color:var(--color-text)">{pr.title}</div>
	<div class="mb-3.5 flex items-center gap-2 text-[11.5px]" style="color:var(--color-neutral-500)">
		<Avatar author={pr.author} size={14} />{pr.author.login}
		<span style="color:var(--color-neutral-700)">·</span>{formatRelativeTime(pr.createdAt)}
	</div>

	<div class="whitespace-pre-wrap text-[12.5px] leading-[1.62]" style="color:var(--color-neutral-300)">{pr.body ?? '(no description)'}</div>

	<div class="my-4 h-px" style="background:linear-gradient(to right,transparent,rgba(233,233,237,0.16) 30px,rgba(233,233,237,0.16) calc(100% - 30px),transparent)"></div>

	{#each pr.checks as c (c.name)}
		<div class="flex items-center gap-2.5 py-1.5">
			{#if c.state === 'passed'}
				<CircleCheck size={14} style="color:var(--color-approved)" />
			{:else if c.state === 'running'}
				<CircleDashed size={14} style="color:var(--color-accent-400)" />
			{:else}
				<CircleX size={14} style="color:var(--color-changes-requested)" />
			{/if}
			<span class="flex-1 text-[12px]" style="color:var(--color-neutral-300)">{c.name}</span>
		</div>
	{/each}

	<div class="mt-4.5 mb-2 font-medium text-[10px] tracking-[0.10em] uppercase" style="color:var(--color-neutral-600)">Review comments</div>

	{#each allComments as c, i (i)}
		<div class="mb-2 rounded-lg px-2.5 py-2.5" style="background:var(--color-surface-2);box-shadow:0 0 0 1px rgba(233,233,237,0.09)">
			<div class="mb-1 flex items-center gap-2">
				<Avatar author={c.author} size={18} />
				<span class="font-medium text-[11.5px]" style="color:var(--color-text)">{c.author.login}</span>
				{#if c.file}
					<span class="text-[10.5px]" style="font-family:var(--font-mono);color:var(--color-brand)">{c.file}{c.line ? `:${c.line}` : ''}</span>
				{/if}
				<div class="flex-1"></div>
				<span class="text-[10.5px]" style="color:var(--color-neutral-600)">{formatRelativeTime(c.createdAt)}</span>
			</div>
			<div class="text-[12.5px] leading-[1.55]" style="color:var(--color-neutral-300)">{c.body}</div>
		</div>
	{:else}
		<div class="text-[12px]" style="color:var(--color-neutral-600)">No comments yet.</div>
	{/each}
</div>
