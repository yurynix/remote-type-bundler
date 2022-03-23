#!/usr/bin/env node
const { bundle } = require('./dist/bundle');
const path = require('path');

(async function main() {
    const myPkgJson = require(path.join(__dirname, 'package.json'));

    console.log(`${myPkgJson.name}@${myPkgJson.version} input: ${process.argv[2]} output: ${process.argv[3]}`);

    if (process.argv.length < 4) {
        console.log(`Too few arguments, can not proceed.`);
        process.exit(1);
    }

    try {
        await bundle(process.argv[2], process.argv[3]);
    } catch(ex) {
        console.error(`Failed to process ${process.argv[2]} : ${ex.message}`);
        process.exit(1);
    }
})();
