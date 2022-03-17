const { bundle } = require('./dist/bundle');

(async function main() {
    await bundle('puppeteer@13.5.1', './bundle.d.ts');
})();
