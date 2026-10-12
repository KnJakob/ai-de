<script lang="ts">
	import LogIn from '@lucide/svelte/icons/log-in';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import type { Snippet } from 'svelte';
	import type { ReviewState } from '$lib/state.svelte';
	import type { PrSummary } from '$lib/types';

	let { state, children }: { state: ReviewState; children: Snippet<[PrSummary]> } = $props();
</script>

{#if state.prOverviewLoading && !state.prOverview}
	<div class="flex min-h-0 flex-1 items-center justify-center text-[12.5px]" style="color:var(--color-neutral-600)">
		Loading pull request…
	</div>
{:else if state.prOverviewError}
	<div class="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-[12.5px]" style="color:var(--color-del)">
		{state.prOverviewError}
	</div>
{:else if state.prOverview?.kind === 'notAuthenticated'}
	<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
		<p class="max-w-[320px] text-[12.5px]" style="color:var(--color-neutral-500)">
			Sign in with GitHub to see this branch's pull request, checks, and comments.
		</p>
		{#if state.signInInfo}
			<div class="flex flex-col items-center gap-2 rounded-lg px-4 py-3" style="background:var(--color-surface-2);box-shadow:0 0 0 1px rgba(233,233,237,0.10)">
				<span class="text-[11px]" style="color:var(--color-neutral-500)">Enter this code on the GitHub page that just opened:</span>
				<span class="font-medium text-[18px] tracking-[0.1em]" style="font-family:var(--font-mono);color:var(--color-accent-300)">{state.signInInfo.userCode}</span>
				{#if state.signInPolling}
					<span class="flex items-center gap-1.5 text-[11px]" style="color:var(--color-neutral-500)">
						<LoaderCircle size={12} class="animate-spin" />Waiting for approval…
					</span>
				{/if}
				<button onclick={() => state.cancelGithubSignIn()} class="text-[11px]" style="color:var(--color-neutral-600)">Cancel</button>
			</div>
		{:else}
			<button
				onclick={() => state.startGithubSignIn()}
				class="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-[12px]"
				style="border:1px solid var(--color-brand);color:var(--color-accent-300)"
			>
				<LogIn size={13} />Sign in with GitHub
			</button>
		{/if}
		{#if state.signInError}
			<span class="text-[11px]" style="color:var(--color-del)">{state.signInError}</span>
		{/if}
	</div>
{:else if state.prOverview?.kind === 'noRemote'}
	<div class="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-[12.5px]" style="color:var(--color-neutral-600)">
		This folder isn't a GitHub repository (no "origin" remote pointing at github.com).
	</div>
{:else if state.prOverview?.kind === 'noOpenPr'}
	{@const noPr = state.prOverview}
	<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
		<GitPullRequest size={20} style="color:var(--color-neutral-600)" />
		<span class="text-[12.5px]" style="color:var(--color-neutral-500)">
			No open pull request for <span style="font-family:var(--font-mono);color:var(--color-neutral-400)">{noPr.branch}</span>
			on {noPr.owner}/{noPr.repo}.
		</span>
	</div>
{:else if state.prOverview?.kind === 'found'}
	{@const pr = state.prOverview}
	{@render children(pr)}
{/if}
