export const LOCAL_STORAGE_KEY = "matrix-printer-config";
export const DEFAULT_CONFIG = {
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
