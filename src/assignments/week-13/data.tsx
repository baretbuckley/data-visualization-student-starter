import { findNClosestStrings } from "./stringSearch";

export interface ResultRatio {
  handVect: number;
  autoVect: number;
}

export interface Instance {
  type: string;
  size: number;
  baselineScalar: number;
  result: ResultRatio;
}

export interface Entry {
  name: string;
  results: ResultRatio;
  data: Instance[];
}

export interface EntryGroup {
  name: string;
  results: ResultRatio;
  children: Entry[];
}

export interface OpClass {
  name: string;
  results: ResultRatio;
  children: (EntryGroup | Entry)[];
}

export function updateEntryResults(entry: Entry) {
  const combinedResult: ResultRatio = {
    handVect: 0,
    autoVect: 0,
  };
  let count = 0;
  for (const instance of entry.data) {
    combinedResult.handVect += instance.result.handVect;
    combinedResult.autoVect += instance.result.autoVect;
    count++;
  }
  if (count > 0) {
    combinedResult.handVect /= count;
    combinedResult.autoVect /= count;
  }
  entry.results = combinedResult;
}

export function updateEntryGroupResults(entryGroup: EntryGroup) {
  const combinedResult: ResultRatio = {
    handVect: 0,
    autoVect: 0,
  };
  let count = 0;
  for (const entry of entryGroup.children) {
    updateEntryResults(entry);
    combinedResult.handVect += entry.results.handVect;
    combinedResult.autoVect += entry.results.autoVect;
    count++;
  }
  if (count > 0) {
    combinedResult.handVect /= entryGroup.children.length;
    combinedResult.autoVect /= entryGroup.children.length;
  }

  entryGroup.results = combinedResult;
}

export function updateOpClassResults(opClass: OpClass) {
  const combinedResult: ResultRatio = {
    handVect: 0,
    autoVect: 0,
  };
  let count = 0;
  for (const child of opClass.children) {
    if ("children" in child) {
      updateEntryGroupResults(child);
      combinedResult.handVect += child.results.handVect;
      combinedResult.autoVect += child.results.autoVect;
      count++;
    } else {
      updateEntryResults(child);
      combinedResult.handVect += child.results.handVect;
      combinedResult.autoVect += child.results.autoVect;
      count++;
    }
  }
  if (count > 0) {
    combinedResult.handVect /= count;
    combinedResult.autoVect /= count;
  }
  opClass.results = combinedResult;
}

// Search through opclasses and return the closest matches of all op classes, groups, or operations
// Returns operations by their working path
export function searchOps(opClasses: OpClass[], searchTerm: string, n: number): string[][] {

  const names: string[] = [];
  const paths: Record<string, string[]> = {};

  if (!searchTerm.trim()) {
    return [];
  }

  for (const opClass of opClasses) {
    names.push(opClass.name.toLowerCase());
    paths[opClass.name.toLowerCase()] = [opClass.name];
    for (const child of opClass.children) {
      names.push(child.name.toLowerCase());
      paths[child.name.toLowerCase()] = [opClass.name, child.name];
      if ("children" in child) {
        for (const entry of child.children) {
          names.push(entry.name.toLowerCase());
          paths[entry.name.toLowerCase()] = [opClass.name, child.name, entry.name];
        }
      }
    }
  }

  const closestNames = findNClosestStrings(names, searchTerm.toLowerCase(), n);
  const closestPaths: string[][] = closestNames.map((name) => paths[name]);
  return closestPaths;

}
