import { useEffect, useMemo, useState, useRef } from 'react';
import * as d3 from "d3";
// import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';
import { scaleBand, scaleLinear, type ScaleBand, type ScaleLinear } from 'd3-scale';
// import { scaleBand, scaleLinear } from 'd3-scale';
// import { max } from 'd3-array';
import { select } from 'd3-selection';
import { useDimensions } from './useDimensions';

// import { keys } from 'ts-transformer-keys';




// interface Summary {
//   rows: number;
//   columns: number;
// }

interface Dimensions {
  width: number;
  height: number;
}

interface Result {
  handVect: number,
  autoVect: number,
  scalar: number,
}


interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}



// ToolTip for information on vectorization speedup for each operation
interface ToolTip {
  operation: string;
  handVect: number;
  autoVect: number;
  scalar: number;
}






interface GraphSpace {
  dimensions: Dimensions;
  margin: Margin;
  xScale: ScaleLinear<number, number, never>;
  yScale: ScaleBand<string>;
}




type Data = { [cat: string]: Result; };
function BarChart(svg: SVGSVGElement | null, data: Data, graphSpace: GraphSpace, selected: string, onHover?: (toolTip: ToolTip | null) => void, onDblClick?: (operation: string) => void) {

  const svgSel = select(svg);
  svgSel.selectAll('*').remove();


  const graph = svgSel.append('g').attr('transform', `translate(${graphSpace.margin.left},${graphSpace.margin.top})`);

  const handVecColor = '#da2c2c';
  const autoVecColor = '#7c2626';
  const autoVecColorLight = '#7c2626cc';
  const handVecColorLight = '#da2c2ccc';

  // graph_background(svgSel, graphSpace);
  graph.append('g')
    .selectAll('rect')
    .data(Object.entries(data))
    .join('rect')
    .attr('y', (d) => graphSpace.yScale(d[0]) ?? 0)
    .attr('x', (d) => graphSpace.xScale(d[1].autoVect))
    .attr('height', graphSpace.yScale.bandwidth())
    .attr('width', (d) => graphSpace.xScale(0) - graphSpace.xScale(d[1].autoVect))
    .attr('fill', (d) => d[0] === selected ? autoVecColorLight : autoVecColor)
    .attr('stroke', () => (true ? '#111827' : 'transparent'))
    .attr('stroke-width', 2)
    .on('mouseover', (_event, d) => {
      if (onHover) {
        onHover({
          operation: d[0],
          handVect: d[1].handVect,
          autoVect: d[1].autoVect,
          scalar: d[1].scalar,
        });
      }
    })
    .on('mouseout', () => {
      if (onHover) {
        onHover(null);
      }
    })
    .on('dblclick', (_event, d) => {
      if (onDblClick) {
        onDblClick(d[0]);
      }
      console.log(`Double clicked on ${d[0]}`);
    });

  // graph_background(svgSel, graphSpace);
  graph.append('g')
    .selectAll('rect')
    .data(Object.entries(data))
    .join('rect')
    .attr('y', (d) => graphSpace.yScale(d[0]) ?? 0)
    .attr('x', graphSpace.xScale(0))
    .attr('height', graphSpace.yScale.bandwidth())
    .attr('width', (d) => graphSpace.xScale(-d[1].handVect) - graphSpace.xScale(0))
    .attr('fill', (d) => d[0] === selected ? handVecColorLight : handVecColor)
    .attr('stroke', () => (true ? '#111827' : 'transparent'))
    .attr('stroke-width', 2)
    .on('mouseover', (_event, d) => {
      if (onHover) {
        onHover({
          operation: d[0],
          handVect: d[1].handVect,
          autoVect: d[1].autoVect,
          scalar: d[1].scalar,
        });
      }
    })
    .on('mouseout', () => {
      if (onHover) {
        onHover(null);
      }
    })
    .on('dblclick', (_event, d) => {
      if (onDblClick) {
        onDblClick(d[0]);
      }
      console.log(`Double clicked on ${d[0]}`);
    });

  graph
    .selectAll('text.xlabel')
    .data(Object.entries(data))
    .join('text')
    .attr('class', 'xlabel')
    .attr('x', graphSpace.xScale.range()[1] - 40)
    .attr('y', (d) => (graphSpace.yScale(d[0]) ?? 0) + graphSpace.yScale.bandwidth() / 2)
    .attr('font-size', 15)
    .text((d) => d[0])
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle');

  graph
    .selectAll('text.autolabel')
    .data(["Auto Vectorized Speedup"])
    .join('text')
    .attr('class', 'ylabel')
    .attr('x', (graphSpace.xScale.range()[1] * 3 + graphSpace.xScale(0)) / 4)
    .attr('y', -20)
    .attr('font-size', 15)
    .text((d) => d.toLocaleString())
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle');

  graph
    .selectAll('text.handlabel')
    .data(["Hand Vectorized Speedup"])
    .join('text')
    .attr('class', 'ylabel')
    .attr('x', (graphSpace.xScale.range()[0] * 3 + graphSpace.xScale(0)) / 4)
    .attr('y', -20)
    .attr('font-size', 15)
    .text((d) => d.toLocaleString())
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle');

  graph
    .selectAll('text.reflabel')
    .data(["Scalar Reference"])
    .join('text')
    .attr('class', 'ylabel')
    .attr('x', graphSpace.xScale(0))
    .attr('y', -20)
    .attr('font-size', 15)
    .text((d) => d.toLocaleString())
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle');



}





