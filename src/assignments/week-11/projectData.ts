import { csvParse } from 'd3-dsv';

import * as Data from './data';

export const ROOT_URL = `${import.meta.env.BASE_URL}data`;

export const OP_CLASSES = {
  'Core': ["Core", {
    'bench_boolean_ops': "Boolean Ops",
    'bench_broadcasting': "Matrix Broadcasting",
    'bench_gemm': "Matrix Mult (GEMM)",
    'bench_cwise_math': 'Col-Wise Math',
  }],
  'LU': ["LU", {
    'bench_lu': "LU Decomposition",
    'bench_lu_stride': "Strided LU Decomp",
  }],
  'Eigen Values': ["Eigenvalues", {
    'bench_geev': "Eigen Solver",
  }],
} as const;

export async function loadOpClasses(): Promise<Data.OpClass[]> {
  return Promise.all(
    Object.entries(OP_CLASSES).map(async ([opClassName, [opClassFile, opGroups]]) => {
      const opClass: Data.OpClass = {
        name: opClassName,
        results: { handVect: 0, autoVect: 0 },
        children: [],
      };

      const loadedGroups = await Promise.all(
        Object.entries(opGroups).map(async ([opGroup, opGroupName]) => {
          try {
            const url = `${ROOT_URL}/${opClassFile}/${opGroup}.csv`;
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${url}: ${response.status}`);
            }

            const text = await response.text();
            const parsed = csvParse(text);

            const byOperation = new Map<string, Data.Instance[]>();
            for (const row of parsed) {
              const operationName = row.name;
              if (!byOperation.has(operationName)) {
                byOperation.set(operationName, []);
              }

              const scalar = parseFloat(row.scalar_cpu_time);
              byOperation.get(operationName)!.push({
                type: row.type,
                size: parseInt(row.size),
                baselineScalar: scalar,
                result: {
                  handVect: scalar / parseFloat(row.hand_vectorized_cpu_time),
                  autoVect: scalar / parseFloat(row.llvm_auto_cpu_time),
                },
              });
            }

            const groupChildren: Data.Entry[] = Array.from(byOperation.entries()).map(([operationName, rows]) => {
              const entry: Data.Entry = {
                name: operationName,
                results: { handVect: 0, autoVect: 0 },
                data: rows,
              };

              Data.updateEntryResults(entry);
              return entry;
            });

            const group: Data.EntryGroup = {
              name: opGroupName,
              results: { handVect: 0, autoVect: 0 },
              children: groupChildren,
            };

            Data.updateEntryGroupResults(group);
            return group;
          } catch (error) {
            console.error(`Failed to load data for ${opGroupName}`, error);
            return null;
          }
        })
      );

      opClass.children = loadedGroups.filter((group): group is Data.EntryGroup => group !== null);
      Data.updateOpClassResults(opClass);

      return opClass;
    })
  );
}
