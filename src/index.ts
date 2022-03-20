import { rollup } from 'rollup';
import dts from "rollup-plugin-dts";
import { createFetcher } from './fetch-unpkg';
import { tsResolvePlugin } from './ts-resolve';
import tempy from 'tempy';
import path from 'path';
import { cacheFactory } from './cache';

export async function bundle(packageIdentifier: string, outputFilePath: string) {
    try {
        const [packageName, packageVersion] = packageIdentifier.split('@');
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

            console.log(`Done bundle package: ${packageName} version:${packageVersion} to`, result.output.map(o => o.fileName).join(''));
            resultCode = result.output[0].code;
		});

        return resultCode;
    } catch(ex) {
        console.error(ex);
    }
}