// interface Trial {
//   by_type: {[type: string]: number[]},
// };

interface Instance {
  name: string;
  type: string;
  hand_vectorized_cpu_time: number;
  llvm_auto_cpu_time: number;
  scalar_cpu_time: number;
}

const ROOT_URL = `${import.meta.env.BASE_URL}data`;
const OP_CLASSES = {
  'Core': ["Core", {
    'bench_boolean_ops': "Boolean Ops",
    'bench_broadcasting': "Matrix Broadcasting",
    'bench_gemm': "Matrix Mult (GEMM)",
  }]
}

interface Entry {
  name: string;
  results: Result;
  data: Instance[];
}

interface EntryGroup {
  name: string;
  results: Result;
  children: Entry[];
}

interface OpClass {
  name: string;
  results: Result;
  children: (EntryGroup | Entry)[];
}

function updateEntryResults(entry: Entry) {
  const combinedResult: Result = {
    handVect: 0,
    autoVect: 0,
    scalar: 0,
  };
  let count = 0;
  for (const result of entry.data) {
    combinedResult.handVect += result.hand_vectorized_cpu_time;
    combinedResult.autoVect += result.llvm_auto_cpu_time;
    combinedResult.scalar += result.scalar_cpu_time;
    count++;
  }
  if (count > 0) {
    combinedResult.handVect /= count;
    combinedResult.autoVect /= count;
    combinedResult.scalar /= count;
  }
  console.log(`Updated results for entry ${entry.name}:`, combinedResult);
  entry.results = combinedResult;
}

function updateEntryGroupResults(entryGroup: EntryGroup) {
  const combinedResult: Result = {
    handVect: 0,
    autoVect: 0,
    scalar: 0,
  };
  let count = 0;
  for (const entry of entryGroup.children) {
    updateEntryResults(entry);
    combinedResult.handVect += entry.results.handVect;
    combinedResult.autoVect += entry.results.autoVect;
    combinedResult.scalar += entry.results.scalar;
    count++;
  }
  if (count > 0) {
    combinedResult.handVect /= entryGroup.children.length;
    combinedResult.autoVect /= entryGroup.children.length;
    combinedResult.scalar /= entryGroup.children.length;
  }

  entryGroup.results = combinedResult;
}
    

function updateOpClassResults(opClass: OpClass) {
  const combinedResult: Result = {
    handVect: 0,
    autoVect: 0,
    scalar: 0,
  };
  let count = 0;
  for (const child of opClass.children) {
    if ('children' in child) {
      updateEntryGroupResults(child);
      combinedResult.handVect += child.results.handVect;
      combinedResult.autoVect += child.results.autoVect;
      combinedResult.scalar += child.results.scalar;
      count++;
    } else {
      updateEntryResults(child);
      combinedResult.handVect += child.results.handVect;
      combinedResult.autoVect += child.results.autoVect;
      combinedResult.scalar += child.results.scalar;
      count++;
    }
  }
  if (count > 0) {
    combinedResult.handVect /= count;
    combinedResult.autoVect /= count;
    combinedResult.scalar /= count;
  }
  opClass.results = combinedResult;
}


