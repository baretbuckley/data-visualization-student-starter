import { useEffect, useMemo, useState, useRef } from 'react';
// import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';
import { scaleLinear, type ScaleLinear } from 'd3-scale';
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

interface Row {
  university: string;
  gender: string;
  first_generation: boolean;
  avg_sleep_hours: number;
  gpa_change: number;
  prior_gpa: number;
  term_gpa: number;
}

type XAxis = keyof Pick<Row, 'gpa_change' | 'prior_gpa' | 'term_gpa'>;


interface Margins {
  top: number;
  right: number; 
  bottom: number; 
  left: number;
}


const DATA_URL = `${import.meta.env.BASE_URL}college_sleep_and_gpa.csv`;



// interface Comparison {

// }

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


interface Line {
  x_offset: number;
  y_offset: number;
  slope: number;
}
function calculateRegression(data: Row[], xAxis: XAxis): Line {
  const mean = data.reduce((acc, curr) => [acc[0] + curr[xAxis], acc[1] + curr.avg_sleep_hours], [0, 0]);
  const x_mean = data.length ? mean[0] / data.length : 0;
  const y_mean = data.length ? mean[1] / data.length : 0;
  const denominator = data.reduce((acc, curr) => acc + (curr[xAxis] - x_mean) ** 2, 0);
  const slope = denominator
    ? data.reduce(
        (acc, curr) => acc + (curr[xAxis] - x_mean) * (curr.avg_sleep_hours - y_mean),
        0,
      ) / denominator
    : 0;
  
  return {
    x_offset: x_mean,
    y_offset: y_mean,
    slope: slope,
  };
}

type LinearScale = ScaleLinear<number, number, never>;
function createScales(data: Row[], dimensions: Dimensions, margin: Margins, xAxis: XAxis): [LinearScale, LinearScale] {
  const xValues = data.map((row) => row[xAxis]);
  const xMin = xValues.length ? Math.min(...xValues) : 0;
  const xMax = xValues.length ? Math.max(...xValues) : 4;
  const xPadding = xMin === xMax ? 1 : (xMax - xMin) * 0.05;
  const xScale = scaleLinear().domain([xMin - xPadding, xMax + xPadding]).range([margin.left, dimensions.width - margin.right]);

  const yScale = scaleLinear().domain([10, 0]).range([margin.top, dimensions.height-margin.bottom]);

  return [xScale, yScale];
}


