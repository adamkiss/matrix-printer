export const csv = {
	id: 'csv',
	grammar () {
		// https://tools.ietf.org/html/rfc4180

		return {
			'value': /[^\r\n,"]+|"(?:[^"]|"")*"(?!")/,
			'punctuation': /[,]/,
		};
	},
};

export const tsv = {
	id: 'tsv',
	grammar () {
		return {
			'value': /[^\r\n\t"]+|"(?:[^"]|"")*"(?!")/,
			'punctuation': /[\t]/,
		};
	},
};
