import type { ReviewState } from '$lib/state.svelte';
import type { Command } from './commands';

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

// Normalizes a KeyboardEvent to the same token format Command.key uses:
// "mod+<key>" for Cmd/Ctrl combos — checking both covers this app's two
// target platforms (macOS, Linux) without sniffing the OS — otherwise the
// raw, case-sensitive key ('n' and 'N' are separate bindings, no shift flag
// needed).
export function keyToken(e: KeyboardEvent): string {
	if (e.metaKey || e.ctrlKey) return `mod+${e.key.toLowerCase()}`;
	return e.key;
}

// One global keydown handler, built from the command registry. Typing in a
// text field (notes, reply box, the search bar) is left alone entirely —
// those fields own their own keydown handling (e.g. the search bar's own
// Escape-to-close), so this never double-handles a keystroke.
export function createKeymapHandler(state: ReviewState, commands: Command[]) {
	return (e: KeyboardEvent) => {
		if (isTypingTarget(e.target)) return;
		const token = keyToken(e);
		const command = commands.find((c) => c.key === token && (!c.when || c.when(state)));
		if (!command) return;
		e.preventDefault();
		command.run(state);
	};
}
