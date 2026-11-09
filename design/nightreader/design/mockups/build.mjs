import fs from 'node:fs'
const t = fs.readFileSync(new URL('./template.html', import.meta.url), 'utf8'), d = fs.readFileSync(new URL('./data.json', import.meta.url), 'utf8')
fs.writeFileSync(new URL('./nightreader-mockups.html', import.meta.url), t.replace('/*DATA*/null', () => d))
fs.writeFileSync(new URL('./test.html', import.meta.url), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + t.replace('/*DATA*/null', () => d) + '</body></html>')
