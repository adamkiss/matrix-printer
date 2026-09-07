<script setup>
// Vue and stuff
import {ref, reactive, watch, nextTick, onMounted} from "vue";
import CodeEditor from "./components/CodeEditor.vue";
import ErrorMessage from "./components/ErrorMessage.vue";
import SectionHeader from "./components/SectionHeader.vue";

// Libs and utils
import { loadFromLocalStorage } from "./lib/utils.js";
import setupMiTem from './lib/mitem.js';
import Papa from 'papaparse';
import { DEFAULT_CONFIG, LOCAL_STORAGE_KEY } from "./lib/defaults.js";

// State
const miTem = setupMiTem();
const runtime = reactive({
	standalone: false,
	expanded: null,
	aligned_columns: true,
	copied: false,

	filters: {},
	inputLanguage: "csv",
	parsed: null,
	columns: [],
	output: "",

	error: {
		input: null,
		filters: null,
		parse: null,
		render: null,
		copy: null,
	},
	get hasError() {
		return Object.values(this.error).some(v => v);
	},
	get firstError() {
		for (const [key, value] of Object.entries(this.error)) {
			if (value) return { key, value };
		}
		return null;
	},
});
const cfg = reactive({
	...DEFAULT_CONFIG
});
const grid = ref(null);

// Event listeners
watch(cfg, _ => {
	cfg.default = false;
	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cfg));
}, { deep: true });
watch(_ => cfg.input, _ => onInputChanged());
watch(_ => cfg.preset, _ => onPresetChanged());
watch(_ => cfg.presets[cfg.preset], _ => onPresetChanged(), { deep: true });
watch(_ => runtime.parsed, async _ => await render());

// Methods
onMounted(() => {
	const ls = loadFromLocalStorage(LOCAL_STORAGE_KEY);
	for (const key in ls) { cfg[key] = ls[key]; }

	q("#welcome").classList.remove("hidden");
	const introcloser = q('#intro').addEventListener('click', e => {
		if (e.target !== e.currentTarget) return;
		toggleIntro(false);
	});
	nextTick(_ => {
		const i = toggleIntro(Object.entries(ls).length === 0);
		i.classList.add("transition-opacity", "duration-300");
		i.classList.remove("in-[.js]:hidden");
	});

	onInputChanged();
	onPresetChanged();

	if (window.location.search.includes("preset=")) {
		setTimeout(_ => {
			import_preset();
		}, 100);
	}

	if ('standalone' in window.navigator && window.navigator.standalone) {
		runtime.standalone = true;
	}
});

function onInputChanged() {
	const {data, errors, meta} = Papa.parse(cfg.input, {
		header: true,
		skipEmptyLines: true,
		dynamicTyping: true,
	});

	if (errors.length > 0) {
		const e = errors[0];
		runtime.error.parse = `Error in row ${e.row}: ${e.message}`;
		runtime.parsed = null;
		runtime.columns = [];
		return;
	}

	runtime.error.parse = null;
	runtime.inputLanguage = meta.delimiter === "\t" ? "tsv" : "csv";
	runtime.parsed = data;
	runtime.columns = meta.fields;
}

function onPresetChanged() {
	parseFilters();
	render();
}

function parseFilters() {
	try {
		const preset = cfg.presets[cfg.preset];
		runtime.filters = eval(`(${preset.filters})`);
		miTem.filters = Object.assign(
			{},
			miTem.defaultFilters,
			runtime.filters
		);
		runtime.error.filters = null;
	} catch (e) {
		runtime.error.filters = `Error parsing filters: ${e.message}`;
	}
}

// RENDER
async function render() {
	if (runtime.hasError) {
		// runtime.output = "";
		return;
	}

	try {
		const p = cfg.presets[cfg.preset];
		const tplh = miTem.compile(p.tpl_header);
		const tpli = miTem.compile(p.tpl_item);

		const r = await Promise.all(
			runtime.parsed.map(async (row) => {
				const rendered = tpli(row);
				return { row, rendered };
			}),
		);

		if (p.group_by === "") {
			runtime.output = r.map(({ rendered }) => rendered).join("\n");
			runtime.error.render = null;
			return;
		}

		const grouped = r.reduce((acc, { row, rendered }) => {
			const groupKey = row[p.group_by] ?? p.key_all;
			if (!acc[groupKey]) acc[groupKey] = [];
			acc[groupKey].push(rendered);
			return acc;
		}, {});

		const output = Object.entries(grouped)
			.map(([group, items]) => {
				const header = tplh({ group });
				return [header, ...items].join("\n");
			})
			.join("\n\n");

		runtime.output = output;
		runtime.error.render = null;
	} catch (e) {
		runtime.error.render = `Error rendering output: ${e.message}`;
		runtime.output = "";
		return;
	}
}

