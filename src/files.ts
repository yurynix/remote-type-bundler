import { builtinModules } from 'module'
import getLatestVersion from 'get-latest-version';
import path from 'path';
import fs from 'fs';
import { FetcherFunction } from './fetch-unpkg';
import createDebug from 'debug';

const debug = createDebug('files');

async function tryReadPackageJson(containingDir: string) {
    try {
        const pkgJsonPath = path.join(containingDir, 'package.json');
        const data = await fs.promises.readFile(pkgJsonPath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

async function locateClosestPackageJson(containingDir: string) {
    let dir = containingDir;
    while (dir !== '/') {
        const pkgJson = await tryReadPackageJson(dir);
        if (pkgJson) {
            return {
                containingDir: dir,
                pkgJson,
            }
        }
        dir = path.dirname(dir);
    }

    return null;
}

interface PackageDetails {
    containingPackage?: {
        name: string;
        version: string;
        dir: string;
    }
    packageName: string;
    packageSemVer: string;
    dir: string;
    realtiveRequest: string;
}

export async function getPackageDetails(projectRootPath: string, request: string, importer?: string) : Promise<PackageDetails> {
    debug(`getPackageDetails: (projectRootPath: ${projectRootPath}, request: ${request}, importer: ${importer}`);

    // Absolute import
    if (request[0] === '/') {
        const requestPkgJsonResult = await locateClosestPackageJson(request);
        if (!requestPkgJsonResult) {
            throw new Error(`Unable to find package.json while searching from ${request} upwards`); 
        }

        let containingPackage = undefined;
        if (importer) {
            const importerPkgJsonResult = await locateClosestPackageJson(request);
            if (importerPkgJsonResult) {
                containingPackage = {
                    name: importerPkgJsonResult.pkgJson.name,
                    version: importerPkgJsonResult.pkgJson.version,
                    dir: importerPkgJsonResult.containingDir,
                };
            }
        }

        return {
            packageName: requestPkgJsonResult?.pkgJson.name,
            packageSemVer: requestPkgJsonResult?.pkgJson.version,
            dir: requestPkgJsonResult.containingDir,
            realtiveRequest: request.replace(requestPkgJsonResult.containingDir + path.sep, ''),
            containingPackage,
        };
    } else if (request[0] === '.') {
        const importerPkgJsonResult = await locateClosestPackageJson(importer || projectRootPath);
        if (!importerPkgJsonResult) {
            throw new Error(`Unable to find package.json while searching from ${importer || projectRootPath} upwards`); 
        }

        let containingPackage = undefined;
        const containingPkgJsonResult = await locateClosestPackageJson(importerPkgJsonResult.containingDir);
        if (containingPkgJsonResult) {
            containingPackage = {
                name: containingPkgJsonResult.pkgJson.name,
                version: containingPkgJsonResult.pkgJson.version,
                dir: containingPkgJsonResult.containingDir,
            };
        }

        const relativeRoot = path.dirname(importer || projectRootPath).replace(importerPkgJsonResult.containingDir + path.sep, '');

        return {
            packageName: importerPkgJsonResult.pkgJson.name,
            packageSemVer: importerPkgJsonResult.pkgJson.version,
            dir: importerPkgJsonResult.containingDir,
            realtiveRequest: path.join(relativeRoot, request),
            containingPackage
        };
    } else {
        const packageName = request.startsWith('@') ? request.split(path.sep).slice(0, 2).join(path.sep) : request.split(path.sep)[0];
        const importerPkgJsonResult = await locateClosestPackageJson(importer || projectRootPath);
        if (!importerPkgJsonResult) {
            throw new Error(`Unable to find package.json while searching from ${importer || projectRootPath} upwards`); 
        }

        return {
            packageName,
            packageSemVer: importerPkgJsonResult.pkgJson.dependencies[packageName] || importerPkgJsonResult.pkgJson.devDependencies[packageName],
            dir: path.join(importerPkgJsonResult.containingDir, 'node_modules', packageName),
            realtiveRequest: request.replace(packageName + path.sep, ''),
            containingPackage: {
                name: importerPkgJsonResult.pkgJson.name,
                version: importerPkgJsonResult.pkgJson.version,
                dir: importerPkgJsonResult.containingDir
            },
        }
    }
}

export async function prepareFile(source: string, importer: string | undefined, projectRootPath: string, saveFileFromPackage: FetcherFunction, resolveExtensions = ['.d.ts', '.ts']) {
    debug(`prepareFile: source: ${source}, importer: ${importer}, projectRootPath: ${projectRootPath}, `);
    if (builtinModules.includes(source)) return false;
    
    const packageDetails = await getPackageDetails(projectRootPath, source, importer);

    const forDownload = {
        packageName: packageDetails.packageName,
        packageVersion: packageDetails.packageSemVer,
        realtiveRequest: packageDetails.realtiveRequest,
        dir: packageDetails.dir,
    };

    if (!packageDetails.packageSemVer.match(/^\d+\.\d+\.\d+$/)) {
        const resolvedVersion = await getLatestVersion( packageDetails.packageName, packageDetails.packageSemVer);
        if (!resolvedVersion) {
            throw new Error(`Unable to resolve version for ${packageDetails.packageName}@${packageDetails.packageSemVer}`);
        }
        forDownload.packageVersion = resolvedVersion;
    }

    const downloadFilesPromises: Promise<void | string>[] = [
        downloadPackage(saveFileFromPackage, forDownload.dir, forDownload.packageName, forDownload.packageVersion),
    ];

    if (forDownload.realtiveRequest.endsWith('.js')) {
        resolveExtensions.forEach(ext =>
            downloadFilesPromises.push(
                saveFileFromPackage(forDownload.dir, forDownload.packageName, forDownload.packageVersion, forDownload.realtiveRequest.replace('.js', ext))
            )
        );
    } else if (!resolveExtensions.some(ext => forDownload.realtiveRequest.endsWith(ext))) {
        resolveExtensions.forEach(ext =>
            downloadFilesPromises.push(
                saveFileFromPackage(forDownload.dir, forDownload.packageName, forDownload.packageVersion, forDownload.realtiveRequest + ext)
            )
        );
    } else {
        downloadFilesPromises.push(
            saveFileFromPackage(forDownload.dir, forDownload.packageName, forDownload.packageVersion, forDownload.realtiveRequest)
        );
    }

    await Promise.allSettled(downloadFilesPromises);
}

async function downloadPackage( saveFileFromPackage: FetcherFunction, projectRootPath: string, packageName: string, packageVersion: string) {
    const pkgJsonData = await saveFileFromPackage(projectRootPath, packageName, packageVersion, 'package.json');
    const pkgJson = JSON.parse(pkgJsonData);
    const typesFiled = pkgJson.types || pkgJson.typings;
    if (typesFiled) {
        await saveFileFromPackage(projectRootPath, packageName, packageVersion, typesFiled);
    }
}