import { useEffect, useMemo, useState, useRef } from 'react';
import * as d3 from "d3";
// import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';
import { scaleLinear, type ScaleLinear } from 'd3-scale';
// import { scaleBand, scaleLinear } from 'd3-scale';
// import { max } from 'd3-array';
import { select } from 'd3-selection';
import { useDimensions } from './useDimensions';
// import { min } from 'd3';
import { hexbin } from 'd3-hexbin';

// import { keys } from 'ts-transformer-keys';




// interface Summary {
//   rows: number;
//   columns: number;
// }

interface Dimensions {
  width: number;
  height: number;
}

interface StudentRecord {
  university: String;
  gender: string;
  firstGeneration: boolean;
  avgSleepHours: number;
  changeInGPA: number;
  priorGPA: number;
  termGPA: number;
}

type GenderFilter = "Female" | "Male" | "All";
const genderOptions = ["All", "Female", "Male"];
function strAsGender(str: string): GenderFilter {
  switch (str) {
    case "Female": return "Female";
    case "Male": return "Male";
    case "All": return "All";
    default: return "All";
  }
}
type FirstGenerationFilter = "Yes" | "No" | "All";
const firstGenOptions = ["All", "Yes", "No"];
function strAsFirstGen(str: string): FirstGenerationFilter {
  switch (str) {
    case "Yes": return "Yes";
    case "No": return "No";
    case "All": return "All";
    default: return "All";
  }
}

interface StudentFilter {
  uni: string;
  gender: GenderFilter;
  firstGen: FirstGenerationFilter;
}
function updateUni(filter: StudentFilter, uni: string): StudentFilter {
  return {
    uni: uni,
    gender: filter.gender,
    firstGen: filter.firstGen,
  }
}
function updateGender(filter: StudentFilter, gender: GenderFilter): StudentFilter {
  return {
    uni: filter.uni,
    gender: gender,
    firstGen: filter.firstGen,
  }
}
function updateFirstGen(filter: StudentFilter, firstGen: FirstGenerationFilter): StudentFilter {
  return {
    uni: filter.uni,
    gender: filter.gender,
    firstGen: firstGen,
  }
}

type XAxis = "changeInGPA" | "priorGPA" | "termGPA";

interface AxisConfig {
  label: string;
  domain: [number, number];
}
const X_AXIS_CONFIG: Record<XAxis, AxisConfig> = {
  changeInGPA: {
    label: "Change in GPA",
    domain: [-2, 2],
  },
  priorGPA: {
    label: "Prior GPA",
    domain: [0, 4],
  },
  termGPA: {
    label: "Term GPA",
    domain: [0, 4],
  },
} 


interface Margin {
  top: number;
  right: number; 
  bottom: number; 
  left: number;
}


// Interactive mouse tool tip
interface ToolTip {
  pos: [number, number];
  value: [number, number];
  numStudents: number;
}





const DATA_URL = `${import.meta.env.BASE_URL}college_sleep_and_gpa.csv`;



function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

interface GraphSpace {
  dimensions: Dimensions;
  margin: Margin;
  xScale: ScaleLinear<number, number, never>;
  yScale: ScaleLinear<number, number, never>;
}



interface Line {
  x_offset: number;
  y_offset: number;
  slope: number;
}
function calculateRegression(data: StudentRecord[], xAxis: XAxis): Line {
  const mean = data.reduce((acc, curr) => [acc[0] + curr[xAxis], acc[1] + curr.avgSleepHours], [0, 0]);
  const x_mean = data.length ? mean[0] / data.length : 0;
  const y_mean = data.length ? mean[1] / data.length : 0;
  const denominator = data.reduce((acc, curr) => acc + (curr[xAxis] - x_mean) ** 2, 0);
  const slope = denominator
    ? data.reduce(
        (acc, curr) => acc + (curr[xAxis] - x_mean) * (curr.avgSleepHours - y_mean),
        0,
      ) / denominator
    : 0;
  
  return {
    x_offset: x_mean,
    y_offset: y_mean,
    slope: slope,
  };
}

