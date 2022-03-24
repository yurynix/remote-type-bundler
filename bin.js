#!/usr/bin/env node
const { bundle } = require('./dist/bundle');
const path = require('path');

const myPkgJson = require(path.join(__dirname, 'package.json'));

function hasArg(arg) {
  return process.argv.indexOf(arg) !== -1;
}

function printHelp() {
    console.log(`${myPkgJson.name}@${myPkgJson.version} <input> <output> [--wrap]`);
}

(async function main() {
    const inputOutput = process.argv.slice(2).filter(param => !param.trim().startsWith('--'));
    const wrapWithModuleDeclare = hasArg('--wrap');

    if (hasArg('--help') || hasArg('-h')) {
        printHelp();
        process.exit(0);
    }

    console.log(`${myPkgJson.name}@${myPkgJson.version} input: ${inputOutput[0]} output: ${inputOutput[1]}`);

    if (inputOutput.length < 2) {
        console.log(`Too few arguments, can not proceed.`);
        printHelp();
        process.exit(1);
    }

    try {
        await bundle(inputOutput[0], inputOutput[1], { wrapWithModuleDeclare });
        console.log(`Done bundle package: ${inputOutput[0]} to ${inputOutput[1]}${wrapWithModuleDeclare ? ' and wraped with module declare.' : ''}`);
    } catch(ex) {
        console.error(`Failed to process ${inputOutput[0]} : ${ex.message}`);
        process.exit(1);
    }
})();
