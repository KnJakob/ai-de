<script lang="ts">
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import type { ReviewState } from '$lib/state.svelte';
	import { formatRelativeTime } from '$lib/types';
	import type { PrListItem } from '$lib/types';
	import Avatar from './Avatar.svelte';

	let { state, prs, owner, repo }: { state: ReviewState; prs: PrListItem[]; owner: string; repo: string } = $props();
</script>

<div class="min-h-0 flex-1 overflow-auto p-3.5">
	<div class="mb-3 text-[11px]" style="color:var(--color-neutral-600)">Open pull requests on {owner}/{repo}</div>

	{#each prs as pr (pr.number)}
		<button
			onclick={() => state.selectPr(pr.number)}
			class="mb-1.5 flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left"
			style:background="var(--color-surface-2)"
			style:box-shadow={pr.isCurrentBranch ? '0 0 0 1px rgba(145,132,217,0.35)' : '0 0 0 1px rgba(233,233,237,0.09)'}
		>
			<Avatar author={pr.author} size={18} />
			<span class="min-w-0 flex-1">
				<span class="block text-[12.5px] leading-[1.4]" style="color:var(--color-text)">{pr.title}</span>
				<span class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]" style="color:var(--color-neutral-600)">
					<span style="font-family:var(--font-mono);color:var(--color-brand)">#{pr.number}</span>
					<span style="font-family:var(--font-mono)">{pr.headRef}</span>
					{#if pr.isCurrentBranch}
						<span
							class="rounded-full px-1.5 font-medium text-[10px] uppercase tracking-[0.04em]"
							style="background:rgba(145,132,217,0.18);color:var(--color-accent-300)">current branch</span
						>
					{/if}
					<span>·</span>
					<span>{formatRelativeTime(pr.createdAt)}</span>
				</span>
			</span>
		</button>
	{:else}
		<div class="flex flex-col items-center gap-2 py-10 text-center">
			<GitPullRequest size={20} style="color:var(--color-neutral-600)" />
			<span class="text-[12.5px]" style="color:var(--color-neutral-500)">No open pull requests on {owner}/{repo}.</span>
		</div>
	{/each}
</div>
