<script lang="ts">
	import { ReviewState } from '$lib/state.svelte';
	import TitleBar from '$lib/components/review/TitleBar.svelte';
	import ModeBar from '$lib/components/review/ModeBar.svelte';
	import FileTree from '$lib/components/review/FileTree.svelte';
	import CenterPane from '$lib/components/review/CenterPane.svelte';
	import SidePanel from '$lib/components/review/SidePanel.svelte';
	import StatusBar from '$lib/components/review/StatusBar.svelte';
	import ShortcutsDialog from '$lib/components/review/ShortcutsDialog.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';

	const state = new ReviewState();

	function onKeydown(e: KeyboardEvent) {
		if (e.key === '/' && (e.metaKey || e.ctrlKey || e.shiftKey)) {
			e.preventDefault();
			state.toggleShortcuts();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div
	class="grid h-dvh grid-rows-[38px_46px_minmax(0,1fr)_27px] overflow-hidden text-[13px] leading-[1.55]"
	style="background:var(--color-bg);color:var(--color-text)"
>
	<TitleBar {state} />
	<ModeBar {state} />

	<Resizable.PaneGroup direction="horizontal" class="min-h-0">
		<Resizable.Pane defaultSize={17} minSize={15} maxSize={32} class="h-full">
			<FileTree {state} />
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={61} minSize={32} class="h-full">
			<CenterPane {state} />
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={22} minSize={18} maxSize={38} class="h-full">
			<SidePanel {state} />
		</Resizable.Pane>
	</Resizable.PaneGroup>

	<StatusBar {state} />
</div>

<ShortcutsDialog {state} />