function HexbinPlot(svg: SVGSVGElement | null, data: StudentRecord[], graphSpace: GraphSpace, xAxis: XAxis, onMouse: (values: ToolTip|null) => void) {
  const svgSel = select(svg);
  svgSel.selectAll('*').remove()

  const dimensions = graphSpace.dimensions
  const margin = graphSpace.margin
  const xScale = graphSpace.xScale
  const yScale = graphSpace.yScale



  // Calc line of best fit
  const best_fit = calculateRegression(data, xAxis)

  const tick_count = 5;
  const tick_font_size = 12;
  const label_font_size = 20;

  const ticks = yScale.ticks(tick_count);
  svgSel
    .selectAll('line.grid')
    .data(ticks)
    .join('line')
    .attr('class', 'grid')
    .attr('x1', margin.left)
    .attr('x2', dimensions.width-margin.right)
    .attr('y1', (d) => yScale(d))
    .attr('y2', (d) => yScale(d))
    .attr('stroke', '#5a5b5c');

  svgSel
    .selectAll('text.ytick')
    .data(ticks)
    .join('text')
    .attr('class', 'ytick')
    .attr('x', margin.left - 10)
    .attr('y', (d) => yScale(d))
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', tick_font_size)
    .text((d) => d.toLocaleString());

  const xticks = xScale.ticks(tick_count);
  svgSel
    .selectAll('line.grids')
    .data(xticks)
    .join('line')
    .attr('class', 'grid')
    .attr('x1', (d) => xScale(d))
    .attr('x2', (d) => xScale(d))
    .attr('y1', margin.top)
    .attr('y2', dimensions.height-margin.bottom)
    .attr('stroke', '#5a5b5c');
  svgSel
    .selectAll('text.xtick')
    .data(xticks)
    .join('text')
    .attr('class', 'xtick')
    .attr('x', (d) => xScale(d))
    .attr('y', dimensions.height-margin.bottom+10)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', tick_font_size)
    .text((d) => d.toLocaleString());

  svgSel
    .selectAll('text.ylabel')
    .data(["Average Hours Slept"])
    .join('text')
    .attr('class', 'ylabel')
    .attr('transform', `rotate(-90, ${margin.left - 10}, ${yScale(5)})`)
    .attr('x', margin.left-10)
    .attr('y', yScale(5)-25)
    .attr('font-size', label_font_size)
    .text((d) => d.toLocaleString())
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle');

  svgSel
    .selectAll('text.xlabel')
    .data([X_AXIS_CONFIG[xAxis].label])
    .join('text')
    .attr('class', 'xlabel')
    .attr('x', xScale(0))
    .attr('y', dimensions.height-margin.bottom + 30)
    .attr('font-size', label_font_size)
    .text((d) => d.toLocaleString())
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle');


  const hexbinGenerator = hexbin<
    [number, number]
  >()
    .radius(20)
    .extent([
      [margin.left, margin.top],
      [dimensions.width - margin.right, dimensions.height - margin.bottom],
    ]);

  const hexData = hexbinGenerator(
    data.map((row) => [xScale(row[xAxis]), yScale(row.avgSleepHours)] as [number, number]),
  );

  
  svgSel
    .selectAll('path.hexbin')
    .data(hexData)
    .join('path')
    .attr('class', 'hexbin')
    .attr('d', () => hexbinGenerator.hexagon())
    .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
    .attr('fill', (d) => {
      const intensity = Math.min(1, d.length / (d3.max(d3.map(hexData, (d) => d.length)) ?? 1));
      // return d3.interpolateRgbBasis(['#f3e8ff', '#c084fc', '#7c3aed'])(intensity);
      return d3.interpolateRgbBasis(['#f3e8ff', '#64398e', '#6c3dbe'])(intensity);
    })
    .attr('opacity', 0.8)
    .attr('stroke', '#4c1d95')
    .attr('stroke-width', 0.8)
    .on('mouseenter', function (event, d) {
      // select(this).attr('stroke-width', 2.8);
      select(this).attr('stroke', '#000000');
      select(this).attr('opacity', 1);
      onMouse({
        pos: [event.clientX, event.clientY], 
        value:[xScale.invert(d.x), yScale.invert(d.y)],
        numStudents: d.length,
      });
    })
    .on('mousemove', function (event, d) {

      onMouse({
        pos: [event.clientX, event.clientY], 
        value:[xScale.invert(d.x), yScale.invert(d.y)],
        numStudents: d.length,
      });
    })
    .on('mouseleave', function (event, d) {
      select(this).attr('stroke', '#4c1d95');
      select(this).attr('opacity', 0.8);

      onMouse(null);
    });


  // Line of best fit: y = y_mean + slope * (x - x_mean)
  const [xStart, xEnd] = xScale.domain()
  svgSel
    .append('line')
    .attr('class', 'best-fit-line')
    .attr('x1', xScale(xStart))
    .attr('x2', xScale(xEnd))
    .attr('y1', yScale(best_fit.y_offset + best_fit.slope * (xStart - best_fit.x_offset)))
    .attr('y2', yScale(best_fit.y_offset + best_fit.slope * (xEnd - best_fit.x_offset)))
    .attr('stroke', '#2166ac')
    .attr('stroke-width', 2);

}













