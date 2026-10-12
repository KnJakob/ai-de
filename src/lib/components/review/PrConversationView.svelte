<script lang="ts">
	import GitCommitHorizontal from '@lucide/svelte/icons/git-commit-horizontal';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import Send from '@lucide/svelte/icons/send';
	import Pin from '@lucide/svelte/icons/pin';
	import { tokenize } from '$lib/mock/tokenize';
	import type { ReviewState } from '$lib/state.svelte';
	import { formatRelativeTime, initialsFor } from '$lib/types';
	import type { PrCommentRow, PrSummary } from '$lib/types';

	let { state, pr }: { state: ReviewState; pr: PrSummary } = $props();

	type Event =
		| { kind: 'body' }
		| { kind: 'comment'; comment: PrCommentRow }
		| { kind: 'event'; text: string; time: string; approved: boolean };

	const events = $derived.by(() => {
		const all: Event[] = [
			{ kind: 'body' },
			...pr.comments.map((comment) => ({ kind: 'comment' as const, comment })),
			...pr.reviewComments.map((comment) => ({ kind: 'comment' as const, comment }))
		];
		all.sort((a, b) => {
			const ta = a.kind === 'comment' ? a.comment.createdAt : pr.createdAt;
			const tb = b.kind === 'comment' ? b.comment.createdAt : pr.createdAt;
			return ta.localeCompare(tb);
		});
		if (state.review) {
			const approved = state.review === 'approved';
			all.push({
				kind: 'event',
				approved,
				time: 'just now',
				text: approved ? 'You approved this pull request (local only)' : 'You requested changes (local only)'
			});
		}
		return all;
	});

	// diff_hunk is raw unified-diff text — skip its own "@@ ... @@" header
	// line and split the rest into add/del/context rows for display.
	function hunkLines(hunk: string) {
		return hunk
			.split('\n')
			.filter((line) => !line.startsWith('@@'))
			.map((line) => {
				const sign = line[0] === '+' || line[0] === '-' ? line[0] : '';
				return { sign, text: line.slice(sign ? 1 : 0) };
			});
	}

	function localNoteFor(comment: PrCommentRow) {
		if (!comment.file || comment.line == null) return undefined;
		return state.notes.find((n) => n.line === comment.line && n.path === comment.file);
	}
</script>