export function project() {

  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();


  // Data values
  const [opClasses, setOpClasses] = useState<OpClass[] | null>(null)
  const [data, setData] = useState<Data>({});

  // const [filteredData, setFilteredData] = useState<StudentRecord[]> ([]);
  // const [unis, setUnis] = useState<string[]> (["Combined"]);

  // const [xAxis, setXAxis] = useState<XAxis>('changeInGPA');

  const [toolTip, setToolTip] = useState<ToolTip | null>(null);

  const [workingPath, setWorkingPath] = useState<string[]>([]);
  // const [terminal, setUseScatter] = useState<boolean>(false);


  // Process data

  // Read in csv into data
  useEffect(() => {
    let cancelled = false;

    async function loadOpClasses() {
      const classes = await Promise.all(
        Object.entries(OP_CLASSES).map(async ([opClassName, [opClassFile, opGroups]]) => {
          const opClass: OpClass = {
            name: opClassName,
            results: { handVect: 0, autoVect: 0, scalar: 0 },
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

                const byOperation = new Map<string, Instance[]>();
                for (const row of parsed) {
                  const operationName = row.name;
                  if (!byOperation.has(operationName)) {
                    byOperation.set(operationName, []);
                  }

                  byOperation.get(operationName)!.push({
                    name: row.name,
                    type: row.type,
                    hand_vectorized_cpu_time: parseFloat(row.hand_vectorized_cpu_time),
                    llvm_auto_cpu_time: parseFloat(row.llvm_auto_cpu_time),
                    scalar_cpu_time: parseFloat(row.scalar_cpu_time),
                  });
                }

                const groupChildren: Entry[] = Array.from(byOperation.entries()).map(([operationName, rows]) => {
                  const entry: Entry = {
                    name: operationName,
                    results: { handVect: 0, autoVect: 0, scalar: 0 },
                    data: rows,
                  };

                  updateEntryResults(entry);
                  return entry;
                });

                const group: EntryGroup = {
                  name: opGroupName,
                  results: { handVect: 0, autoVect: 0, scalar: 0 },
                  children: groupChildren,
                };

                updateEntryGroupResults(group);
                return group;
              } catch (error) {
                console.error(`Failed to load data for ${opGroupName}`, error);
                return null;
              }
            })
          );

          opClass.children = loadedGroups.filter((group): group is EntryGroup => group !== null);
          updateOpClassResults(opClass);

          return opClass;
        })
      );

      if (!cancelled) {
        setOpClasses(classes);
      }
    }

    void loadOpClasses();

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    console.log("opClasses updated", opClasses);
  }, [opClasses]);

  // Combine Data to approximate over types
  useEffect(() => {
    setData(() => {
      const combinedData: Data = {};
      if (workingPath.length === 0) { // Show all op classes
        for (const opClass of opClasses || []) {
          console.log(`Processing opClass: ${opClass.name}`, opClass);
          combinedData[opClass.name] = {
            handVect: opClass.results.scalar / (opClass.results.handVect || 1),
            autoVect: opClass.results.scalar / (opClass.results.autoVect || 1),
            scalar: opClass.results.scalar / (opClass.results.scalar || 1),
          };
        }
      }
      else if (workingPath.length === 1) { // Show all op groups in op class
        const opClass = opClasses?.find((oc) => oc.name === workingPath[0]);
        if (!opClass) return {};
        for (const opGroup of opClass.children as EntryGroup[]) {
          combinedData[opGroup.name] = {
            handVect: opGroup.results.scalar / (opGroup.results.handVect || 1),
            autoVect: opGroup.results.scalar / (opGroup.results.autoVect || 1),
            scalar: opGroup.results.scalar / (opGroup.results.scalar || 1),
          };
        }
      }
      else if (workingPath.length === 2) { // Show all entries in op group
        const opClass = opClasses?.find((oc) => oc.name === workingPath[0]);
        if (!opClass) return {};
        const opGroup = (opClass.children as EntryGroup[]).find((og) => og.name === workingPath[1]);
        if (!opGroup) return {};
        for (const entry of opGroup.children as Entry[]) {
          combinedData[entry.name] = {
            handVect: entry.results.scalar / (entry.results.handVect || 1),
            autoVect: entry.results.scalar / (entry.results.autoVect || 1),
            scalar: entry.results.scalar / (entry.results.scalar || 1),
          };
        }
      }
      else {
        return {};
      }

      console.log(combinedData);
      return combinedData;
    });
  }, [opClasses, workingPath]);




  // Get graph dimensions and aspects -----------------------------------------
  const svg_dim: Dimensions = useMemo(() => {
    return {
      width: dimensions.width * 0.8,
      height: Math.min(dimensions.height * 0.6, dimensions.width * 0.8),
    }
  }, [dimensions]);

  const graphSpace: GraphSpace = useMemo(() => {

    const margin = { top: 50, right: 30, bottom: 50, left: 150 };

    const yScale = scaleBand()
      .domain(Object.keys(data))
      .range([0, svg_dim.height - margin.bottom - margin.top]);

    var handMax = d3.max(Object.values(data), (d) => d.handVect) ?? 0;
    var autoMax = d3.max(Object.values(data), (d) => d.autoVect) ?? 0;
    if (autoMax < handMax / 3) {
      autoMax = handMax / 3;
    }
    const xScale = scaleLinear()
      .domain([-(handMax), (autoMax)])
      .range([svg_dim.width - margin.right - margin.left, margin.left]);

    return {
      dimensions: svg_dim,
      margin,
      xScale,
      yScale,
    };
  }, [svg_dim, data]);





  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || svg_dim.width === 0 || svg_dim.height === 0) return;

    BarChart(svg, data, graphSpace, toolTip ? toolTip.operation : '', setToolTip, (operation) => {
      setWorkingPath((prevPath) => {
        if (prevPath.length === 0) {
          return [operation];
        } else if (prevPath.length === 1) {
          return [prevPath[0], operation];
        } else {
          return prevPath;
        }
      });
    });
  }, [svg_dim, graphSpace, data]);

  return (

    <div ref={divRef} className="relative flex h-full w-full flex-row shaded-box">

      <div className="flex flex-col gap-5 p-2 w-full">

        {/* Header showing current path in data */}


        <div className="flex shrink-0 flex-row gap-2 bg-gray-200 p-2 text-left font-bold w-full">
          <div key="All" className="flex flex-row gap-1">
            <button
              // className="rounded bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400"
              onClick={() => {
                setWorkingPath([]);
              }}
            >
              {"All"}
            </button>
            {/* {index < workingPath.length - 1 && <span className="text-gray-500"></span>} */}
          </div>
          {workingPath.map((path, index) => (
            <div key={index} className="flex flex-row gap-1">
              <button
                // className="rounded bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400"
                onClick={() => {
                  setWorkingPath(workingPath.slice(0, index + 1));
                }}
              >
                {path}
              </button>
              {index < workingPath.length - 1 && <span className="text-gray-500"></span>}
            </div>
          ))}
        </div>


        <div className='relative flex h-full w-full flex-row'>
          <svg
            ref={svgRef}
            width={svg_dim.width.toString()}
            height={svg_dim.height.toString()}
            className="h-full"
            role="img"
            aria-label="Responsive scatter plot showing 6 data points"
          >
          </svg>

          {/* Tooltips will be rendered right of the svg */}
          {toolTip && (
            <div className="relative top-5 right-0 m-3 rounded bg-gray-300 p-2 shadow-lg h-fit w-fit">
              <div><strong>Operation:</strong> {toolTip.operation}</div>
              <div><strong>Hand Vectorized Speedup:</strong> {toolTip.handVect.toFixed(2)}x</div>
              <div><strong>Auto Vectorized Speedup:</strong> {toolTip.autoVect.toFixed(2)}x</div>
            </div>
          )}

        </div>

      </div>



      {/* <label className="flex shrink-0 flex-col gap-2">
        
        <h1 className="mt-4 text-xl font-bold">Student Average Sleep vs GPA</h1>
          <span className="font-bold">Filter Students</span>
            
           <span>X Axis:</span>
           <select
             className="max-w-full rounded border border-gray-300 p-2"
             value={xAxis}
             onChange={(event) => setXAxis(event.target.value as typeof xAxis)}
           >
             {Object.entries(X_AXIS_CONFIG).map(([option, config]) => (
               <option key={config.label} value={option}>{config.label}</option>
             ))}
           </select>
          
           <span>By University:</span>
           <select
             className="max-w-full rounded border border-gray-300 p-2"  
             value={filter.uni}
             onChange={(event) => setFilter(updateUni(filter, event.target.value))}
           >
             {unis.map((uni) => (
               <option key={uni} value={uni}>
                 {uni}
               </option>
             ))}
           </select>

           <span>By Student Gender:</span>
           <div className="flex gap-4" role="group" aria-label="Filter by student gender">
             {genderOptions.map((gender) => (
               <label key={gender} className="flex items-center gap-1">
                 <input
                   type="radio"
                   name="gender-filter"
                   value={gender}
                   checked={filter.gender === gender}
                   onChange={(event) => setFilter(updateGender(filter, strAsGender(event.target.value)))}
                 />
                 {gender}
               </label>
             ))}
           </div>

           <span>By First-Generation Status:</span>
           <div className="flex gap-4" role="group" aria-label="Filter by first-generation status">
             {firstGenOptions.map((status) => (
               <label key={status} className="flex items-center gap-1">
                 <input
                   type="radio"
                   name="first-generation-filter"
                   value={status}
                   checked={filter.firstGen === status}
                   onChange={(event) => setFilter(updateFirstGen(filter, strAsFirstGen(event.target.value)))}
                 />
                 {status}
               </label>
             ))}
           </div>

           <span>Select Graph:</span>
           <div className="flex gap-4" role="group" aria-label="Select Graph Style">
               <label key="ScatterPlot" className="flex items-center gap-1">
                 <input
                   type="radio"
                   name="Select-Graph-Style"
                   value="ScatterPlot"
                   checked={useScatter == true}
                   onChange={() => setUseScatter(true)}
                 />
                 ScatterPlot
               </label>
               <label key={"HexPlot"} className="flex items-center gap-1">
                 <input
                   type="radio"
                   name="Select-Graph-Style"
                   value="HexPlot"
                   checked={useScatter == false}
                   onChange={() => setUseScatter(false)}
                 />
                 HexPlot
               </label>
           </div>


         </label> */}

    </div>

  );
}