export function InteractiveVis() {

  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();

  
  // Data values
  const [data, setData] = useState<StudentRecord[]> ([]);
  const [filter, setFilter] = useState<StudentFilter> ({
    uni: "Combined",
    gender: "All",
    firstGen: "All",
  });
  const [filteredData, setFilteredData] = useState<StudentRecord[]> ([]);
  const [unis, setUnis] = useState<string[]> (["Combined"]);

  const [xAxis, setXAxis] = useState<XAxis>('changeInGPA');

  const [toolTip, setToolTip] = useState<ToolTip|null>(null);




  // Process data

  // Read in csv into data
  useEffect(() => {
    let cancelled = false;

    fetch(DATA_URL)
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return;
        const parsed = csvParse(text);
        setData(
          shuffleArray(parsed.map((row: Record<string, string>): StudentRecord => ({
            university: row.university,
            gender: row.gender,
            firstGeneration: parseFloat(row.first_generation) === 1, 
            avgSleepHours: parseFloat(row.avg_sleep_hours),
            changeInGPA: (parseFloat(row.gpa_change)),
            priorGPA: parseFloat(row.prior_gpa),
            termGPA: parseFloat(row.term_gpa),
          
          }))),
        );
      })
      .catch((error) => {
        console.error('Failed to load data', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter data into (FilteredData)
  useEffect(() => {
    setFilteredData(data.filter((row: StudentRecord) =>
      (filter.uni === "Combined" || String(row.university) === filter.uni) &&
      (filter.gender === "All" || row.gender === filter.gender) &&
      (filter.firstGen === "All" || row.firstGeneration === (filter.firstGen === "Yes")),
    ));
  }, [data, filter]);

  useEffect(() => {
    setUnis([
      "Combined",
      ...Array.from(new Set(data.map(
        (row) => String(row.university)
      ))),
    ]);
  }, [data]);


  // Get graph dimensions and aspects -----------------------------------------
  const svg_dim: Dimensions = useMemo(() => {
    return {
      width: dimensions.width / 2,
      height: Math.min(dimensions.height, dimensions.width/2),
    }
  }, [dimensions]);

  const graphSpace: GraphSpace = useMemo(() => {
    
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    const xScale = scaleLinear()
      .domain(X_AXIS_CONFIG[xAxis].domain)
      .range([margin.left, svg_dim.width - margin.right]);
    const yScale = scaleLinear()
      .domain([10, 0])
      .range([margin.top, svg_dim.height-margin.bottom]);
    
    return {
      dimensions: svg_dim,
      margin,
      xScale,
      yScale,
    };
  }, [svg_dim, xAxis]);





  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || svg_dim.width === 0 || svg_dim.height === 0) return;
    

    HexbinPlot(svg, filteredData, graphSpace, xAxis, setToolTip);
  }, [svg_dim, filteredData, xAxis, graphSpace]);

  return (
    <div ref={divRef} className="relative flex h-full w-full flex-row">

      {toolTip && (
          <div className="rounded border" style={{position: 'fixed', left: toolTip.pos[0] + 10, top: toolTip.pos[1] + 10, background: 'gray', color: 'white', padding: '5px'}}>
              <div>Average Sleep: {toolTip.value[1].toFixed(1)}</div>
              <div>{X_AXIS_CONFIG[xAxis].label}: {toolTip.value[0].toFixed(2)}</div>
              <div>Number of Students: {toolTip.numStudents}</div>
          </div>
      )}


      <div>
        <svg
          ref={svgRef}
          width = {svg_dim.width.toString()}
          className="h-full"
          role="img"
          aria-label="Responsive scatter plot showing 6 data points"
        >
        </svg>

      </div>
      



      <label className="flex shrink-0 flex-col gap-2">
          
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
            value={X_AXIS_CONFIG[xAxis].label}
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


        </label>

    </div>
     
  );
}