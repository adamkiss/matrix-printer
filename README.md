<p align="center"><a href="https://matrix-printer.adamkiss.com" target="_blank"><img src="https://github.com/adamkiss/matrix-printer/blob/main/public/matrix-printer-meta.png?raw=true" alt="Titular image for Matrix Printer"></a></p>

# [Matrix Printer](https://matrix-printer.adamkiss.com)

Matrix Printer is a tool that takes CSV, TSV or pasted data from Excel (delimiter is auto-detected), optionally groups it and formats it into continuous text using [Liquid](https://liquidjs.com/tutorials/intro-to-liquid.html)-like filters and templates.

It's a simple way to generate reports, emails, or any other text-based output from structured data. Also a great way to programmatically markup tabular data.

## v2

Version 2 was released in 2026, is built using Vue 3, and features sharing presets between users.

## Development

```bash
# Starts a local server for development
$ ./task dev

# Builds a production version
$ ./task prod

# Builds a production version and force pushes it
# into `gh-pages` branch for deployment
$ ./task deploy
```

&copy; 2024-2026 [Adam Kiss](https://adamkiss.com)
