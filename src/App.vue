<script setup>
// Vue and stuff
import {reactive, watch, nextTick, onMounted} from "vue";
import CodeEditor from "./components/CodeEditor.vue";
import TheWelcome from "./components/TheWelcome.vue";

// Libs and utils
import { loadFromLocalStorage } from "./lib/utils.js";
import setupMiTem from './lib/mitem.js';
import Papa from 'papaparse';
import { DEFAULT_CONFIG, LOCAL_STORAGE_KEY } from "./lib/defaults.js";

// State
const miTem = setupMiTem();
const runtime = reactive({
	standalone: false,
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

	runtime.inputLanguage = meta.delimiter === "\t" ? "tsv" : "csv";
	runtime.parsed = data;
	runtime.columns = meta.fields;
	console.log(runtime.parsed)
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
	console.log("rendering...");

	if (runtime.hasError) {
		runtime.output = "";
		return;
	}

	console.log("rendering with", {
		preset: cfg.presets[cfg.preset],
		parsed: runtime.parsed,
		filters: runtime.filters,
	});

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

		console.log("rendered output:", output);

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
</script>

<template>
	<main class="w-full min-h-dvh grid grid-cols-2">
		<section class="row-span-2 border-r-2 border-black/20 flex flex-col *:py-4 *:px-8 divide-y divide-black/10">
			<header class="flex items-center justify-between">
				<h1>Matrix printer</h1>
				<button @click="__toggleIntro(true)">About</button>
			</header>

			<div class="flex gap-2">
				<select v-model="cfg.preset">
					<option v-for="(preset, key) in cfg.presets" :key="key" :value="key">{{ key }}</option>
				</select>
				<button @click="copy_preset">Copy</button>
				<button @click="share_preset">Share</button>
				<button @click="import_preset_from_string" v-if="runtime.standalone">Import</button>
				<button @click="delete_preset" :disabled="Object.keys(cfg.presets).length <= 1">Delete</button>
			</div>
			<div class="qsrow">
				<label for="key_all">Key for all items:</label>
				<input id="key_all" v-model="cfg.presets[cfg.preset].key_all" />
			</div>
			<div class="qsrow">
				<label for="group_by">Group by:</label>
				<select v-model="cfg.presets[cfg.preset].group_by">
					<option v-for="key in ['', ...runtime.columns]" :key="key" :value="key">{{ key }}</option>
				</select>
			</div>
			<div>
				<label class="block" for="tpl_header">Template header:</label>
				<code-editor class="w-full h-full" v-model="cfg.presets[cfg.preset].tpl_header" language="liquid" />
			</div>
			<div>
				<label class="block" for="tpl_item">Template item:</label>
				<code-editor class="w-full h-full" v-model="cfg.presets[cfg.preset].tpl_item" language="liquid" />
			</div>
			<div>
				<label for="filters" class="block">Filters:</label>
				<code-editor class="w-full h-full" v-model="cfg.presets[cfg.preset].filters" language="javascript" />
			</div>
			<button @click="__toggleIntro(true)">Open intro ({{ cfg.filters }})</button>
		</section>
		<section class="border-b-2 border-black/20">
			<code-editor class="w-full h-full" v-model="cfg.input" :language="runtime.inputLanguage" />
		</section>
		<section>
			<div class="bg-red-500 text-white absolute inset-x-4 top-4" v-if="runtime.error.render">{{ runtime.error.render }}</div>
			<code-editor class="w-full h-full" v-model="runtime.output" readonly />
		</section>
	</main>

	<Teleport to="#welcome">
		<button @click="__toggleIntro(false)">Open the app</button>
		<button @click="cfg.filters = 'a'">Set to A</button>
		<button @click="cfg.filters = 'b'">Set to B</button>
	</Teleport>
</template>

<style scoped>
.qsrow {
	display: flex;
	gap: 1rem;
}
.qsrow label {
	width: 10rem;
}
.qsrow input,
.qsrow textarea {
	flex: 1;
}

section {
	position: relative;
}
</style>
