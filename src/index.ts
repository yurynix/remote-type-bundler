import { rollup } from 'rollup';
import dts from "rollup-plugin-dts";
import { createFetcher } from './fetch-unpkg';
import { tsResolvePlugin } from './ts-resolve';
import tempy from 'tempy';
import path from 'path';
import { cacheFactory } from './cache';
import { wrapTypesWithModuleDeclare } from './wrap-types-with-module-declare';

interface BundleOptions {
    wrapWithModuleDeclare?: boolean;
}

export async function bundle(packageIdentifier: string, outputFilePath: string, options: BundleOptions = {}) {
    try {
        const packageIdentifierParts = packageIdentifier.split('@');
        const packageName = packageIdentifierParts.slice(0, -1).join('@');
        const packageVersion = packageIdentifierParts[packageIdentifierParts.length - 1];
        console.log(`Trying to bundle package: ${packageName} version:${packageVersion} to ${outputFilePath}`);
        let resultCode = undefined;
        await tempy.directory.task(async tempDirectory => {
            const saveFileFromPackage = createFetcher(cacheFactory);
            const pkgJsonData: any = await saveFileFromPackage(tempDirectory, packageName, packageVersion, 'package.json');
            const pkgJson = JSON.parse(pkgJsonData);
            const pkgPath = tempDirectory;
            
            const inputOptions = {
                input: path.join(pkgPath, pkgJson.types),
                plugins: [
                    tsResolvePlugin({
                        projectRootPath: pkgPath,
                        saveFileFromPackage,
                    }),
                    dts()
                ],
            };
    
            const bundle = await rollup(inputOptions);
            const result = await bundle.write({ file: outputFilePath });

            const outputCode = result.output[0].code;
            if (options.wrapWithModuleDeclare) {
                resultCode = wrapTypesWithModuleDeclare(outputCode, packageName);
            } else {
                resultCode = outputCode;
            }
		});

        return resultCode;
    } catch(ex) {
        console.error(ex);
    }
}