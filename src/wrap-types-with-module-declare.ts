
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function wrapTypesWithModuleDeclare(source: string, packageName: string) {
    const packageNameRegex = new RegExp(`declare\\s+module\\s+.${escapeRegex(packageName)}.`, 'g');

    if (source.match(packageNameRegex)) {
        return source;
    }

    const sourceParts = source.split('\n');
    const firstLineWithoutReference = sourceParts.findIndex(line => line.trim().length > 0 && !line.startsWith('/// <reference'));
    const references = firstLineWithoutReference > -1 ? sourceParts.slice(0, firstLineWithoutReference).join('\n') : '';
    const sourceWithoutReferences = sourceParts.slice(firstLineWithoutReference).join('\n');

    const output = `${references ? references + '\n' : ''}declare module '${packageName}' {\n${sourceWithoutReferences.replace(
        /^./gm,
        '  $&',
      )}\n}`;

    return output;
}
