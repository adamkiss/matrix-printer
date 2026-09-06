import "./assets/app.css";

import { createApp } from "vue";
import App from "./App.vue";

// default config

// Utils
const q = (query, all = false) => all
	? document.querySelectorAll(query)
	: document.querySelector(query);
window.q = q;

// Intro stuff
export function toggleIntro(show = true) {
	const intro = q("#intro");
	intro.classList.toggle("opacity-0", !show);
	intro.classList.toggle("pointer-events-none", !show);
	return intro;
}
window.toggleIntro = toggleIntro;

// Let's go
const mp = createApp(App);
mp.config.globalProperties.__toggleIntro = toggleIntro;

mp.mount("#app");