function ScatterPlot(svg: SVGSVGElement | null, dimensions: Dimensions, data: Row[], xAxis: XAxis) {
  const svgSel = select(svg);
  svgSel.selectAll('*').remove()

  const margin: Margins = { top: 20, right: 20, bottom: 60, left: 60 };

  // const xValues = data.map((row) => row[xAxis]);
  // const xMin = xValues.length ? Math.min(...xValues) : 0;
  // const xMax = xValues.length ? Math.max(...xValues) : 4;
  // const xPadding = xMin === xMax ? 1 : (xMax - xMin) * 0.05;
  // const xScale = scaleLinear().domain([xMin - xPadding, xMax + xPadding]).range([margin.left, dimensions.width - margin.right]);

  // const yScale = scaleLinear().domain([10, 0]).range([margin.top, dimensions.height-margin.bottom]);

  const [xScale, yScale] = createScales(data, dimensions, margin, xAxis);

  const best_fit = calculateRegression(data, xAxis);


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
    .data([xAxis === 'gpa_change' ? "Change in GPA (4.0 scale)" : xAxis === 'prior_gpa' ? "Prior GPA" : "Term GPA"])
    .join('text')
    .attr('class', 'xlabel')
    .attr('x', xScale(0))
    .attr('y', dimensions.height-margin.bottom + 30)
    .attr('font-size', label_font_size)
    .text((d) => d.toLocaleString())
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle');

  // svgSel
  //   .selectAll('circle')
  //   .data(data)
  //   .join('circle')
  //   .attr('cx', (d) => xScale(d[xAxis]))
  //   .attr('cy', (d) => yScale(d.avg_sleep_hours))
  //   .attr('r', 4)
  //   .attr('stroke', '#5a5b5c')
  //   .attr('fill', (row) => {
  //     if (row.university == "Carnegie Mellon University") {
  //       return '#064789';
  //     } else if (row.university == "University of Washington") {
  //       return '#427aa1';
  //     } else if (row.university == "University of Notre Dame") {
  //       return '#ebf2fa';
  //     } else {
  //       return '#ffd166';
  //     }
  //   });

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


export function RevisedVisualization() {
  // const svgRef = useRef<SVGSVGElement>(null);
  // const { ref: divRef, dimensions } = useDimensions();
  const [data, setData] = useState<Row[]>([]);
  // const [displayData, setDisplayData] = useState<Row[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();
  const [selectUni, setSelectUni] = useState<string>("combined");
  const unis = [
    "combined",
    ...Array.from(new Set(data.map((row) => String(row.university)))),
  ];
  const [selectGenderFilter, GenderFilter] = useState<string>("All");
  const genders = ["All", "Male", "Female"]
  const [selectFirstGeneration, setSelectFirstGeneration] = useState<string>("All");
  const firstGenerationOptions = ["All", "Yes", "No"];
  const [xAxis, setXAxis] = useState<keyof Pick<Row, 'gpa_change' | 'prior_gpa' | 'term_gpa'>>('gpa_change');
  const xAxisOptions: Array<{ value: keyof Pick<Row, 'gpa_change' | 'prior_gpa' | 'term_gpa'>; label: string }> = [
    { value: 'gpa_change', label: 'Change in GPA' },
    { value: 'prior_gpa', label: 'Prior GPA' },
    { value: 'term_gpa', label: 'Term GPA' },
  ];
  // const [universities, setUniversities] = useState<string[]>([]);
  // const statCols = ["university", "all students", "female students", "male students", "first gen students", "increased GPA", "decreased GPA"];
  // const [uniStats, setUniStats] = useState<UniStats[]>([]);



  useEffect(() => {
    let cancelled = false;

    fetch(DATA_URL)
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return;
        const parsed = csvParse(text);
        setData(
          shuffleArray(parsed.map((row: Record<string, string>): Row => ({
            university: row.university,
            gender: row.gender,
            first_generation: parseFloat(row.first_generation) === 1,
            
            avg_sleep_hours: parseFloat(row.avg_sleep_hours),
            gpa_change: (parseFloat(row.gpa_change)),
            prior_gpa: parseFloat(row.prior_gpa),
            term_gpa: parseFloat(row.term_gpa),
          
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


  const displayData = useMemo(() => 
    data.filter((row: Row) =>
      (selectUni === "combined" || String(row.university) === selectUni) &&
      (selectGenderFilter === "All" || row.gender === selectGenderFilter) &&
      (selectFirstGeneration === "All" ||
        row.first_generation === (selectFirstGeneration === "Yes")),
    ),
  [selectUni, selectGenderFilter, selectFirstGeneration, data]);


  const svg_dim: Dimensions = useMemo(() => {
    return {
      width: dimensions.width / 2,
      height: Math.min(dimensions.height, dimensions.width/2),
    }
  }, [dimensions]);



  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || svg_dim.width === 0 || svg_dim.height === 0) return;
    
    // Create scatterplot of current data
    const scatterDim: Dimensions = {
      width: svg_dim.width,
      height: svg_dim.height,
    }
    ScatterPlot(svg, scatterDim, displayData, xAxis);
  }, [svg_dim, displayData, xAxis]);

  return (
    <div ref={divRef} className="relative flex h-full w-full flex-row">
      <svg
        ref={svgRef}
        width = {svg_dim.width.toString()}
        className="h-full"
        role="img"
        aria-label="Responsive scatter plot showing 6 data points"
      ></svg>

      <label className="flex shrink-0 flex-col gap-2">
          <h1 className="mt-4 text-xl font-bold">Student Average Sleep vs GPA</h1>
          <span className="font-bold">Filter Students</span>
          <span>X Axis:</span>
          <select
            className="max-w-full rounded border border-gray-300 p-2"
            value={xAxis}
            onChange={(event) => setXAxis(event.target.value as typeof xAxis)}
          >
            {xAxisOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span>By University:</span>
          <select
            className="max-w-full rounded border border-gray-300 p-2"  
            value={selectUni}
            onChange={(event) => setSelectUni(event.target.value)}
          >
            {unis.map((uni) => (
              <option key={uni} value={uni}>
                {uni}
              </option>
            ))}
          </select>

          <span>By Student Gender:</span>
          <div className="flex gap-4" role="group" aria-label="Filter by student gender">
            {genders.map((gender) => (
              <label key={gender} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender-filter"
                  value={gender}
                  checked={selectGenderFilter === gender}
                  onChange={(event) => GenderFilter(event.target.value)}
                />
                {gender}
              </label>
            ))}
          </div>

          <span>By First-Generation Status:</span>
          <div className="flex gap-4" role="group" aria-label="Filter by first-generation status">
            {firstGenerationOptions.map((status) => (
              <label key={status} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="first-generation-filter"
                  value={status}
                  checked={selectFirstGeneration === status}
                  onChange={(event) => setSelectFirstGeneration(event.target.value)}
                />
                {status}
              </label>
            ))}
          </div>


        </label>

    </div>
     
  );
}