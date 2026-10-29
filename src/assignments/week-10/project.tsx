import { useEffect, useMemo, useState, useRef } from 'react';
import * as d3 from "d3";
// import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';
import { scaleBand, scaleLinear } from 'd3-scale';
import { useDimensions } from './useDimensions';

import * as Data from './data';
import type { BarChartData, BarToolTip } from './barChart';
import { BarChart } from './barChart';
import { LineGraph, type LineGraphData, type LineToolTip } from './lineGraph';
import type { BarChartSpace, LineGraphSpace, Dimensions } from './graphSpace';
import { workingPathHeader } from './workingPathHeader';
import { infoButton } from './helpMenue';






const ROOT_URL = `${import.meta.env.BASE_URL}data`;
const OP_CLASSES = {
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
}

    



export function ProjectAddedInteraction() {

  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();
  


  // Data values
  const [opClasses, setOpClasses] = useState<Data.OpClass[] | null>(null)
  const [data, setData] = useState<BarChartData>({});

  // const [filteredData, setFilteredData] = useState<StudentRecord[]> ([]);
  // const [unis, setUnis] = useState<string[]> (["Combined"]);

  // const [xAxis, setXAxis] = useState<XAxis>('changeInGPA');

  const [toolTip, setToolTip] = useState<BarToolTip | null>(null);
  const [lineToolTip, setLineToolTip] = useState<LineToolTip|null>(null);

  const [workingPath, setWorkingPath] = useState<string[]>([]);
  const [useLineChart, setUseLineChart] = useState<boolean>(false);
  const [selectEntry, setSelectEntry] = useState<Data.Entry | null>(null);

  const [helpMenuePressed, setHelpMenuePressed] = useState<boolean>(false)

  // const [terminal, setUseScatter] = useState<boolean>(false);
  useEffect(() => {
    if (workingPath.length === 3) {
      setUseLineChart(true);
      setToolTip(null);
    } else {
      setUseLineChart(false);
      setLineToolTip(null);
    }
  }, [workingPath]);

  // Process data

  // Read in csv into data
  useEffect(() => {
    let cancelled = false;

    async function loadOpClasses() {
      const classes = await Promise.all(
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

      if (!cancelled) {
        setOpClasses(classes);
      }
    }

    void loadOpClasses();

    return () => {
      cancelled = true;
    };
  }, []);



  // Combine Data to approximate over types
  useEffect(() => {
    setData(() => {
      const combinedData: BarChartData = {};
      if (workingPath.length === 0) { // Show all op classes
        for (const opClass of opClasses || []) {
          combinedData[opClass.name] = {
            handVect: opClass.results.handVect,
            autoVect: opClass.results.autoVect,
          };
        }
      }
      else if (workingPath.length === 1) { // Show all op groups in op class
        const opClass = opClasses?.find((oc) => oc.name === workingPath[0]);
        if (!opClass) return {};
        for (const opGroup of opClass.children as Data.EntryGroup[]) {
          combinedData[opGroup.name] = {
            handVect: opGroup.results.handVect,
            autoVect: opGroup.results.autoVect,
          };
        }
      }
      else if (workingPath.length === 2) { // Show all entries in op group
        const opClass = opClasses?.find((oc) => oc.name === workingPath[0]);
        if (!opClass) return {};
        const opGroup = (opClass.children as Data.EntryGroup[]).find((og) => og.name === workingPath[1]);
        if (!opGroup) return {};
        for (const entry of opGroup.children as Data.Entry[]) {
          combinedData[entry.name] = {
            handVect: entry.results.handVect,
            autoVect: entry.results.autoVect,
          };
        }
      }
      else {
        return {};
      }

      return combinedData;
    });
  }, [opClasses, workingPath]);

  useEffect(() => {
    if (!useLineChart || !opClasses) {
      setSelectEntry(null);
      return;
    }
    if (workingPath.length < 3) {
      setSelectEntry(null);
      return;
    }
    const opClass = opClasses.find((oc) => oc.name === workingPath[0]);
    if (!opClass) {
      setSelectEntry(null);
      return;
    }
    const opGroup = (opClass.children as Data.EntryGroup[]).find((og) => og.name === workingPath[1]);
    if (!opGroup) {
      setSelectEntry(null);
      return;
    }
    const entry = opGroup.children.find((oc) => oc.name === workingPath[2]) ?? null;
    setSelectEntry(entry);
  }, [opClasses, useLineChart, workingPath]);


  // Get graph dimensions and aspects -----------------------------------------
  const spacing_gap = 0;
  const svg_dim: Dimensions = useMemo(() => {
    return {
      width: dimensions.width * 0.75,
      height: Math.min(dimensions.height * 0.8, dimensions.width * 0.8),
    }
  }, [dimensions]);

  const right_tip_dim: Dimensions = useMemo(() => {
    return {
      width: dimensions.width - svg_dim.width - spacing_gap,
      height: Math.min(dimensions.height * 0.6, dimensions.width * 0.8)
    }
  }, [dimensions, svg_dim]);

  const barChartSpace: BarChartSpace = useMemo(() => {
    const margin = { top: 50, right: 5, bottom: 50, left: 200 };
    const yScale = scaleBand()
      .domain(Object.keys(data))
      .range([0, svg_dim.height - margin.bottom - margin.top]);
    var handMax = (d3.max(Object.values(data), (d) => d.handVect) ?? 0);
    var autoMax = d3.max(Object.values(data), (d) => d.autoVect) ?? 0;
    if (autoMax < handMax / 3) {
      autoMax = handMax / 3;
    }
    const xScale = scaleLinear()
      .domain([-(autoMax), (handMax)])
      .range([0, svg_dim.width - margin.right - margin.left]);

    return {
      dimensions: svg_dim,
      margin,
      xScale,
      yScale,
    };
  }, [svg_dim, data]);

  const LineGraphSpace: LineGraphSpace = useMemo(() => {
    const margin = { top: 50, right: 5, bottom: 50, left: 60 };
    if (selectEntry === null) {
      const default_scale = scaleLinear()
        .domain([0, 1])
        .range([0, 0]);
      return {
        dimensions: svg_dim,
        margin: margin,
        xScale: default_scale,
        yScale: default_scale,
      };
    }
    var handMax = (d3.max(selectEntry.data, (d) =>d.result.handVect) ?? 0);
    var autoMax = (d3.max(selectEntry.data, (d) => d.result.autoVect) ?? 0);
    if (autoMax < handMax / 3) {
      autoMax = handMax / 3;
    }
    const yScale = scaleLinear()
      .domain([-(autoMax), (handMax)])
      .range([svg_dim.height - margin.top - margin.left, 0]);
    
    var maxSize = (d3.max(selectEntry.data, (d) => d.size) ?? 0);
    var minSize = (d3.min(selectEntry.data, (d) => d.size) ?? 0);

    const xScale = scaleLinear()
      .domain([minSize, maxSize])
      .range([0, svg_dim.width - margin.right - margin.left]);

    return {
      dimensions: svg_dim,
      margin: margin,
      xScale: xScale,
      yScale: yScale,
    };
  }, [svg_dim, selectEntry]);


  // Bar chart
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || svg_dim.width === 0 || svg_dim.height === 0) return;
    if (useLineChart) return;
    BarChart(svg, data, barChartSpace, toolTip? toolTip.operation : "", setToolTip, (operation) => {
      setWorkingPath((prevPath) => {
        if (prevPath.length === 0) {
          return [operation];
        } else if (prevPath.length === 1) {
          return [prevPath[0], operation];
        } else {
          return [prevPath[0], prevPath[1], operation];
        }
      });
    });
  }, [svg_dim, barChartSpace, data, useLineChart, toolTip]);

  // Line chart
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || svg_dim.width === 0 || svg_dim.height === 0) return;
    if (!useLineChart) return;
    if (opClasses === null) return;

    const opClass = opClasses.find((oc) => oc.name === workingPath[0]);
    if (!opClass) return;
    const opGroup = (opClass.children as Data.EntryGroup[]).find((og) => og.name === workingPath[1]);
    if (!opGroup) return;
    const entry = opGroup.children.find((oc) => oc.name === workingPath[2]);
    if (!entry) return;
    console.log("Creating line chart");
    const selectSize = (lineToolTip)? lineToolTip.size : 20;
    
    const aggregateBySize = new Map<number, { hand: number[]; auto: number[] }>();

    for (const instance of entry.data) {
      const current = aggregateBySize.get(instance.size) ?? { hand: [], auto: [] };
      current.hand.push(instance.result.handVect);
      current.auto.push(instance.result.autoVect);
      aggregateBySize.set(instance.size, current);
    }


    const points: LineGraphData[] = Array.from(aggregateBySize.entries())
      .map(([size, values]) => ({
        size,
        hand: d3.mean(values.hand) ?? 0,
        auto: -(d3.mean(values.auto) ?? 0),
      }))
      .sort((a, b) => a.size - b.size);
    LineGraph(svg, points, LineGraphSpace, selectSize, setLineToolTip);
  }, [useLineChart, LineGraphSpace, opClasses, workingPath, lineToolTip])

  return (

    <div ref={divRef} className="relative h-full w-full shaded-box">

      {helpMenuePressed && (
        <div
          className="absolute left-1/2 top-20 z-20 w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 rounded bg-gray-200 p-4 shadow-2xl"
          style={{border: '1px solid rgb(0, 0, 0)'}}
        >
          <div className="mb-2 flex items-center justify-between">
            <strong>Help</strong>
            <button
              type="button"
              onClick={() => setHelpMenuePressed(false)}
              className="rounded bg-gray-300 px-2 py-1 text-sm"
              aria-label="Close help menu"
            >
              ×
            </button>
          </div>
          <div className="text-sm w-fit h-fit">
            <p>Welcome to the Eigen Benchmark Vectorization Explorer.</p>
            <p>Here the performance improvment from Hand-Vectorized and Auto-Vectorized are compared across different operations provided by Eigen's benchmarking system.</p>
            <div className="pt-4 space-y-1">
              <p>Explore different catagories through the interaactive bar-chart.</p>
            </div>
            <p>Each bar represents the average of all subcatagories/operations in that catagory</p>
            <p>Double click to drill deeper and explore subcatagories/operation.</p>
            <p>Use the breadcrumb tooltip at the top to go back to overarching catagories.</p>
            <p>Once you enter an operation it will show a linegraph of the performance over different matrix/vector sizes</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-0 p-0 w-full">

        <div className="relative flex h-fit w-full flex-row">
          <header className="w8-header p-2">
            <h1 className="text-2xl">Performance Ratio of Hand- and Auto-Vectorized Against Scalar Code</h1>
            <p className="w8-eyebrow">Comparison of Vectorization on the Eigen Library Benchmark</p>
          </header>

          <div className="flex w-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'right',
            paddingRight: 45
          }}>
            {infoButton(45, helpMenuePressed, () => {setHelpMenuePressed(!helpMenuePressed)})}
          </div>
        </div>
        

        {/* Header showing current path in data */}
        {workingPathHeader(workingPath, setWorkingPath)}
        


        <div className='relative flex h-full w-full min-w-0 flex-row bg-gray-200'>
          <svg
            ref={svgRef}
            width={svg_dim.width.toString()}
            height={svg_dim.height.toString()}
            className="h-full shrink-0"
            role="img"
            aria-label="Responsive scatter plot showing 6 data points"
          >
          </svg>

          {/* Tooltips will be rendered right of the svg */}
          {toolTip && (
            <div 
              className="relative mt-5 min-w-0 flex-1 rounded bg-gray-300 p-2 shadow-lg"
              style={{
                height: right_tip_dim.height,
              }}
            >
              <div><strong>Operation:</strong> {toolTip.operation}</div>
              <div><strong>Hand Vectorized Speedup:</strong> {toolTip.result.handVect.toFixed(2)}x</div>
              <div><strong>Auto Vectorized Speedup:</strong> {toolTip.result.autoVect.toFixed(2)}x</div>
              <div><strong>*Double Click to Expand*</strong></div>
            </div>
          )}
          {lineToolTip && (
            <div 
              className="relative mt-5 min-w-0 flex-1 rounded bg-gray-300 p-2 shadow-lg"
              style={{
                height: right_tip_dim.height,
              }}
            >
              <div><strong>Operation Size:</strong> {lineToolTip.size}</div>
              <div><strong>Hand Vectorized Speedup:</strong> {lineToolTip.handV.toFixed(2)}x</div>
              <div><strong>Auto Vectorized Speedup:</strong> {lineToolTip.autoV.toFixed(2)}x</div>
              <div><strong>*Double Click to Expand*</strong></div>
            </div>
          )}

        </div>

      </div>
    </div>

  );
}