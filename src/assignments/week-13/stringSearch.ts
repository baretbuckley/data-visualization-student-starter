

export function distance(str: string, target: string, i=0, j=0): number {
    // Calculate the Damerau-Levenshtein distance between the two strings
    if (i === 0 && j === 0) return 0;

    const delMatch = (i > 0) ? distance(str, target, i - 1, j) + 1 : Infinity;
    const insMatch = (j > 0) ? distance(str, target, i, j - 1) + 1 : Infinity;
    const subMatch = (i > 0 && j > 0) ? distance(str, target, i - 1, j - 1) + (str[i - 1] === target[j - 1] ? 0 : 1) : Infinity;
    return Math.min(delMatch, insMatch, subMatch);
}

export function findNClosestStrings(str: string[], target: string, n: number): string[] {
    const distances: { str: string; distance: number }[] = [];

    for (let i = 0; i < str.length; i++) {
        const currentStr = str[i];
        const dist = distance(currentStr, target, currentStr.length, target.length);
        distances.push({ str: currentStr, distance: dist });
    }

    distances.sort((a, b) => a.distance - b.distance);

    return distances.slice(0, n).map(item => item.str);
}