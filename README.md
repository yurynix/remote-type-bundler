# **Experimental** Bundle pacakage's .d.ts to one file

This is an attempt to create one `.d.ts` file for a package already published on `npm`, for example, for `puppeteer@13.5.1` all of those `.d.ts`es:

```
│ puppeteer@13.5.1
└──┬ lib/types.dts
   │
   ├─ devtools-protocol@0.0.979918/types/protocol.d.ts
   └─ devtools-protocol@0.0.979918/types/protocol-mapping.d.ts
```

should be bundled together and wrapped in a `declare module 'puppeteer' { ... }`, all references from the "root" type should be followed, as in the example above.

More examples can be seen at [__tests__/e2e/simple-e2e.spec.ts](https://github.com/yurynix/remote-type-bundler/blob/main/__tests__/e2e/simple-e2e.spec.ts)


Based on:
* [rollup](https://github.com/rollup/rollup)
* [rollup-plugin-dts](https://github.com/Swatinem/rollup-plugin-dts) with [this PR merged](https://github.com/Swatinem/rollup-plugin-dts/pull/203)
* [ts-resolve](https://github.com/egoist/tsup/blob/dev/src/rollup/ts-resolve.ts) from [tsup](https://github.com/egoist/tsup)
* Ideas from [npm-dts](https://github.com/vytenisu/npm-dts)


Local version:
```shell
./bin.js puppeteer@13.5.1 bundle.d.ts
```

via npx:
```
npx remote-type-bundler puppeteer@13.5.1 bundle.d.ts
```
