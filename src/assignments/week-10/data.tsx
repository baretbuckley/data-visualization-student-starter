



export interface ResultRatio {
  handVect: number,
  autoVect: number,
//   scalar: number,
}

export interface Instance {
  type: string;
  size: number;
  baselineScalar: number;
  result: ResultRatio;
//   hand_vectorized_cpu_time: number;
//   llvm_auto_cpu_time: number;
//   scalar_cpu_time: number;
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
    if ('children' in child) {
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