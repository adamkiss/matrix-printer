<script setup>
import { onMounted, onUnmounted, ref, watchEffect, watch } from "vue";

import { createEditor } from "prism-code-editor";
import { languages } from "prism-code-editor/prism";
import { insertText } from "prism-code-editor/utils";
import { indentGuides } from "prism-code-editor/guides";
import { matchBrackets } from "prism-code-editor/match-brackets";
import { cursorPosition } from "prism-code-editor/cursor";
import { matchTags } from "prism-code-editor/match-tags";
import { highlightBracketPairs } from "prism-code-editor/highlight-brackets";

// import "prism-code-editor/prism/languages/markup";
import "prism-code-editor/prism/languages/javascript";
import "prism-code-editor/prism/languages/liquid";
import { csv, tsv } from "../lib/languages.js";

import "prism-code-editor/layout.css";
// import "prism-code-editor/scrollbar.css";
// import "prism-code-editor/copy-button.css";
// import "prism-code-editor/languages";

const props = defineProps({
	language: {
		type: String,
		default: "plain",
	},
	wordWrap: {
		type: Boolean,
		default: true,
	},
	readonly: {
		type: Boolean,
		default: false,
	},
	lineNumbers: {
		type: Boolean,
		default: true,
	},
});
watch(_ => props.language, (language) => editor && editor.setOptions({ language }));
watch(_ => props.wordWrap, (wordWrap) => editor && editor.setOptions({ wordWrap }));
watch(_ => props.readonly, (readonly) => editor && editor.setOptions({ readOnly: readonly }));

const model = defineModel({ type: String });
watch(model, (value) => {
	if (!editor) return;
	editor.setOptions({ value });
});

const editorRef = ref(null);
let editor;
onMounted(() => {
	editor = createEditor(
		editorRef.value,
		{
			onUpdate: (code) => (model.value = code),

			value: model.value,
			language: props.language,

			lineNumbers: props.lineNumbers,
			wordWrap: props.wordWrap,

			readOnly: props.readonly,


			insertSpaces: false,
		},
		indentGuides(),
		matchBrackets(),
		cursorPosition(),
		matchTags(),
		highlightBracketPairs()
	);
});
onUnmounted(() => {
	editor.remove();
});
languages.csv = csv.grammar();
languages.tsv = tsv.grammar();

function ontab(e) {
	if (!editor) return;
	insertText(editor, "\t");
	e.preventDefault();
}
</script>

<template>
	<div ref="editorRef" @keydown.tab.exact.capture="ontab" :class="{'font-mono' : props.language === 'javascript'}"></div>
</template>