// Preset management
function copy_preset() {
	const name = prompt("Enter a name for the new preset:");
	if (!name) return;

	const preset = cfg.presets[cfg.preset];
	// presets are only one level deep, so no need to deep clone
	cfg.presets[name] = {...preset};
	cfg.preset = name;
}

function share_preset() {
	const url = new URL(window.location.href);
	url.searchParams.set("preset", btoa(JSON.stringify(cfg.presets[cfg.preset])));
	prompt("Shareable URL:", url.toString());
}

function delete_preset() {
	if (!confirm("Are you sure you want to delete this preset?")) return;
	if (Object.keys(cfg.presets).length <= 1) {
		alert("Cannot delete the last preset.");
		return;
	}

	const old_active = cfg.preset;
	let new_active = '';
	for (const key in cfg.presets) {
		if (key == cfg.preset) continue;
		new_active = key;
		break;
	}
	cfg.preset = new_active;
	delete cfg.presets[old_active];
}

function import_preset(from_string = null) {
	const url = new URL(from_string ?? window.location.href);
	try {
		const preset = JSON.parse(atob(url.searchParams.get('preset')))

		if (['key_all', 'group_by', 'tpl_header', 'tpl_item', 'filters'].some(k => !(k in preset))) {
			throw new Error('Invalid preset format');
		}

		const name = prompt('Importing preset, name?', preset.name)
		if (!name) return
		if (name in cfg.presets) {
			if (!confirm(`Preset "${name}" already exists. Overwrite?`)) return
		}

		cfg.presets[name] = preset
		cfg.preset = name
	} catch (error) {
		console.error(error)
		alert('Failed to import preset: ' + error.message)
	} finally {
		// Remove the preset query parameter from the URL after importing
		url.searchParams.delete('preset');
		window.history.replaceState({}, document.title, url.toString());
	}
}

function import_preset_from_string() {
	const presetString = prompt('Paste the preset string to import:');
	if (!presetString) return;
	import_preset(presetString);
}

function toggle_expand(toggle_to = false) {
	runtime.expanded = (runtime.expanded === toggle_to)
		? null
		: toggle_to;
}

async function copy_to_clipboard() {
	try {
		await navigator.clipboard.writeText(runtime.output)
		runtime.copied = true;
	} catch (e) {
		runtime.error.copy = `Failed to copy: ${e.message}`;
	} finally {
		setTimeout(() => {
			runtime.copied = false
			runtime.error.copy = null
		}, 2000)
	}
}

function align_input_columns() {
	runtime.aligned_columns = !runtime.aligned_columns;
}
</script>

