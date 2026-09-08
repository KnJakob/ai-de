import type { CodeToken } from '$lib/types';

// Cheap Rust/TS-ish highlighter for the mock diff text — good enough to make
// the review pane read as code. Real syntax highlighting is Shiki's job
// (see docs/stack.md); this stays until the backend hands over real files.
const COLOR = {
	comment: 'var(--color-neutral-600)',
	string: '#9fc7b0',
	keyword: 'var(--color-accent-400)',
	number: 'var(--color-accent-300)',
	type: 'var(--color-accent-2, var(--color-neutral-300))',
	call: 'var(--color-neutral-300)',
	plain: 'var(--color-neutral-400)'
};

const TOKEN_RE =
	/(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(fn|let|mut|use|pub|struct|impl|self|match|if|else|return|for|in|as|const|async|await|move|Some|None|Ok|Err|crate|enum|type|export|import|function|from|new|true|false)\b|\b(\d+(?:\.\d+)?)\b|([A-Z][A-Za-z0-9_]*)|([a-z_][A-Za-z0-9_]*)(?=\s*[(<])/g;

export function tokenize(src: string): CodeToken[] {
	const out: CodeToken[] = [];
	let last = 0;
	let m: RegExpExecArray | null;
	TOKEN_RE.lastIndex = 0;
	while ((m = TOKEN_RE.exec(src))) {
		if (m.index > last) out.push({ text: src.slice(last, m.index), color: COLOR.plain });
		const color = m[1]
			? COLOR.comment
			: m[2]
				? COLOR.string
				: m[3]
					? COLOR.keyword
					: m[4]
						? COLOR.number
						: m[5]
							? COLOR.type
							: COLOR.call;
		out.push({ text: m[0], color });
		last = m.index + m[0].length;
	}
	if (last < src.length) out.push({ text: src.slice(last), color: COLOR.plain });
	if (!out.length) out.push({ text: ' ', color: COLOR.plain });
	return out;
}