<style scoped>
:deep(.prism-code-editor) {
	min-height: 100%;
	/* font-family: var(--font-mono); */
	/* --padding-inline: 8rem; */

	color-scheme: light;
	--pce-cursor: #24292e;
	--pce-bg: transparent;
	--pce-widget-border: #bfbfbf;
	--pce-widget-bg: #f6f8fa;
	--pce-widget-color: #434d56;
	--pce-widget-color-active: #000;
	--pce-widget-color-options: #5a6772;
	--pce-widget-bg-input: #fafbfc;
	--pce-widget-bg-hover: #b8b8b84f;
	--pce-widget-bg-active: #2188ff33;
	--pce-widget-focus: #007acc;
	--pce-search-match: #ffdf5d66;
	--pce-widget-bg-error: #f2dede;
	--pce-widget-error: #be1100;
	--pce-bg-highlight: #f6f8fa;
	--pce-selection-match: #34d05840;
	--pce-line-number: #1b1f2380;
	--pce-scrollbar: 210, 7%, 55%;
	--pce-bg-fold: #656d76;
	--pce-guide-indent: #1f23281f;
	--pce-ac-icon-class: #953800;
	--pce-ac-icon-constant: #116329;
	--pce-ac-icon-enum: #953800;
	--pce-ac-icon-event: #57606a;
	--pce-ac-icon-function: #6639ba;
	--pce-ac-icon-interface: #953800;
	--pce-ac-icon-keyword: #a40e26;
	--pce-ac-icon-namespace: #a40e26;
	--pce-ac-icon-parameter: #0a3069;
	--pce-ac-icon-property: #953800;
	--pce-ac-icon-snippet: #0550ae;
	--pce-ac-icon-text: #0a3069;
	--pce-ac-icon-unit: #0550ae;
	--pce-ac-icon-variable: #953800;
	--pce-ac-match: #0066bf;
	--pce-tabstop: #0a326433;
	--pce-invisibles: #3333;
	--pce-selection: #add6ff;

	.pce-match {
		--pce-search-match: #e9e5ba;
	}

	.active-line {
		--pce-line-number: #1f2328;
	}

	.active-indent {
		--pce-guide-indent: #1f23284d;
	}

	[class*="language-"],
	.token.url > .operator,
	.token.attr-equals,
	.token.punctuation {
		color: #24292e;
	}
	.token.atrule,
	.token.variable,
	.language-css .url,
	.token.parameter,
	.token.list,
	.token.maybe-class-name,
	.token.class-name {
		color: #e36209;
	}
	.token.keyword,
	.token.atrule .rule,
	.token.unit,
	.token.deleted,
	.token.entity,
	.token.selector .combinator,
	.token.regex-flags,
	.token.token.anchor,
	.token.number.quantifier,
	.token.operator {
		color: #d73a49;
	}
	.token.tag,
	.token.inserted,
	.token.selector,
	.token.doctype-tag,
	.language-regex .escape {
		color: #22863a;
	}
	.token.selector .class,
	.token.selector .id,
	.token.pseudo-class,
	.token.pseudo-element,
	.token.function {
		color: #6f42c1;
	}
	.token.attr-value,
	.token.string,
	.token.char,
	.token.regex,
	.language-regex,
	.token.string-property,
	.token.url > .content,
	.token.url > .variable {
		color: #032f62;
	}
	.token.code.keyword {
		color: #24292e;
	}
	.token.attr-name,
	.language-css .token.property,
	.token.number,
	.token.constant,
	.token.color,
	.token.boolean,
	.token.title.important,
	.title.important .punctuation,
	.token.property-access,
	.token.char-class,
	.token.char-set,
	.token.doctype,
	.token.builtin,
	.token.regex .punctuation,
	.language-css .token.function,
	.token.code.code-snippet {
		color: #005cc5;
	}
	.token.comment,
	.token.prolog,
	.token.cdata {
		color: #6a737d;
	}
	.token.important,
	.token.bold {
		font-weight: bold;
	}
	.token.italic {
		font-style: italic;
	}
	/* Brackets */
	.token.bracket-level-0,
	.token.bracket-level-6 {
		color: #0366d6;
	}
	.token.bracket-level-1,
	.token.bracket-level-7 {
		color: #138934;
	}
	.token.bracket-level-2,
	.token.bracket-level-8 {
		color: #b37700;
	}
	.token.bracket-level-3,
	.token.bracket-level-9 {
		color: #cb2431;
	}
	.token.bracket-level-4,
	.token.bracket-level-10 {
		color: #a43276;
	}
	.token.bracket-level-5,
	.token.bracket-level-11 {
		color: #8a3ddb;
	}
	.token.interpolation-punctuation {
		color: #032f62;
	}
	.token.bracket-error {
		color: #ff1212cc;
	}
	.token.markup-bracket {
		color: inherit;
	}
	.active-bracket {
		box-shadow: inset 0 0 0 1px #34d05899, inset 0 0 0 9in #35d05940;
	}
	.active-tagname,
	.word-matches span {
		box-shadow: inset 0 0 0 1px #afb8c199, inset 0 0 0 9in #eaeef280;
	}

	/* CSV, TSV */
	&.language-csv, &.language-tsv {
		.pce-line > :nth-child(8n+1) {
			color: #0366d6;
		}
		.token.value:nth-child(8n+3) {
			color: #d73a49;
		}
		.token.value:nth-child(8n+5) {
			color: #22863a;
		}
		.token.value:nth-child(8n+7) {
			color: #6f42c1;
		}
	}
}

