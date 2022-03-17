import { rollup } from 'rollup';
import dts from "rollup-plugin-dts";
import { createFetcher } from './fetch-unpkg';
import { tsResolvePlugin } from './ts-resolve';
import tempy from 'tempy';
import fs from 'fs';
import path from 'path';

export async function bundle(packageIdentifier: string, outputFilePath: string) {
    try {
        const [packageName, packageVersion] = packageIdentifier.split('@');
        console.log(`Trying to bundle package: ${packageName} version:${packageVersion} to ${outputFilePath}`);
        await tempy.directory.task(async tempDirectory => {
            const saveFileFromPackage = createFetcher();
            const pkgJsonData: any = await saveFileFromPackage(tempDirectory, packageName, packageVersion, 'package.json');
            const pkgJson = JSON.parse(pkgJsonData);
            const pkgPath = tempDirectory;
            
            // await fs.promises.mkdir(path.join(pkgPath, 'node_modules'), { recursive: true });
            // await fs.promises.writeFile(path.join(pkgPath, 'package.json'), JSON.stringify(pkgJson, null, 2));


            const deps = {
                name: pkgJson.name,
                version: pkgJson.version,
                deps: {
                    ...pkgJson.dependencies,
                    ...pkgJson.devDependencies,
                }
            };

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
		});
    } catch(ex) {
        console.error(ex);
    }
}