<template>
	<main class="w-full h-dvh grid grid-app" :data-expanded="runtime.expanded">
		<section class="contents">
			<!-- ABOUT -->
			<section-header class="grid-area-config-header md:min-w-[600px]">
				<h1 class="font-bold tracking-wide">Matrix printer</h1>
				<button @click="__toggleIntro(true)">About</button>
			</section-header>
			<!-- CONFIG -->
			<div class="grid-area-config bg-gray-200 dark:bg-gray-950">
				<div class="min-h-full overflow-y-scroll flex flex-col divide-y divide-gray-300 dark:divide-gray-800 md:min-w-[600px]">
					<label for="preset" class="w-full">Preset:</label>
					<div class="p-2 flex gap-2">
						<select v-model="cfg.preset" name="preset" id="preset">
							<option v-for="(preset, key) in cfg.presets" :key="key" :value="key">{{ key }}</option>
						</select>
						<button @click="copy_preset">Copy</button>
						<button @click="share_preset">Share</button>
						<button @click="import_preset_from_string" v-if="runtime.standalone">Import</button>
						<button @click="delete_preset" :disabled="Object.keys(cfg.presets).length <= 1">Delete</button>
					</div>
					<div class="grid grid-cols-2 divide-x divide-gray-300 dark:divide-gray-800">
						<div class="px-2 pb-2">
							<label for="key_all" class="-mx-2 pb-2">Key for all row items (as an array):</label>
							<input type="text" id="key_all" v-model="cfg.presets[cfg.preset].key_all" />
						</div>
						<div class="px-2 pb-2">
							<label for="group_by" class="-mx-2 pb-2">Group rows by:</label>
							<select v-model="cfg.presets[cfg.preset].group_by">
								<option v-for="key in ['', ...runtime.columns]" :key="key" :value="key">{{ key || "--"}}</option>
							</select>
						</div>
					</div>
					<div>
						<label class="block" for="tpl_header">Template header:</label>
						<code-editor class="w-full h-full" v-model="cfg.presets[cfg.preset].tpl_header" language="liquid" />
					</div>
					<div>
						<label class="block" for="tpl_item">Template item:</label>
						<code-editor class="w-full h-full" v-model="cfg.presets[cfg.preset].tpl_item" language="liquid" />
					</div>
					<div class="relative grow">
						<label for="filters" class="block">Filters:</label>
						<error-message :message="runtime.error.filters" />
						<code-editor class="w-full h-full" v-model="cfg.presets[cfg.preset].filters" language="javascript" />
					</div>
				</div>
			</div>
		</section>
		<!-- INPUT -->
		<section class="contents">
			<section-header class="grid-area-input-header">
				<h1 class="font-bold tracking-wide">Input</h1>
				<button @click="align_input_columns()" :disabled="runtime.error.parse">{{ runtime.aligned_columns ? '✔ Aligned columns' : 'Align columns (readonly)' }}</button>
				<span class="grow"> </span>
				<button @click="toggle_expand('input')">{{ runtime.expanded === 'input' ? 'Collapse' : 'Expand' }}</button>
			</section-header>
			<div class="grid-area-input bg-gray-200 dark:bg-gray-950 relative overflow-y-scroll">
				<error-message :message="runtime.error.parse" />
				<code-editor class="w-full h-full" v-model="cfg.input" :language="runtime.inputLanguage" :word-wrap="false" :readonly="runtime.aligned_columns" :data-aligned="runtime.aligned_columns" />
			</div>
		</section>
		<!-- OUTPUT -->
		<section class="contents">
			<section-header class="grid-area-output-header">
				<h1 class="font-bold tracking-wide">Output</h1>
				<button @click="copy_to_clipboard()" :disabled="runtime.copied || runtime.error.copy">{{ runtime.copied ? 'OK, Copied' : 'Copy' }}</button>
				<span class="grow"> </span>
				<button @click="toggle_expand('output')">{{ runtime.expanded === 'output' ? 'Collapse' : 'Expand' }}</button>
			</section-header>
			<div class="grid-area-output bg-gray-200 dark:bg-gray-950 relative overflow-y-scroll">
				<error-message :message="runtime.error.render" />
				<error-message :message="runtime.error.copy" />
				<code-editor class="w-full h-full" v-model="runtime.output" readonly :line-numbers="false" />
			</div>
		</section>

		<!-- Gradient zones when input/output is expanded -->
		<div
			class="fixed top-0 left-[10%] right-0 h-lh-5dvh bg-linear-to-b from-gray-500/0 to-gray-200 dark:to-black/80"
			@click="toggle_expand('input')" v-show="runtime.expanded === 'output'">
		</div>
		<div
			class="fixed bottom-0 left-[10%] right-0 h-lh-5dvh bg-linear-to-t from-gray-200/2 to-gray-200 dark:from-black/20  dark:to-black/80"
			@click="toggle_expand('output')" v-show="runtime.expanded === 'input'">
		</div>
		<div class="fixed inset-y-0 left-0 w-[10%] bg-linear-to-r from-gray-500/0 to-gray-200 dark:to-black/40" @click="toggle_expand(null)" v-show="runtime.expanded"></div>
	</main>

	<Teleport to="#welcome">
		<button @click="__toggleIntro(false)">Open the Matrix Printer</button>
	</Teleport>
</template>
