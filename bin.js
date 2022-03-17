#!/usr/bin/env node
const { bundle } = require('./dist/bundle');

(async function main() {
    console.log(`input: ${process.argv[2]} output: ${process.argv[3]}`)
    await bundle(process.argv[2], process.argv[3]);
})();
