import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import createDebug from 'debug';

const debug = createDebug('fetch-unpkg');


export async function saveFileFromPackage(rootDir: string, packageName: string, packageVersion: string, filePath: string) {
    const url = `https://unpkg.com/${packageName}@${packageVersion}/${filePath}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
    }

    const data = await response.text();
    const saveFilePath = path.join(rootDir, filePath);
    await fs.promises.mkdir(path.dirname(saveFilePath), { recursive: true });
    await fs.promises.writeFile(saveFilePath, data);
    console.log(`Wrote ${saveFilePath}`);

    return data;
}

function createDataFetcher() {
    const cache = new Map();

    return function getData(url: string): Promise<string> {
        if (cache.has(url)) {
            debug(`Cache hit for ${url}`);
            return cache.get(url);
        }

        const promise: Promise<string> = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(url);
        
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${url}`);
                }
            
                const data = await response.text();
            
                resolve(data);
            } catch(ex) {
                reject(ex);
            }
        });

        cache.set(url, promise);

        return promise;
    }
}

export type FetcherFunction = (rootDir: string, packageName: string, packageVersion: string, filePath: string) => Promise<string>;
export function createFetcher() : FetcherFunction {
    const overallCache = new Map();
    const getData = createDataFetcher();

    return function saveFileFromPackage(rootDir: string, packageName: string, packageVersion: string, filePath: string) : Promise<string> {
        const url = `https://unpkg.com/${packageName}@${packageVersion}/${filePath}`;
        const overallCacheKey = `${url}|${filePath}`;
        if (overallCache.has(overallCacheKey)) {
            debug(`Using cached ${overallCacheKey}`);
            return overallCache.get(overallCacheKey);
        }

        overallCache.set(overallCacheKey, new Promise(async (resolve, reject) => {
            try {
                const data = await getData(url);
                const saveFilePath = path.join(rootDir, filePath);
                await fs.promises.mkdir(path.dirname(saveFilePath), { recursive: true });
                await fs.promises.writeFile(saveFilePath, data);
                debug(`Wrote ${saveFilePath}`);
            
                resolve(data);    
            } catch(ex) {
                reject(ex);
            }
        }));

        return overallCache.get(overallCacheKey);
    };
}