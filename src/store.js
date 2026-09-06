import { reactive, watch, nextTick } from "vue";
import setupMiTem from './lib/mitem.js';
import Papa from 'papaparse';

const LOCAL_STORAGE_KEY = "matrix-printer-config";
const DEFAULT_CONFIG = {
	default: true,
	input: `band	name	surname
Beatles	Ringo	Starr
Blink 182	Travis	Barker
Slipknot 	Eloy	Casagrande
Slipknot 	Joey	Jordison
Slipknot 	Jay	Weinberg`,
	presets: {
		Default: {
			key_all: "_all",
			group_by: "band",
			tpl_header: "# {{ group }}",
			tpl_item: "- {{ name | lower }} {{ surname | upper }}",
			filters: `{
	lower: v => v.toLowerCase(),
	upper: v => v.toUpperCase(),
}`,
		},
	},
	preset: "Default",
};

class Store {
	miTem = null;
	runtime = reactive({
		filters: {},
		parsed: null,
		columns: [],
		output: "",
		error: {
			input: null,
			filters: null,
			parse: null,
			render: null,
		},
	});
	config = reactive({
		...DEFAULT_CONFIG
	});

	constructor() {
		this.miTem = setupMiTem();
		this.loadFromLocalStorage();
		watch(_ => this.config, _ => this.saveToLocalStorage(), { deep: true });

		watch(_ => this.config.input, _ => this.onInputChanged());
		watch(_ => this.config.preset, _ => this.onPresetChanged());
		watch(_ => this.config.presets[this.config.preset], _ => this.onPresetChanged(), { deep: true });
		watch(_ => this.runtime.parsed, async _ => await this.render());

		this.onPresetChanged();
		this.parseInput();
		this.render();
	}

	hasError() {
		return Object.values(this.runtime.error).some(v => v);
	}

	firstError() {
		for (const [key, value] of Object.entries(this.runtime.error)) {
			if (value) return { key, value };
		}
		return null;
	}

	loadFromLocalStorage() {
		const localconfig = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (localconfig) {
			// Do it this way instead of Object.assign so that reactive Proxy is preserved
			for (const [key, value] of Object.entries(JSON.parse(localconfig))) {
				this.config[key] = value;
			}
		}
	}

	saveToLocalStorage() {
		this.config.default = false;
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.config));
	}

	onInputChanged() {
		this.parseInput();
	}

	onPresetChanged() {
		const preset = this.config.presets[this.config.preset];
		this.parse
	}

	parseFilters() {
		try {
			const preset = this.config.presets[this.config.preset];
			this.runtime.filters = eval(`(${preset.filters})`);
			this.miTem.filters = Object.assign(
				{},
				this.miTem.defaultFilters,
				this.runtime.filters
			);
			this.runtime.error.filters = null;
		} catch (e) {
			this.runtime.error.filters = `Error parsing filters: ${e.message}`;
		}
	}

	parseInput() {
		const {data, errors, meta} = Papa.parse(this.config.input, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: true,
		});

		if (errors.length > 0) {
			const e = errors[0];
			this.runtime.error.parse = `Error in row ${e.row}: ${e.message}`;
			this.runtime.parsed = null;
			this.runtime.columns = [];
			return;
		}

		this.runtime.parsed = data;
		this.runtime.columns = meta.fields;
	}

	async render() {
		if (this.hasError()) {
			this.runtime.output = "";
			return;
		}

		try {
			const p = this.config.presets[this.config.preset];
			const tplh = this.miTem.compile(p.tpl_header);
			const tpli = this.miTem.compile(p.tpl_item);

			const r = await Promise.all(
				this.runtime.parsed.map(async (row) => {
					const rendered = tpli(row);
					return { row, rendered };
				}),
			);

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

			this.runtime.output = output;
			this.runtime.error.render = null;
		} catch (e) {
			this.runtime.error.render = `Error rendering output: ${e.message}`;
			this.runtime.output = "";
			return;
		}
	}
}

export default new Store();
