import { pkg, MockedFetch } from './utils';
import { bundle } from '../../src/index';
import fetch from 'node-fetch';

const removeAllWhiteSpaces = (str: string) => str.replace(/\s/g, '');

describe('Types bundler', () => {
    it('should work with external package dependency', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `import { Foo } from 'foo-pkg';
            export type Bla { one: Foo };`, { 'foo-pkg': '1.2.3' }),
            ...pkg('foo-pkg@1.2.3', `export type Foo { fighters: string };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        
        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result)).toBe(removeAllWhiteSpaces(`type Foo { fighters: string };
        type Bla { one: Foo };
        export { Bla };`));
    });

    it('should work with scoped packages dependency', async () => {
        const mockPackages = {
            ...pkg('@wix/yury-pkg@1.0.0', `import { Foo } from '@wix/foo-pkg';
            export type Bla { one: Foo };`, { '@wix/foo-pkg': '1.2.3' }),
            ...pkg('@wix/foo-pkg@1.2.3', `export type Foo { fighters: string };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        
        const result = await bundle('@wix/yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result)).toBe(removeAllWhiteSpaces(`type Foo { fighters: string };
        type Bla { one: Foo };
        export { Bla };`));
    });

    it('should not touch absolute references', async () => {
        const mockPackages = {
            ...pkg('@wix/yury-pkg@1.0.0', `/// <reference path="/elementsMap.d.ts" />
            /// <reference path="/types/pages/$w.d.ts" />
            export type Bla { one: Foo };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        
        const result = await bundle('@wix/yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result)).toBe(removeAllWhiteSpaces(`/// <reference path="/elementsMap.d.ts" />
        /// <reference path="/types/pages/$w.d.ts" />
        type Bla { one: Foo };
        export { Bla };`));
    });

    it('should wrap the resulting bundle with a module declare', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `/// <reference path="/elementsMap.d.ts" />
            import { Foo } from 'foo-pkg';
            export type Bla = { one: Foo };`, { 'foo-pkg': '1.2.3' }),
            ...pkg('foo-pkg@1.2.3', `export type Foo = { fighters: string };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        
        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true });

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result)).toBe(removeAllWhiteSpaces(`/// <reference path="/elementsMap.d.ts" />
        declare module 'yury-pkg' {
            type Foo = { fighters: string };
            type Bla = { one: Foo };
            export { Bla };
        }`));
    });
});
