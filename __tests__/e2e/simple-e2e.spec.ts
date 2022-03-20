import { bundle } from '../../src/index';

const UNPKG_BASE = 'https://unpkg.com/';

const pkg = (pkgIdentifier, typesContents, dependencies = {}) => {
    const types = 'lib/types.d.ts';
    const pkgJson = {
        [`${pkgIdentifier}/package.json`]: JSON.stringify({
            name: pkgIdentifier.split('@')[0],
            version: pkgIdentifier.split('@')[1],
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

const mockPackage = {
    ...pkg('yury-pkg@1.0.0', `import { Foo } from 'foo-pkg';
    export type Bla { one: Foo };`, { 'foo-pkg': '1.2.3' }),
    ...pkg('foo-pkg@1.2.3', `export type Foo { fighters: string };`),
};

jest.mock('node-fetch', () => {
    return jest.fn((url: string) => {
        console.log(`Requested: ${url}`);
        const urlWithoutBase = url.replace(UNPKG_BASE, '');
        const file = mockPackage[urlWithoutBase];

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
    });
});

const removeAllWhiteSpaces = (str: string) => str.replace(/\s/g, '');

describe('Types bundler', () => {
    it('should work with external package dependency', async () => {
        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(removeAllWhiteSpaces(result)).toBe(removeAllWhiteSpaces(`type Foo { fighters: string };
        type Bla { one: Foo };
        export { Bla };`));
    })
});