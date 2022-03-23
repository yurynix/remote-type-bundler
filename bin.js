#!/usr/bin/env node
const { bundle } = require('./dist/bundle');

(async function main() {
    console.log(`input: ${process.argv[2]} output: ${process.argv[3]}`);
    try {
        await bundle(process.argv[2], process.argv[3]);
    } catch(ex) {
        console.error(`Failed to process ${process.argv[2]} : ${ex.message}`);
        process.exit(1);s
    }
})();
