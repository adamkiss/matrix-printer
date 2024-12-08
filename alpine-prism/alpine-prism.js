import { basicEditor } from "prism-code-editor/setups"

import "prism-code-editor/prism/languages/markup"
import "prism-code-editor/prism/languages/javascript"
import "prism-code-editor/prism/languages/liquid"

document.addEventListener("alpine:init", initEvent => {

	// Setup magic
	Alpine.magic('prism', (el, {Alpine}) => {
		return function({language = 'plain', testString = 'tsv'} = {}) {
			return {
				value: '',
				editor: null,

				init() {
					this.$nextTick(_ => {
						this.editor = basicEditor(this.$el, {
							language,
							theme: 'night-owl',
							insertSpaces: false,
							tabSize: 4,
							value: this.value,
							onUpdate: code => this.value = code
						})
					})
				},
				focusTextarea(evt) {
					this.$root.shadowRoot.querySelector('textarea').focus()
				}
			}
		}
	});
});
