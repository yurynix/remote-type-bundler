import { getPackageDetails } from '../../src/files';
import { locateClosestPackageJson } from '../../src/locate-closest-package-json';

type OriginalLocateClosestPackageJson = typeof locateClosestPackageJson;
interface LocateClosesePackageJsonMock extends OriginalLocateClosestPackageJson {
    setDirPkgJSONs(dirPkgJSONs: { [key: string]: any }): void;
}

jest.mock('../../src/locate-closest-package-json', () => {
    let dirPackageJSONs = {};
    const locateClosestPackageJsonMock = jest.fn((containingDir: string) => {
        if (dirPackageJSONs[containingDir]) {
            return dirPackageJSONs[containingDir];
        }

        console.warn(`No mock defined for ${containingDir}`);

        return null;
    }) as unknown as LocateClosesePackageJsonMock;

    locateClosestPackageJsonMock.setDirPkgJSONs = (pkgs: any) => {
        dirPackageJSONs = pkgs;
    };

    return { locateClosestPackageJson: locateClosestPackageJsonMock };
});


describe('getPackageDetails', () => {
    it('should return correct descriptor for relative path in root package', async () => {
        (locateClosestPackageJson as LocateClosesePackageJsonMock).setDirPkgJSONs({
            '/tmp/some-dir': {
                containingDir: '/tmp/some-dir',
                pkgJson: {
                    'name': 'yury-pkg',
                    'version': '1.0.0',
                }
            }
        })
        const result = await getPackageDetails('/tmp/some-dir', './bla.d.ts', undefined);

        expect(result).toEqual({
            packageName: 'yury-pkg',
            packageSemVer: '1.0.0',
            dir: '/tmp/some-dir',
            realtiveRequest: 'bla.d.ts',
            containingPackage: undefined
        });
    });

    it('should return correct descriptor for relative inner path in root package', async () => {
        (locateClosestPackageJson as LocateClosesePackageJsonMock).setDirPkgJSONs({
            '/tmp/some-dir': {
                containingDir: '/tmp/some-dir',
                pkgJson: {
                    'name': 'yury-pkg',
                    'version': '1.0.0',
                }
            }
        })
        const result = await getPackageDetails('/tmp/some-dir', './lib/bla.d.ts', undefined);

        expect(result).toEqual({
            packageName: 'yury-pkg',
            packageSemVer: '1.0.0',
            dir: '/tmp/some-dir',
            realtiveRequest: 'lib/bla.d.ts',
            containingPackage: undefined
        });
    });


    it('should return correct descriptor for relative upper path in root package', async () => {
        const pkgJson = {
            'name': 'yury-pkg',
            'version': '1.0.0',
        };
        (locateClosestPackageJson as LocateClosesePackageJsonMock).setDirPkgJSONs({
            '/tmp/some-dir': {
                containingDir: '/tmp/some-dir',
                pkgJson
            },
            '/tmp/some-dir/lib': {
                containingDir: '/tmp/some-dir',
                pkgJson
            },
            '/tmp/some-dir/lib/moshe.d.ts': {
                containingDir: '/tmp/some-dir',
                pkgJson
            }
        });
        const result = await getPackageDetails('/tmp/some-dir', '../bla.d.ts', '/tmp/some-dir/lib/moshe.d.ts');

        expect(result).toEqual({
            packageName: 'yury-pkg',
            packageSemVer: '1.0.0',
            dir: '/tmp/some-dir',
            realtiveRequest: 'bla.d.ts',
            containingPackage: undefined
        });
    });


    it('should give stuff absolute path', async () => {
        (locateClosestPackageJson as LocateClosesePackageJsonMock).setDirPkgJSONs({
            '/tmp/some-dir/bla.d.ts': {
                containingDir: '/tmp/some-dir',
                pkgJson: {
                    'name': 'yury-pkg',
                    'version': '1.0.0',
                }
            }
        });
        const result = await getPackageDetails('/tmp/some-dir', '/tmp/some-dir/bla.d.ts', undefined);

        expect(result).toEqual({
            packageName: 'yury-pkg',
            packageSemVer: '1.0.0',
            dir: '/tmp/some-dir',
            realtiveRequest: 'bla.d.ts',
            containingPackage: undefined
        });
    });


    it('should resolve details for implicit relative path', async () => {
        (locateClosestPackageJson as LocateClosesePackageJsonMock).setDirPkgJSONs({
            '/tmp/some-dir': {
                containingDir: '/tmp/some-dir',
                pkgJson: {
                    'name': 'yury-pkg',
                    'version': '1.0.0',
                    dependencies: {},
                    devDependencies: {}
                }
            }
        });
        const result = await getPackageDetails('/tmp/some-dir', 'bla.d.ts', undefined);

        expect(result).toEqual({
            packageName: 'yury-pkg',
            packageSemVer: '1.0.0',
            dir: '/tmp/some-dir',
            realtiveRequest: 'bla.d.ts',
            containingPackage: undefined
        });
    });

    it('should resolve details for a different package', async () => {
        const containingPackageJson = {
            'name': 'yury-pkg',
            'version': '1.0.0',
            dependencies: {
                'moshe-pkg': '5.5.5',
            },
            devDependencies: {}
        };

        (locateClosestPackageJson as LocateClosesePackageJsonMock).setDirPkgJSONs({
            '/tmp/some-dir': {
                containingDir: '/tmp/some-dir',
                pkgJson: containingPackageJson,
            }
        });
        const result = await getPackageDetails('/tmp/some-dir', 'moshe-pkg', undefined);

        expect(result).toEqual({
            packageName: 'moshe-pkg',
            packageSemVer: '5.5.5',
            dir: '/tmp/some-dir/node_modules/moshe-pkg',
            realtiveRequest: '',
            containingPackage: {
                name: containingPackageJson.name,
                version: containingPackageJson.version,
                dir: '/tmp/some-dir',
            }
        });
    });
});
