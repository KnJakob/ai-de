<script lang="ts">
	import LogIn from '@lucide/svelte/icons/log-in';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import type { Snippet } from 'svelte';
	import type { ReviewState } from '$lib/state.svelte';
	import type { PrListItem } from '$lib/types';

	let {
		state,
		children
	}: { state: ReviewState; children: Snippet<[{ prs: PrListItem[]; owner: string; repo: string }]> } = $props();
</script>

{#if state.prListLoading && !state.prList}
	<div class="flex min-h-0 flex-1 items-center justify-center text-[12.5px]" style="color:var(--color-neutral-600)">
		Loading pull requests…
	</div>
{:else if state.prListError}
	<div class="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-[12.5px]" style="color:var(--color-del)">
		{state.prListError}
	</div>
{:else if state.prList?.kind === 'notAuthenticated'}
	<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
		<p class="max-w-[320px] text-[12.5px]" style="color:var(--color-neutral-500)">
			Sign in with GitHub to see this repo's pull requests, checks, and comments.
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
{:else if state.prList?.kind === 'noRemote'}
	<div class="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-[12.5px]" style="color:var(--color-neutral-600)">
		This folder isn't a GitHub repository (no "origin" remote pointing at github.com).
	</div>
{:else if state.prList?.kind === 'found'}
	{@const list = state.prList}
	{@render children({ prs: list.prs, owner: list.owner, repo: list.repo })}
{/if}
