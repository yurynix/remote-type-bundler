import path from 'path';
import fs from 'fs';

async function tryReadPackageJson(containingDir: string) {
    try {
        const pkgJsonPath = path.join(containingDir, 'package.json');
        const data = await fs.promises.readFile(pkgJsonPath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

export async function locateClosestPackageJson(containingDir: string) {
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
