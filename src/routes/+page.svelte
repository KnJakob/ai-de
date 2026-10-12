<script lang="ts">
	import { onMount } from 'svelte';
	import { ReviewState, type PersistedUiState } from '$lib/state.svelte';
	import TitleBar from '$lib/components/review/TitleBar.svelte';
	import ModeBar from '$lib/components/review/ModeBar.svelte';
	import FileTree from '$lib/components/review/FileTree.svelte';
	import CenterPane from '$lib/components/review/CenterPane.svelte';
	import SidePanel from '$lib/components/review/SidePanel.svelte';
	import StatusBar from '$lib/components/review/StatusBar.svelte';
	import ShortcutsDialog from '$lib/components/review/ShortcutsDialog.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';

	// Reloading the webview re-runs this whole script from scratch (it's a
	// CSR-only app — no server to hold state for it). sessionStorage survives
	// a reload but not a full app restart, which matches "stay on the same
	// page" without carrying stale state into an unrelated future session.
	const STORAGE_KEY = 'ai-de:ui-state';
	function readPersisted(): Partial<PersistedUiState> | undefined {
		try {
			const raw = sessionStorage.getItem(STORAGE_KEY);
			return raw ? JSON.parse(raw) : undefined;
		} catch {
			return undefined;
		}
	}

	const state = new ReviewState(readPersisted());

	$effect(() => {
		const snapshot: PersistedUiState = {
			workspacePath: state.workspacePath,
			mode: state.mode,
			active: state.active,
			prTab: state.prTab,
			sidePanelTab: state.sidePanelTab,
			wrap: state.wrap,
			selectedPrNumber: state.selectedPrNumber
		};
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
	});

	onMount(() => {
		state.loadLiveDiff();
		state.loadBranchInfo();
		if (state.mode === 'pr') {
			state.loadPrList();
			if (state.selectedPrNumber !== null) state.selectPr(state.selectedPrNumber);
		}
		if (state.mode === 'history') state.loadCommitLog();
		// No filesystem watcher yet (see docs/stack.md's notify-crate phase) —
		// poll instead so Live mode doesn't go stale while an agent writes.
		const interval = setInterval(() => state.loadLiveDiff(), 10_000);
		return () => clearInterval(interval);
	});

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
