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

import "prism-code-editor/layout.css"
import "prism-code-editor/themes/github-dark.css"
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
	forceLineNumbers: {
		type: Boolean,
		default: false,
	},
});
watch(_ => props.language, language => { editor && editor.setOptions({ language }) });

const model = defineModel({ type: String });
watch(model, (value) => {
	if (!editor) return;
	console.log("model changed", value);
	editor.setOptions({ value });
});

const editorRef = ref(null);
let editor;
onMounted(() => {
	editor = createEditor(
		editorRef.value,
		{
			onUpdate: code => model.value = code,

			theme: "github-dark",

			value: model.value,
			language: props.language,

			lineNumbers: !props.readonly || props.forceLineNumbers,
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
	<div ref="editorRef" @keydown.tab.exact.capture="ontab"></div>
</template>

<style scoped>
:deep(.prism-code-editor) {
	caret-color: red !important;
	/* --padding-inline: 8rem; */
}
</style>
