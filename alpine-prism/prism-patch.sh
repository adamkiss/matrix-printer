#!/usr/bin/env sh

echo "const nightOwl = \`$(cat ./prism-theme.css)\`;
export {
  nightOwl as default
};" > ./node_modules/prism-code-editor/dist/night-owl.js
