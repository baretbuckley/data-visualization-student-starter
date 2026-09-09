import { useEffect, useState, useRef } from 'react';
// import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';
import { scaleLinear } from 'd3-scale';
// import { scaleBand, scaleLinear } from 'd3-scale';
// import { max } from 'd3-array';
import { select } from 'd3-selection';
import { useDimensions } from './useDimensions';

// import { keys } from 'ts-transformer-keys';




// interface Summary {
//   rows: number;
//   columns: number;
// }

interface Row {
  avg_sleep_hours: number;
  gpa_change: number;
}



const DATA_URL = `${import.meta.env.BASE_URL}college_sleep_and_gpa.csv`;

// const FONT_SIZE = 28;
// const LINE_HEIGHT = FONT_SIZE * 1.2;

// function BarChart({ data }: { data: UniStats[] }) {
//   const svgRef = useRef<SVGSVGElement>(null);
//   const width = 500;
//   const height = 350;
//   const margin = { top: 20, right: 20, bottom: 10, left: 60 };

//   useEffect(() => {
//     const svg = svgRef.current;
//     if (!svg || data.length === 0) return;

//     const xScale = scaleBand()
//       .domain(data.map((d) => d.university))
//       .range([margin.left, width - margin.right])
//       .padding(0.3);
    
//     const yScale = scaleLinear()
//       .domain([0, max(data, (d) => d.student_avg) ?? 0])
//       .nice()
//       .range([height - margin.bottom, margin.top]);

//     const svgSel = select(svg);
//     svgSel.selectAll('*').remove()

//     const ticks = yScale.ticks(5);
//     svgSel
//       .selectAll('line.grid')
//       .data(ticks)
//       .join('line')
//       .attr('class', 'grid')
//       .attr('x1', margin.left)
//       .attr('x2', width-margin.right)
//       .attr('y1', (d) => yScale(d))
//       .attr('y2', (d) => yScale(d))
//       .attr('stroke', '#e5e7eb');

//     svgSel
//       .selectAll('text.ytick')
//       .data(ticks)
//       .join('text')
//       .attr('class', 'ytick')
//       .attr('class', 'ytick')
//       .attr('x', margin.left - 10)
//       .attr('y', (d) => yScale(d))
//       .attr('font-size', 12)
//       .text((d) => d.toLocaleString());

//       svgSel
//         .selectAll('rect')
//         .data(data)
//         .join('rect')
//         .attr('x', (d) => xScale(d.university) ?? 0)
//         .attr('y', (d) => yScale(d.student_avg))
//         .attr('width', xScale.bandwidth())
//         .attr('height', (d) => height - margin.bottom - yScale(d.student_avg))
//         .attr('fill', (d) => '#000')

//   }, [data]);
//   return <svg ref={svgRef} width={width} height={height} role="img" aria-label="test barchart" />
// }

interface DataPoint {
  x: number;
  y: number;
}



export function FirstVisualization() {
  // const svgRef = useRef<SVGSVGElement>(null);
  // const { ref: divRef, dimensions } = useDimensions();
  const [data, setData] = useState<Row[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();
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
          parsed.map((row: any) => ({
            avg_sleep_hours: parseFloat(row.avg_sleep_hours),
            gpa_change: parseFloat(row.gpa_change),
          })),
        );
      })
      .catch((error) => {
        console.error('Failed to load data', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);



  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || dimensions.width === 0 || dimensions.height === 0) return;

    
    console.log(data);

    const svgSel = select(svg);
    svgSel.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };

    const xScale = scaleLinear().domain([-2, 2]).range([margin.left, dimensions.width - margin.right]);

    const yScale = scaleLinear().domain([10, 0]).range([margin.top, dimensions.height-margin.bottom]);

    const ticks = yScale.ticks(5);
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
      .attr('font-size', 12)
      .text((d) => d.toLocaleString());

    const xticks = xScale.ticks(5);
    
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
      .attr('font-size', 12)
      .text((d) => d.toLocaleString());

    svgSel
      .selectAll('text.xtick')
      .data(xticks)
      .join('text')
      .attr('class', 'xtick')
      .attr('x', (d) => xScale(d))
      .attr('y', dimensions.height-margin.bottom+10)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 12)
      .text((d) => d.toLocaleString());

    svgSel
      .selectAll('text.ylabel')
      .data(["Average Hours Slept"])
      .join('text')
      .attr('class', 'ylabel')
      .attr('transform', `rotate(-90, ${margin.left - 10}, ${yScale(5)})`)
      .attr('x', margin.left-10)
      .attr('y', yScale(5)-25)
      .attr('font-size', 20)
      .text((d) => d.toLocaleString())
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');

    svgSel
      .selectAll('text.xlabel')
      .data(["Change in GPA (4.0 scale)"])
      .join('text')
      .attr('class', 'xlabel')
      .attr('x', xScale(0))
      .attr('y', dimensions.height-margin.bottom + 30)
      .attr('font-size', 20)
      .text((d) => d.toLocaleString())
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');

    svgSel
      .selectAll('circle')
      .data(data.map((d) => ({x: d.gpa_change, y: d.avg_sleep_hours})))
      .join('circle')
      .attr('cx', (d: DataPoint) => xScale(d.x))
      .attr('cy', (d: DataPoint) => yScale(d.y))
      .attr('r', 4)
      .attr('stroke', '#5a5b5c')
      .attr('fill', '#fa5a5a');



  }, [dimensions, data]);

  return (
    <div ref={divRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Responsive scatter plot showing 6 data points"
      ></svg>
    </div>
     
  );
}