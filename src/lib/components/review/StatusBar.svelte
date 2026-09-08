<script lang="ts">
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import Radio from '@lucide/svelte/icons/radio';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import type { ReviewState } from '$lib/state.svelte';

	let { state }: { state: ReviewState } = $props();
</script>

<div
	class="flex h-[27px] items-center gap-3.5 border-t px-3 text-[11px]"
	style="background:var(--color-header);border-color:var(--color-divider);color:var(--color-neutral-500)"
>
	<span class="flex items-center gap-1.5"><GitBranch size={12} />agent/debounce-watcher</span>
	<span class="flex items-center gap-1.5" style="color:var(--color-accent-300)"><Radio size={12} />claude-code · run 14</span>
	<span class="flex items-center gap-1.5"><MessageSquareText size={12} />{state.notes.length} local notes</span>
	<div class="flex-1"></div>
	<span style="color:var(--color-neutral-600)">Read-only</span>
	<button onclick={() => state.toggleShortcuts()} style="color:var(--color-neutral-500)">⌘/ shortcuts</button>
</div>
