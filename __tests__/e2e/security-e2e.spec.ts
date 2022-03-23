import { pkg, MockedFetch } from './utils';
import { bundle } from '../../src/index';
import fetch from 'node-fetch';

describe.only('Types bundler security', () => {
    it('should not import files outside the project root via relative path', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `/// <reference path="/elementsMap.d.ts" />
            import { Foo } from '../../../../../../../../../../etc/passwd';
            export type Bla = { one: Foo };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        
        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true });

        expect(result).toBeUndefined();
    });

    it('should not import files outside the project root via absolute path', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `/// <reference path="/etc/passwd" />
            import { Foo } from '/etc/passwd';
            export type Bla = { one: Foo };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        
        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true });

        expect(result).toBeUndefined();
    });

    it('should not reference types outside the project root', async () => {
        (fetch as MockedFetch).setMockedNpmPackages({
            'yury-pkg@1.0.0/package.json': JSON.stringify({
                name: 'yury-pkg',
                version: '1.0.0',
                types: '../../../../../../../../../../../../../../etc/passwd'
            })
        });
        
        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true });
        
        expect(result).toBeUndefined();
    });
});