@media (prefers-color-scheme: dark) {
	:deep(.prism-code-editor) {
		color-scheme: dark;
		--pce-cursor: #2f81f7;
		--pce-widget-border: #303741;
		--pce-widget-bg: #161b22;
		--pce-widget-color: #b8bfc7;
		--pce-widget-color-active: #fff;
		--pce-widget-color-options: #7d8590;
		--pce-widget-bg-input: #0d1117;
		--pce-widget-bg-hover: #5a5d5e4f;
		--pce-widget-bg-active: #1f6feb66;
		--pce-widget-focus: #007acc;
		--pce-search-match: #f2cc6080;
		--pce-widget-bg-error: #5a1d1d;
		--pce-widget-error: #be1100;
		--pce-bg-highlight: #6e76811a;
		--pce-selection-match: #3fb95040;
		--pce-line-number: #6e7681;
		--pce-scrollbar: 210, 10%, 32%;
		--pce-bg-fold: #7d8590;
		--pce-guide-indent: #e6edf31f;
		--pce-ac-icon-class: #f0883e;
		--pce-ac-icon-enum: #f0883e;
		--pce-ac-icon-event: #6e7681;
		--pce-ac-icon-function: #bc8cff;
		--pce-ac-icon-interface: #f0883e;
		--pce-ac-icon-keyword: #ff7b72;
		--pce-ac-icon-namespace: #ff7b72;
		--pce-ac-icon-parameter: #79c0ff;
		--pce-ac-icon-property: #f0883e;
		--pce-ac-icon-snippet: #58a6ff;
		--pce-ac-icon-text: #79c0ff;
		--pce-ac-icon-unit: #58a6ff;
		--pce-ac-icon-variable: #f0883e;
		--pce-selection: #264f78;
		color-scheme: dark;

		.pce-match {
			--pce-search-match: #8c8d6c;
		}
		.active-line {
			--pce-line-number: #e6edf3;
		}
		.active-indent {
			--pce-guide-indent: #e6edf33d;
		}
		[class*="language-"],
		.token.url > .operator,
		.token.punctuation,
		.token.attr-equals,
		.token.code.keyword {
			color: #e6edf3;
		}
		.token.atrule,
		.token.variable,
		.language-css .url,
		.token.parameter,
		.token.list,
		.token.class-name,
		.token.maybe-class-name {
			color: #ffa657;
		}
		.token.atrule .rule,
		.token.unit,
		.token.selector .combinator,
		.token.operator,
		.token.deleted,
		.token.entity,
		.token.regex-flags,
		.token.token.anchor,
		.token.number.quantifier,
		.token.keyword {
			color: #ff7b72;
		}
		.token.tag,
		.token.inserted,
		.token.selector,
		.token.doctype-tag,
		.language-regex .escape {
			color: #7ee787;
		}
		.token.attr-value,
		.token.string,
		.token.char,
		.token.regex,
		.language-regex,
		.token.string-property,
		.token.url > .content,
		.token.url > .variable {
			color: #a5d6ff;
		}
		.token.builtin,
		.token.selector .class,
		.token.selector .id,
		.token.pseudo-class,
		.token.pseudo-element,
		.token.attr-name,
		.language-css .token.property,
		.token.number,
		.token.color,
		.token.boolean,
		.token.constant,
		.token.title.important,
		.title.important .punctuation,
		.language-css .token.function,
		.token.code.code-snippet,
		.token.doctype,
		.token.property-access,
		.token.keyword-null,
		.token.keyword-this,
		.token.char-class,
		.token.char-set,
		.token.regex .punctuation {
			color: #79c0ff;
		}
		.token.function {
			color: #d2a8ff;
		}
		.token.comment,
		.token.prolog,
		.token.cdata {
			color: #8b949e;
		}
		.token.important,
		.token.bold {
			font-weight: bold;
		}
		.token.italic {
			font-style: italic;
		}

		/* Brackets */
		.token.bracket-level-0,
		.token.bracket-level-6 {
			color: #79c0ff;
		}
		.token.bracket-level-1,
		.token.bracket-level-7 {
			color: #56d364;
		}
		.token.bracket-level-2,
		.token.bracket-level-8 {
			color: #e3b341;
		}
		.token.bracket-level-3,
		.token.bracket-level-9 {
			color: #ffa198;
		}
		.token.bracket-level-4,
		.token.bracket-level-10 {
			color: #ff9bce;
		}
		.token.bracket-level-5,
		.token.bracket-level-11 {
			color: #d2a8ff;
		}
		.token.interpolation-punctuation {
			color: #a5d6ff;
		}
		.token.bracket-error {
			color: #7d8590;
		}
		.token.markup-bracket {
			color: inherit;
		}
		.active-bracket {
			box-shadow: inset 0 0 0 1px #3fb95099, inset 0 0 0 9in #3fb95040;
		}
		.active-tagname,
		.word-matches span {
			box-shadow: inset 0 0 0 1px #6e768199, inset 0 0 0 9in #6e768180;
		}

		/* CSV, TSV */
		&.language-csv, &.language-tsv {
			.pce-line > :nth-child(8n+1) {
				color: #d2a8ff;
			}
			.token.value:nth-child(8n+3) {
				color: #79c0ff;
			}
			.token.value:nth-child(8n+5) {
				color: #ffa657;
			}
			.token.value:nth-child(8n+7) {
				color: #7ee787;
			}
		}
	}
}
:deep(.prism-code-editor).pce-readonly {
	--pce-bg-highlight: transparent !important;
}
</style>

<style>
[data-aligned="true"] {
	.pce-overlays {
		display: none;
	}
	.pce-wrapper {
		padding-left: .75rem;
	}
	.pce-line {
		width: 100%;
		display: table-row;
		&:before {
			display: table-cell;
		}
	}
	.token {
		display: table-cell;
	}
	.token.punctuation {
		padding: 0 .5rem;
	}
}
</style>
