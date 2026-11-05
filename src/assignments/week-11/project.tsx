import { useEffect, useMemo, useState, useRef } from 'react';
import * as d3 from "d3";
import { csvParse } from 'd3-dsv';
import { scaleBand, scaleLinear } from 'd3-scale';
import { useDimensions } from './useDimensions';

import * as Data from './data';
import type { BarChartData, BarToolTip } from './barChart';
import { BarChart } from './barChart';
import { LineGraph, type LineGraphData, type LineToolTip } from './lineGraph';
import { MultiOpLineGraph } from './multiOpLineGraph';
import type { BarChartSpace, LineGraphSpace, Dimensions } from './graphSpace';
import { workingPathHeader } from './workingPathHeader';
import { displayHelpMenue, infoButton } from './helpMenue';
import { DARK_MODE, DARK_MODE_DEFAULT_GRAPH, LIGHT_MODE, type Config } from './config';
import { buildComparisonSeries } from './projectComparison';
import { loadOpClasses } from './projectData';


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

export function ProjectSecondAddedInteraction() {

  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();

  const [opClasses, setOpClasses] = useState<Data.OpClass[] | null>(null)
  const [data, setData] = useState<BarChartData>({});

  const [toolTip, setToolTip] = useState<BarToolTip | null>(null);
  const [lineToolTip, setLineToolTip] = useState<LineToolTip|null>(null);

  const [workingPath, setWorkingPath] = useState<string[]>([]);
  const [useLineChart, setUseLineChart] = useState<boolean>(false);
  const [selectEntry, setSelectEntry] = useState<Data.Entry | null>(null);

  const [helpMenuePressed, setHelpMenuePressed] = useState<boolean>(false)

  const [config, setConfig] = useState<Config>({siteColors: DARK_MODE, graphColors: DARK_MODE_DEFAULT_GRAPH});

  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareOps, setCompareOps] = useState<string[][]>([]);

  const toggleTheme = () => {
    setConfig((current) => ({
      siteColors: current.siteColors === DARK_MODE ? LIGHT_MODE : DARK_MODE,
      graphColors: current.graphColors,
    }));
  };

  useEffect(() => {
    if (workingPath.length === 3) {
      setUseLineChart(true);
      setToolTip(null);
    } else {
      setUseLineChart(false);
      setLineToolTip(null);
    }

    if (workingPath.length !== 2) {
      setCompareMode(false);
    }
  }, [workingPath]);


  useEffect(() => {
    let cancelled = false;

    async function fetchOpClasses() {
      const classes = await loadOpClasses();
      if (!cancelled) {
        setOpClasses(classes);
      }
    }

    void fetchOpClasses();

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

  const comparisonSeries = useMemo(() => {
    return buildComparisonSeries(opClasses, workingPath, compareMode, compareOps);
  }, [opClasses, compareMode, compareOps, workingPath]);


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
    const margin = { top: 60, right: 10, bottom: 30, left: 200 };
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

  const compareLineGraphSpace: LineGraphSpace = useMemo(() => {
    const margin = { top: 50, right: 5, bottom: 50, left: 60 };
    const allValues = Object.values(comparisonSeries).flatMap((series) => series);
    const maxAbsY = d3.max(allValues.flatMap((point) => [Math.abs(point.hand), Math.abs(point.auto)])) ?? 1;
    const maxSize = d3.max(allValues, (point) => point.size) ?? 1;
    const minSize = d3.min(allValues, (point) => point.size) ?? 0;

    const yScale = scaleLinear()
      .domain([-maxAbsY, maxAbsY])
      .range([svg_dim.height - margin.top - margin.left, 0]);

    const xScale = scaleLinear()
      .domain([minSize, maxSize])
      .range([0, svg_dim.width - margin.right - margin.left]);

    return {
      dimensions: svg_dim,
      margin: margin,
      xScale: xScale,
      yScale: yScale,
    };

  }, [svg_dim, comparisonSeries]);

  useEffect(() => {
    if (!compareMode || workingPath.length !== 2 || !opClasses) {
      setCompareOps([]);
      return;
    }

    const opClass = opClasses.find((oc) => oc.name === workingPath[0]);
    if (!opClass) return;

    const opGroup = (opClass.children as Data.EntryGroup[]).find((og) => og.name === workingPath[1]);
    if (!opGroup) return;

    setCompareOps((current) => {
      if (current.length > 0) return current;
      return opGroup.children.map((entry) => [opClass.name, opGroup.name, entry.name]);
    });
  }, [compareMode, opClasses, workingPath]);


  // Bar chart
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || svg_dim.width === 0 || svg_dim.height === 0) return;
    if (useLineChart) return;
    if (compareMode) return;
    // if (compareMode && workingPath.length === 2 && Object.keys(comparisonSeries).length > 0) {
    //   const selectSize = 20;
    //   MultiOpLineGraph(svg, comparisonSeries, LineGraphSpace, selectSize, config, setLineToolTip);
    //   return;
    // }

    BarChart(svg, data, barChartSpace, toolTip? toolTip.operation : "", config, setToolTip, (operation) => {
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
  }, [svg_dim, barChartSpace, data, useLineChart, toolTip, config, compareMode, comparisonSeries, workingPath, LineGraphSpace]);

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
    LineGraph(svg, points, LineGraphSpace, selectSize, config, setLineToolTip);
  }, [useLineChart, LineGraphSpace, opClasses, workingPath, lineToolTip, config])

  // Compare mode line chart
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || svg_dim.width === 0 || svg_dim.height === 0) return;
    if (!compareMode || workingPath.length !== 2) return;
    if (Object.keys(comparisonSeries).length === 0) return;
    
    const selectSize = (lineToolTip)? lineToolTip.size : 20;
    MultiOpLineGraph(svg, comparisonSeries, compareLineGraphSpace, selectSize, config, setLineToolTip);
  }, [compareMode, workingPath, comparisonSeries, compareLineGraphSpace, lineToolTip, config]);

  return (

    <div ref={divRef} className="relative h-full w-full shaded-box" style={{background:config.siteColors.surface}}>

      {helpMenuePressed && (
        displayHelpMenue(config, setHelpMenuePressed)
      )}
      
      <div className="flex flex-col gap-0 p-0 w-full">

        <div 
        className="relative flex h-fit w-full flex-row"
        style={{background:config.siteColors.header, color:config.siteColors.text}}
        >
          <header className="w8-header p-2">
            <h1 className="text-2xl">Performance Ratio of Hand- and Auto-Vectorized Against Scalar Code</h1>
            <p className="w8-eyebrow">Comparison of Vectorization on the Eigen Library Benchmark</p>
          </header>

          <div className="flex w-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'right',
            paddingRight: 45,
            gap: 12,
          }}>
            {workingPath.length === 2 && (
              <button
                type="button"
                onClick={() => setCompareMode((current) => !current)}
                className="rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  background: compareMode ? config.graphColors.hand : config.siteColors.subHeader,
                  color: config.siteColors.text,
                  border: `1px solid ${config.siteColors.surfaceSecondary}`,
                  cursor: 'pointer',
                }}
                aria-label="Toggle comparing operations in this subcategory"
              >
                {compareMode ? 'Hide comparison' : 'Compare operations'}
              </button>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: config.siteColors.subHeader,
                color: config.siteColors.text,
                border: `1px solid ${config.siteColors.surfaceSecondary}`,
                cursor: 'pointer',
              }}
              aria-label="Toggle light and dark mode"
            >
              {config.siteColors === DARK_MODE ? 'Light mode' : 'Dark mode'}
            </button>
            {infoButton(45, helpMenuePressed, () => {setHelpMenuePressed(!helpMenuePressed)}, config)}
          </div>
        </div>
        

        {/* Header showing current path in data */}
        {workingPathHeader(workingPath, setWorkingPath, config)}
        


        <div 
        className='relative flex h-full w-full min-w-0 flex-row' // bg-gray-200
        style={{background:config.siteColors.surface}}
        >
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
              className="relative mt-5 min-w-0 flex-1 rounded p-2 shadow-lg"
              style={{
                height: right_tip_dim.height,
                background: config.siteColors.surfaceSecondary,
                color: config.siteColors.text,
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
              className="relative mt-5 min-w-0 flex-1 rounded p-2 shadow-lg"
              style={{
                height: right_tip_dim.height,
                background: config.siteColors.surfaceSecondary,
                color: config.siteColors.text,
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

