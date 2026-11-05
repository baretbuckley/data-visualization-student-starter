import * as d3 from "d3";

import type * as Data from './data';
import type { LineGraphData } from './lineGraph';

export function buildSeriesForEntry(entry: Data.Entry): LineGraphData[] {
  const aggregateBySize = new Map<number, { hand: number[]; auto: number[] }>();

  for (const instance of entry.data) {
    const current = aggregateBySize.get(instance.size) ?? { hand: [], auto: [] };
    current.hand.push(instance.result.handVect);
    current.auto.push(instance.result.autoVect);
    aggregateBySize.set(instance.size, current);
  }

  return Array.from(aggregateBySize.entries())
    .map(([size, values]) => ({
      size,
      hand: d3.mean(values.hand) ?? 0,
      auto: -(d3.mean(values.auto) ?? 0),
    }))
    .sort((a, b) => a.size - b.size);
}

export function buildComparisonSeries(
  opClasses: Data.OpClass[] | null,
  workingPath: string[],
  compareMode: boolean,
  compareOps: string[][],
): { [key: string]: LineGraphData[] } {
  if (!opClasses || workingPath.length !== 2 || !compareMode) {
    return {} as { [key: string]: LineGraphData[] };
  }

  const opClass = opClasses.find((oc) => oc.name === workingPath[0]);
  if (!opClass) return {} as { [key: string]: LineGraphData[] };

  const opGroup = (opClass.children as Data.EntryGroup[]).find((og) => og.name === workingPath[1]);
  if (!opGroup) return {} as { [key: string]: LineGraphData[] };

  const selectedOps = compareOps.length > 0 ? compareOps : opGroup.children.map((entry) => [opClass.name, opGroup.name, entry.name]);
  const byName: { [key: string]: LineGraphData[] } = {};

  for (const path of selectedOps) {
    const entry = opGroup.children.find((child) => child.name === path[2]);
    if (!entry) continue;
    byName[entry.name] = buildSeriesForEntry(entry);
  }

  return byName;
}
