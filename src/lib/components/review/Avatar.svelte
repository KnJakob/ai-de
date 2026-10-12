<script lang="ts">
	import { initialsFor } from '$lib/types';
	import type { PrAuthor } from '$lib/types';

	// author.avatarUrl is "" when GitHub omits the user (e.g. a deleted
	// account) — <img src=""> would otherwise make the browser re-request
	// the current page as an image, so fall back to initials instead.
	let { author, size = 14 }: { author: PrAuthor; size?: number } = $props();
</script>

{#if author.avatarUrl}
	<img src={author.avatarUrl} alt="" class="rounded-full" style="width:{size}px;height:{size}px" />
{:else}
	<span
		class="flex items-center justify-center rounded-full font-medium"
		style="width:{size}px;height:{size}px;font-size:{size * 0.45}px;background:var(--color-neutral-800);color:var(--color-neutral-300)"
	>
		{initialsFor(author.login)}
	</span>
{/if}
