export function loadFromLocalStorage(key) {
	const lc = localStorage.getItem(key);
	if (!lc) return {};
	return JSON.parse(lc);
}
