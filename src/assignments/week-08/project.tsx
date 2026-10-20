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



// BarToolTip for information on vectorization speedup for each operation
interface BarToolTip {
  operation: string;
  handVect: number;
  autoVect: number;
  scalar: number;
}

interface LineToolTip {
  size: number,
  handV: number,
  autoV: number,
}






interface GraphSpace {
  dimensions: Dimensions;
  margin: Margin;
  xScale: ScaleLinear<number, number, never>;
  yScale: ScaleBand<string>;
}

interface LineGraphSpace {
  dimensions: Dimensions;
  margin: Margin;
  xScale: ScaleLinear<number, number, never>;
  yScale: ScaleLinear<number, number, never>;
}

interface Instance {
  type: string;
  size: number;
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
  }],
  'LU': ["LU", {
    'bench_lu': "LU Decomposition",
  }],
  'Eigen Values': ["Eigenvalues", {
    'bench_geev': "Eigen Solver",
  }],
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




function LineGraph(svg: SVGSVGElement | null, data: Entry, graphSpace: LineGraphSpace, selectSize: number, setToolTip: (tip: LineToolTip|null) => void) {
  const svgSel = select(svg);
  svgSel.selectAll('*').remove();

  const graph = svgSel.append('g').attr('transform', `translate(${graphSpace.margin.left},${graphSpace.margin.top})`);

  const aggregateBySize = new Map<number, { hand: number[]; auto: number[] }>();

  for (const instance of data.data) {
    const current = aggregateBySize.get(instance.size) ?? { hand: [], auto: [] };
    current.hand.push(instance.scalar_cpu_time / (instance.hand_vectorized_cpu_time || 1));
    current.auto.push(instance.scalar_cpu_time / (instance.llvm_auto_cpu_time || 1));
    aggregateBySize.set(instance.size, current);
  }

  interface Point {
    size: number,
    hand: number,
    auto: number,
  }
  const points: Point[] = Array.from(aggregateBySize.entries())
    .map(([size, values]) => ({
      size,
      hand: d3.mean(values.hand) ?? 0,
      auto: -(d3.mean(values.auto) ?? 0),
    }))
    .sort((a, b) => a.size - b.size);

  const plotWidth = graphSpace.dimensions.width - graphSpace.margin.left - graphSpace.margin.right;
  const plotHeight = graphSpace.dimensions.height - graphSpace.margin.top - graphSpace.margin.bottom;

  const zeroY = graphSpace.yScale(0);


  const getClosestPoint = (size: number) => {
    let minDistance = Infinity;
    let closest: Point | null = null;

    for (const point of points) {
      const distance = Math.abs(point.size - size);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }

    return closest;
  };

  

  // Background grid
  graph
    .append('g')
    .selectAll('line.grid')
    .data(graphSpace.yScale.ticks(6))
    .join('line')
    .attr('class', 'grid')
    .attr('x1', 0)
    .attr('x2', plotWidth)
    .attr('y1', (d) => graphSpace.yScale(d))
    .attr('y2', (d) => graphSpace.yScale(d))
    .attr('stroke', '#d1d5db')
    .attr('stroke-dasharray', '4 4');

  // Zero reference line
  graph
    .append('line')
    .attr('x1', -10)
    .attr('x2', plotWidth)
    .attr('y1', zeroY)
    .attr('y2', zeroY)
    .attr('stroke', '#000000')
    .attr('stroke-width', 1.5);

  // X axis
  graph
    .append('g')
    .attr('transform', `translate(0, ${graphSpace.yScale.range()[0]})`)
    .call(
      d3
        .axisBottom(graphSpace.xScale)
        .ticks(6)
        .tickFormat((d: number | Date) => {
          const value = d as number;
          return value.toLocaleString();
        })
    )
    .call((g) => g.select('.domain').attr('stroke', '#374151'))
    .call((g) => g.selectAll('.tick line').attr('stroke', '#374151'))
    .call((g) => g.selectAll('.tick text').attr('font-size', 11));

  // Y axis
  graph
    .append('g')
    .call(
      d3
        .axisLeft(graphSpace.yScale)
        .ticks(6)
        .tickFormat((d: number | Date) => {
          const value = Math.abs(d as number);
          return `${value.toFixed(1)}x`;
        })
    )
    .call((g) => g.select('.domain').attr('stroke', '#374151'))
    .call((g) => g.selectAll('.tick line').attr('stroke', '#374151'))
    .call((g) => g.selectAll('.tick text').attr('font-size', 11));

  // X-axis label
  graph
    .append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .text('Size');

  // Y-axis label
  graph
    .append('text')
    .attr('transform', `translate(${-40}, ${plotHeight / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .text('Speedup vs Scalar');

  // Positive/negative legend
  graph
    .append('text')
    .attr('x', plotWidth * 0.75)
    .attr('y', -8)
    .attr('text-anchor', 'middle')
    .attr('font-size', 11)
    .attr('fill', '#da2c2c')
    .text('Hand Vectorized');

  graph
    .append('text')
    .attr('x', plotWidth * 0.75)
    .attr('y', graphSpace.yScale.range()[0]+30)
    .attr('text-anchor', 'middle')
    .attr('font-size', 11)
    .attr('fill', '#7c2626')
    .text('Auto Vectorized');

  const handLine = d3
    .line<{ size: number; hand: number }>()
    .x((d) => graphSpace.xScale(d.size))
    .y((d) => graphSpace.yScale(d.hand))
    .curve(d3.curveCardinal);

    // curveMonotoneX

  const autoLine = d3
    .line<{ size: number; auto: number }>()
    .x((d) => graphSpace.xScale(d.size))
    .y((d) => graphSpace.yScale(d.auto))
    .curve(d3.curveMonotoneX);

  graph
    .append('path')
    .datum(points.map((p) => ({ size: p.size, hand: p.hand })))
    .attr('fill', 'none')
    .attr('stroke', '#da2c2c')
    .attr('stroke-width', 2.5)
    .attr('d', handLine);

  graph
    .append('path')
    .datum(points.map((p) => ({ size: p.size, auto: p.auto })))
    .attr('fill', 'none')
    .attr('stroke', '#7c2626')
    .attr('stroke-width', 2.5)
    .attr('d', autoLine);

  // Points
  graph
    .append('g')
    .selectAll('circle.hand-point')
    .data(points)
    .join('circle')
    .attr('class', 'hand-point')
    .attr('cx', (d) => graphSpace.xScale(d.size))
    .attr('cy', (d) => graphSpace.yScale(d.hand))
    .attr('r', 4)
    .attr('fill', '#da2c2c');

  graph
    .append('g')
    .selectAll('circle.auto-point')
    .data(points)
    .join('circle')
    .attr('class', 'auto-point')
    .attr('cx', (d) => graphSpace.xScale(d.size))
    .attr('cy', (d) => graphSpace.yScale(d.auto))
    .attr('r', 4)
    .attr('fill', '#7c2626');

  // Nearest data point tooltip highlight line
  // Zero reference line
  graph
    .append('line')
    .attr('x1', graphSpace.xScale(selectSize))
    .attr('x2', graphSpace.xScale(selectSize))
    .attr('y1', graphSpace.yScale.range()[0])
    .attr('y2', graphSpace.yScale.range()[1])
    .attr('stroke', '#000000')
    .attr('stroke-width', 1.5);


  graph.append('g')
    .selectAll('rect')
    .data([0])
    .join('rect')
    .attr('y',0)
    .attr('x', 0)
    .attr('height', graphSpace.yScale.range()[0] - graphSpace.yScale.range()[1])
    .attr('width', graphSpace.xScale.range()[1] - graphSpace.xScale.range()[0])
    .attr('fill', "#00000000")
    .on('mousemove', (event, _d) => {
      console.log("mouse over");
      console.log("mouse exact: ", event.clientX);
      const mouseX = event.clientX - graphSpace.margin.left - 250;
      const x = graphSpace.xScale.invert(mouseX);

      const closest = getClosestPoint(x);
      console.log("closest", closest);
      
      if (closest === null) setToolTip(null);
      else {
        console.log(mouseX, x, closest.size);
        if (closest.size == selectSize) return;

        setToolTip({
          size: closest.size,
          handV: closest.hand,
          autoV: -closest.auto,
        });
      }
    });
}


type Data = { [cat: string]: Result; };
function BarChart(svg: SVGSVGElement | null, data: Data, graphSpace: GraphSpace, selected: string, onHover?: (toolTip: BarToolTip | null) => void, onDblClick?: (operation: string) => void) {

  const svgSel = select(svg);
  svgSel.selectAll('*').remove();


  const graph = svgSel.append('g').attr('transform', `translate(${graphSpace.margin.left},${graphSpace.margin.top})`);

  const handVecColor = '#da2c2c';
  const autoVecColor = '#7c2626';
  const handVecColorLight = '#fb4f4f';
  const autoVecColorLight = '#cd5d5d';

  const xticks = graphSpace.xScale.ticks(Math.ceil(graphSpace.xScale.domain()[1] - graphSpace.xScale.domain()[0]));
  const tick_margin = 0.02*(graphSpace.yScale.range()[1] -graphSpace.yScale.range()[0] )
  console.log(graphSpace.xScale.domain()[1], graphSpace.xScale.domain()[0])
  graph.append('g')
    .selectAll('line.grids')
    .data(xticks)
    .join('line')
    .attr('class', 'grid')
    .attr('x1', (d) => graphSpace.xScale(d))
    .attr('x2', (d) => graphSpace.xScale(d))
    .attr('y1', -tick_margin)
    .attr('y2', graphSpace.dimensions.height-graphSpace.margin.bottom-graphSpace.margin.top+tick_margin)
    .attr('stroke', '#5a5b5c');

  graph
    .selectAll('text.xtick')
    .data(xticks)
    .join('text')
    .attr('class', 'xtick')
    .attr('x', (d) => graphSpace.xScale(d))
    .attr('y', graphSpace.dimensions.height-graphSpace.margin.bottom-graphSpace.margin.top+15)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 12)
    .attr('fill', (d) => (d.valueOf() > 0)? handVecColor : (d.valueOf() < 0)? autoVecColor : '#000000')
    .text((d) => `x${(Math.abs(d)).toLocaleString()}`);


  // graph_background(svgSel, graphSpace);
  graph.append('g')
    .selectAll('rect')
    .data(Object.entries(data))
    .join('rect')
    .attr('y', (d) => graphSpace.yScale(d[0]) ?? 0)
    .attr('x', (d) => graphSpace.xScale(-d[1].autoVect))
    .attr('height', graphSpace.yScale.bandwidth())
    .attr('width', (d) => graphSpace.xScale(0) - graphSpace.xScale(-d[1].autoVect))
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
    });

  // graph_background(svgSel, graphSpace);
  graph.append('g')
    .selectAll('rect')
    .data(Object.entries(data))
    .join('rect')
    .attr('y', (d) => graphSpace.yScale(d[0]) ?? 0)
    .attr('x', graphSpace.xScale(0))
    .attr('height', graphSpace.yScale.bandwidth())
    // .attr('width', (d) => graphSpace.xScale(graphSpace.xScale.domain()[1]) - graphSpace.xScale(0))
    .attr('width', (d) => graphSpace.xScale(d[1].handVect) - graphSpace.xScale(0))
    .attr('fill', (d) => d[0] === selected ? handVecColorLight : handVecColor)
    .attr('stroke', () => (true ? '#111827' : 'transparent'))
    .attr('stroke-width', 2)
    .on('mouseover', (_event, d) => {
      if (onHover && selected != d[0]) {
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
    });

  graph
    .selectAll('text.xlabel')
    .data(Object.entries(data))
    .join('text')
    .attr('class', 'xlabel')
    .attr('x', graphSpace.xScale.range()[0] - 40)
    .attr('y', (d) => (graphSpace.yScale(d[0]) ?? 0) + graphSpace.yScale.bandwidth() / 2)
    .attr('font-size', 15)
    .text((d) => d[0])
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle');

  graph
    .append('text')
    .attr('x', (graphSpace.xScale.range()[0] * 2 + graphSpace.xScale(0)) / 4)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', autoVecColor)
    .text('Auto Vectorized Speedup');

  graph
    .append('text')
    .attr('x', (graphSpace.xScale.range()[1] * 2 + graphSpace.xScale(0)) / 4)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', handVecColor)
    .text('Hand Vectorized Speedup');

  graph
    .append('text')
    .attr('x', (graphSpace.xScale.range()[1] + graphSpace.xScale.range()[0]) / 2)
    .attr('y', graphSpace.yScale.range()[1]+40)
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .text('Performance Ratio Against Scalarized Version');



}





// interface Trial {
//   by_type: {[type: string]: number[]},
// };



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


export function ProjectIteration() {

  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();
  


  // Data values
  const [opClasses, setOpClasses] = useState<OpClass[] | null>(null)
  const [data, setData] = useState<Data>({});

  // const [filteredData, setFilteredData] = useState<StudentRecord[]> ([]);
  // const [unis, setUnis] = useState<string[]> (["Combined"]);

  // const [xAxis, setXAxis] = useState<XAxis>('changeInGPA');

  const [toolTip, setToolTip] = useState<BarToolTip | null>(null);
  const [lineToolTip, setLineToolTip] = useState<LineToolTip|null>(null);

  const [workingPath, setWorkingPath] = useState<string[]>([]);
  const [useLineChart, setUseLineChart] = useState<boolean>(false);
  const [selectEntry, setSelectEntry] = useState<Entry | null>(null);


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
                    type: row.type,
                    size: parseInt(row.size),
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



  // Combine Data to approximate over types
  useEffect(() => {
    setData(() => {
      const combinedData: Data = {};
      if (workingPath.length === 0) { // Show all op classes
        for (const opClass of opClasses || []) {
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

      return combinedData;
    });
  }, [opClasses, workingPath]);

  useEffect(() => {
    console.log("seting entry");
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
    const opGroup = (opClass.children as EntryGroup[]).find((og) => og.name === workingPath[1]);
    if (!opGroup) {
      setSelectEntry(null);
      return;
    }
    const entry = opGroup.children.find((oc) => oc.name === workingPath[2]) ?? null;
    console.log("set entry:", entry);
    setSelectEntry(entry);
  }, [opClasses, useLineChart, workingPath]);


  // Get graph dimensions and aspects -----------------------------------------
  const spacing_gap = 0;
  const svg_dim: Dimensions = useMemo(() => {
    return {
      width: dimensions.width * 0.75,
      height: Math.min(dimensions.height * 0.6, dimensions.width * 0.8),
    }
  }, [dimensions]);

  const right_tip_dim: Dimensions = useMemo(() => {
    return {
      width: dimensions.width - svg_dim.width - spacing_gap,
      height: Math.min(dimensions.height * 0.6, dimensions.width * 0.8)
    }
  }, [dimensions, svg_dim]);

  const barChartSpace: GraphSpace = useMemo(() => {
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
    var handMax = (d3.max(selectEntry.data, (d) => d.scalar_cpu_time / d.hand_vectorized_cpu_time) ?? 0);
    var autoMax = (d3.max(selectEntry.data, (d) => d.scalar_cpu_time / d.llvm_auto_cpu_time) ?? 0);
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
    console.log("using bar chart, selected", toolTip? toolTip.operation : "");
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
    const opGroup = (opClass.children as EntryGroup[]).find((og) => og.name === workingPath[1]);
    if (!opGroup) return;
    const entry = opGroup.children.find((oc) => oc.name === workingPath[2]);
    if (!entry) return;
    console.log("Creating line chart");
    const selectSize = (lineToolTip)? lineToolTip.size : 20;
    LineGraph(svg, entry, LineGraphSpace, selectSize, setLineToolTip);
  }, [useLineChart, LineGraphSpace, opClasses, workingPath, lineToolTip])

  return (

    <div ref={divRef} className="relative flex h-full w-full flex-row shaded-box">

      <div className="flex flex-col gap-0 p-0 w-full">

        {/* Header showing current path in data */}
        <header className="w8-header">
          <p className="w8-eyebrow">Comparison of Vectorization on the Eigen Library Benchmark</p>
          <h1>Performance Ratio of Hand- and Auto-Vectorized Against Non-Vectorized</h1>
          <p>Performance Ratio Against Non Vectorized Code</p>
        </header>

        <div className="flex shrink-0 flex-row gap-0 bg-gray-300 p-0 text-left font-bold w-full">
          <div key="All" className="flex flex-row gap-1">
            <button
              className="bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400"
              style={{borderLeft: "solid"}}
              onClick={() => {
                setWorkingPath([]);
              }}
            >
              {"All"}
            </button>
            {/* {index < workingPath.length - 1 && <span className="text-gray-500"></span>} */}
          </div>
          {workingPath.map((path, index) => (
            <div key={index} className="flex flex-row gap-0">
              <button
                className="bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400"
                style={{borderLeft: "solid"}}
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
              <div><strong>Hand Vectorized Speedup:</strong> {toolTip.handVect.toFixed(2)}x</div>
              <div><strong>Auto Vectorized Speedup:</strong> {toolTip.autoVect.toFixed(2)}x</div>
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