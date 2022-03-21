import { pkg, MockedFetch } from './utils';
import { bundle } from '../../src/index';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const removeAllWhiteSpaces = (str: string) => str.replace(/\s/g, '');

describe('Types bundler fixtures', () => {
    it('should work with react-velo', async () => {
        const packageIdentifier = '@wix/react-velo@6.6.6';
        const inputFilePath = path.join(__dirname, 'fixtures', 'react-velo.d.ts');
        const typeDefinitions = await fs.promises.readFile(inputFilePath, 'utf8');
        const mockPackages = {
            ...pkg(packageIdentifier, typeDefinitions),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        
        const result = await bundle(packageIdentifier, '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true });

        expect(result).toBeTruthy();

        const expectedFilePath = inputFilePath + '-result';
        const expectedResult = await fs.promises.readFile(expectedFilePath, 'utf8');

        expect(removeAllWhiteSpaces(result)).toBe(removeAllWhiteSpaces(expectedResult));
    });
});
