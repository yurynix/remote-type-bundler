const UNPKG_BASE = 'https://unpkg.com/';
import type fetch from 'node-fetch';

export const pkg = (pkgIdentifier, typesContents, dependencies = {}) => {
    const types = 'lib/types.d.ts';
    const packageIdentifierParts = pkgIdentifier.split('@');
    const packageName = packageIdentifierParts.slice(0, -1).join('@');
    const packageVersion = packageIdentifierParts[packageIdentifierParts.length - 1];

    console.log(`packageName: ${packageName} packageVersion: ${packageVersion}`);

    const pkgJson = {
        [`${pkgIdentifier}/package.json`]: JSON.stringify({
            name: packageName,
            version: packageVersion,
            types,
            dependencies: {
                ...dependencies
            },
        })
    };

    const typesFile = {
        [`${pkgIdentifier}/${types}`]: typesContents,
    }

    return {
        ...pkgJson,
        ...typesFile,
    };
}

type Fetch = typeof fetch;
export interface MockedFetch extends Fetch {
    setMockedNpmPackages: (pkgs: { [key: string]: string }) => void;
}

jest.mock('node-fetch', () => {
    let mockPackages = {};
    const fn = jest.fn((url: string) => {
        console.log(`Requested: ${url}`);
        const urlWithoutBase = url.replace(UNPKG_BASE, '');
        const file = mockPackages[urlWithoutBase];

        if (file) {
            return {
                ok: true,
                text: jest.fn(() => Promise.resolve(file))
            };
        }

        return {
            ok: false,
            text: jest.fn(() => Promise.resolve('Error'))
        };
    }) as unknown as MockedFetch;

    fn.setMockedNpmPackages = (pkgs: any) => {
        mockPackages = pkgs;
    };

    return fn;
});