<div class="min-h-0 flex-1 overflow-auto px-[22px] pt-5 pb-11">
	<div class="max-w-[860px]">
		{#each events as e, i (i)}
			{#if e.kind === 'body'}
				<div class="mb-3.5 rounded-[10px]" style="background:var(--color-surface-2);box-shadow:0 0 0 1px rgba(233,233,237,0.10)">
					<div class="flex items-center gap-2.5 border-b px-3.5 py-2.5" style="border-color:rgba(233,233,237,0.09)">
						<img src={pr.author.avatarUrl} alt="" class="h-5 w-5 rounded-full" />
						<span class="font-medium text-[12px]" style="color:var(--color-text)">{pr.author.login}</span>
						<span class="text-[11px]" style="color:var(--color-neutral-600)">described this pull request</span>
						<div class="flex-1"></div>
						<span class="text-[11px]" style="color:var(--color-neutral-600)">{formatRelativeTime(pr.createdAt)}</span>
					</div>
					<div class="p-3.5">
						<div class="whitespace-pre-wrap text-[13px] leading-[1.65]" style="color:var(--color-neutral-300)">
							{pr.body ?? '(no description)'}
						</div>
					</div>
				</div>
			{:else if e.kind === 'comment'}
				{@const c = e.comment}
				{@const lines = c.diffHunk ? hunkLines(c.diffHunk) : null}
				{@const note = localNoteFor(c)}
				<div
					class="mb-3.5 rounded-[10px]"
					style:background="var(--color-surface-3)"
					style:box-shadow={`0 0 0 1px ${c.file ? 'rgba(145,132,217,0.22)' : 'rgba(233,233,237,0.10)'}`}
				>
					<div class="flex items-center gap-2.5 border-b px-3.5 py-2.5" style="border-color:rgba(233,233,237,0.08)">
						<span
							class="flex h-5 w-5 items-center justify-center rounded-full font-medium text-[9px]"
							style="background:var(--color-neutral-800);color:var(--color-text)">{initialsFor(c.author.login)}</span
						>
						<span class="font-medium text-[12px]" style="color:var(--color-text)">{c.author.login}</span>
						{#if c.file}
							<span class="text-[11px]" style="color:var(--color-neutral-600)">commented on {c.file.split('/').pop()}</span>
						{/if}
						<div class="flex-1"></div>
						<span class="text-[11px]" style="color:var(--color-neutral-600)">{formatRelativeTime(c.createdAt)}</span>
					</div>
					{#if lines}
						<div class="mx-3.5 mt-3 overflow-hidden rounded-[7px]" style="background:var(--color-bg);box-shadow:0 0 0 1px rgba(233,233,237,0.09)">
							<div class="flex items-center gap-1.5 border-b px-2.5 py-1 text-[11px]" style="border-color:rgba(233,233,237,0.08);color:var(--color-neutral-500)">
								{c.file?.split('/').pop()}
								{#if c.line}<span style="color:var(--color-brand)">L{c.line}</span>{/if}
							</div>
							{#each lines as l, k (k)}
								<div
									class="grid grid-cols-[14px_minmax(0,1fr)] items-baseline text-[12px] leading-[21px]"
									style:background={l.sign === '+' ? 'var(--color-add-bg)' : l.sign === '-' ? 'var(--color-del-bg)' : 'transparent'}
									style="font-family:var(--font-mono)"
								>
									<span style:color={l.sign === '+' ? 'var(--color-add)' : l.sign === '-' ? 'var(--color-del)' : 'transparent'}>{l.sign}</span>
									<span class="overflow-x-auto pr-3 whitespace-pre">
										{#each tokenize(l.text) as seg, m (m)}<span style:color={seg.color}>{seg.text}</span>{/each}
									</span>
								</div>
							{/each}
						</div>
					{/if}
					<div class="p-3.5 text-[13px] leading-[1.6]" style="color:var(--color-neutral-300)">{c.body}</div>
					{#if note}
						<button
							onclick={() => { if (c.file) state.setActive(c.file); state.sidePanelTab = 'notes'; state.composerLine = c.line ?? null; }}
							class="mx-3.5 mb-3.5 flex w-[calc(100%-28px)] items-center gap-2 rounded-[7px] px-2.5 py-[7px]"
							style="background:rgba(145,132,217,0.08);box-shadow:inset 0 0 0 1px rgba(145,132,217,0.28)"
						>
							<Pin size={11} style="color:var(--color-brand)" />
							<span class="text-[11.5px]" style="color:var(--color-accent-300)">You have a local note on this line</span>
						</button>
					{/if}
				</div>
			{:else}
				<div class="flex items-center gap-2.5 py-1 pb-3.5 pl-1.5">
					<span
						class="flex h-[22px] w-[22px] items-center justify-center rounded-full"
						style="background:var(--color-surface);box-shadow:0 0 0 1px rgba(233,233,237,0.12)"
					>
						{#if e.approved}
							<CircleCheck size={12} style="color:var(--color-approved)" />
						{:else}
							<GitCommitHorizontal size={12} style="color:var(--color-brand)" />
						{/if}
					</span>
					<span class="text-[12px]" style="color:var(--color-neutral-500)">{e.text}</span>
					<span class="text-[11px]" style="color:var(--color-neutral-700)">{e.time}</span>
				</div>
			{/if}
		{/each}

		<div class="my-4.5 h-px" style="background:linear-gradient(to right,transparent,rgba(233,233,237,0.16) 48px,rgba(233,233,237,0.16) calc(100% - 48px),transparent)"></div>

		<div class="rounded-[10px] p-3.5" style="background:var(--color-surface-2);box-shadow:0 0 0 1px rgba(233,233,237,0.10)">
			<div class="mb-2.5 flex items-center gap-2">
				<MessageSquareText size={14} style="color:var(--color-brand)" />
				<span class="font-medium text-[12px]" style="color:var(--color-text)">Reply on GitHub</span>
				<span class="text-[11px]" style="color:var(--color-neutral-600)">— not wired to the GitHub API yet</span>
			</div>
			<textarea
				bind:value={state.replyText}
				placeholder="Leave a review comment…"
				class="min-h-[74px] w-full resize-y rounded-[7px] px-2.5 py-2.5 text-[13px] leading-[1.55]"
				style="border:1px solid var(--color-divider);background:var(--color-bg);color:var(--color-text)"
			></textarea>
			<div class="mt-2.5 flex items-center gap-2.5">
				<button
					onclick={() => state.postReply()}
					class="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-[12px]"
					style="border:1px solid var(--color-brand);color:var(--color-accent-300)"
				>
					<Send size={12} />Comment
				</button>
				<button
					onclick={() => state.divertReplyToNote()}
					class="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-[12px]"
					style="border:1px solid var(--color-divider);color:var(--color-neutral-400)"
				>
					<Pin size={12} />Keep as local note
				</button>
				<div class="flex-1"></div>
				<span class="text-[11px]" style="color:var(--color-neutral-600)">
					{state.replyText.trim() ? 'Markdown supported' : 'Local notes stay on this machine'}
				</span>
			</div>
		</div>
	</div>
</div>
