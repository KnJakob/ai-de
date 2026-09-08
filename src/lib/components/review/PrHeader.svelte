<script lang="ts">
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import FileX from '@lucide/svelte/icons/file-x';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Bot from '@lucide/svelte/icons/bot';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import FileCode from '@lucide/svelte/icons/file-code';
	import GitCommitHorizontal from '@lucide/svelte/icons/git-commit-horizontal';
	import { FILES, PR } from '$lib/mock/data';
	import type { ReviewState } from '$lib/state.svelte';
	import type { PrTab } from '$lib/types';

	let { state }: { state: ReviewState } = $props();

	const prTabs: { id: PrTab; label: string; Icon: typeof GitPullRequest; count: number }[] = [
		{ id: 'conversation', label: 'Conversation', Icon: MessageSquareText, count: 3 },
		{ id: 'files', label: 'Files changed', Icon: FileCode, count: FILES.length },
		{ id: 'commits', label: 'Commits', Icon: GitCommitHorizontal, count: 3 },
		{ id: 'checks', label: 'Checks', Icon: CircleCheck, count: 3 }
	];
</script>

<div class="border-b px-[22px] pt-4" style="background:var(--color-header-2);border-color:var(--color-divider)">
	<div class="mb-[7px] flex items-center gap-2.5">
		<span
			class="inline-flex items-center gap-[5px] rounded-full px-2.5 py-0.5 font-medium text-[10.5px] tracking-[0.06em] uppercase"
			style="background:rgba(145,132,217,0.14);box-shadow:inset 0 0 0 1px rgba(145,132,217,0.45);color:var(--color-accent-300)"
		>
			<GitPullRequest size={11} />Open
		</span>
		<span class="text-[12px]" style="font-family:var(--font-mono);color:var(--color-neutral-600)">#{PR.number}</span>
		<div class="flex-1"></div>

		{#if !state.review}
			<div class="mr-[3px] flex items-center gap-[7px]">
				<span class="mr-0.5 text-[11px]" style="color:var(--color-neutral-600)">Your review</span>
				<button
					onclick={() => state.approve()}
					class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-[11.5px]"
					style="border:1px solid var(--color-brand);color:var(--color-accent-300)"
				>
					<CircleCheck size={13} />Approve
				</button>
				<button
					onclick={() => state.requestChanges()}
					class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-[11.5px]"
					style="border:1px solid var(--color-divider);color:var(--color-neutral-400)"
				>
					<FileX size={13} />Request changes
				</button>
			</div>
		{:else}
			{@const approved = state.review === 'approved'}
			<div
				class="mr-[3px] flex items-center gap-2 rounded-md px-2.5 py-1"
				style:background={approved ? 'rgba(112,168,134,0.12)' : 'rgba(190,112,118,0.12)'}
				style:box-shadow={`inset 0 0 0 1px ${approved ? 'rgba(112,168,134,0.40)' : 'rgba(190,112,118,0.40)'}`}
			>
				{#if approved}<CircleCheck size={13} style="color:var(--color-approved)" />{:else}<FileX size={13} style="color:var(--color-changes-requested)" />{/if}
				<span class="font-medium text-[11.5px]" style:color={approved ? 'var(--color-approved)' : 'var(--color-changes-requested)'}>
					{approved ? 'You approved these changes' : 'You requested changes'}
				</span>
				<button onclick={() => state.undoReview()} class="pl-0.5 text-[11px]" style="color:var(--color-neutral-500)">Undo</button>
			</div>
		{/if}

		<a
			href="https://github.com"
			target="_blank"
			rel="noreferrer"
			class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-[11.5px] no-underline"
			style="border:1px solid var(--color-divider);color:var(--color-neutral-400)"
		>
			<ExternalLink size={12} />Open on GitHub
		</a>
	</div>

	<div class="max-w-[820px] font-medium text-[22px] leading-[1.2] tracking-[-0.015em]" style="color:var(--color-text)">{PR.title}</div>

	<div class="mt-2.5 flex flex-wrap items-center gap-1.5 text-[12px]" style="color:var(--color-neutral-500)">
		<Bot size={14} style="color:var(--color-brand)" />
		<span class="font-medium" style="color:var(--color-neutral-300)">{PR.author}</span>
		<span>wants to merge 3 commits into</span>
		<span class="text-[11.5px]" style="font-family:var(--font-mono);color:var(--color-accent-400)">main</span>
		<span>from</span>
		<span class="text-[11.5px]" style="font-family:var(--font-mono);color:var(--color-accent-400)">agent/debounce-watcher</span>
		<span style="color:var(--color-neutral-700)">·</span>
		<span>{PR.opened}</span>
	</div>

	<div class="mt-3 flex gap-0.5">
		{#each prTabs as t (t.id)}
			<button
				onclick={() => (state.prTab = t.id)}
				class="flex items-center gap-1.5 px-3 py-2 font-medium text-[12.5px]"
				style:color={state.prTab === t.id ? 'var(--color-text)' : 'var(--color-neutral-500)'}
				style:box-shadow={state.prTab === t.id ? 'inset 0 -2px 0 0 var(--color-brand)' : 'none'}
			>
				<t.Icon size={14} />{t.label}
				<span
					class="rounded-full px-[5px] font-medium text-[10px]"
					style="font-family:var(--font-mono)"
					style:background={state.prTab === t.id ? 'rgba(145,132,217,0.20)' : '#262836'}
					style:color={state.prTab === t.id ? 'var(--color-accent-300)' : 'var(--color-neutral-500)'}
					>{t.count}</span
				>
			</button>
		{/each}
	</div>
</div>
