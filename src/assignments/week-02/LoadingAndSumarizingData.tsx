import { useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';


export function useDimensions() {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const div = ref.current;
    if (!div) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });

    observer.observe(div);
    return () => observer.disconnect();
  }, []);

  return { ref, dimensions };
}

interface Summary {
  rows: number;
  columns: number;
}

interface Row {
  university: string;
  gender: string;
  first_generation: boolean;
  underrepresented: boolean;
  avg_sleep_hours: number;
  term_gpa: number;
  gpa_change: number;
}

// const DATA_URL = `${import.meta.env.BASE_URL}datasets/college_sleep_and_gpa.csv`;
const DATA_URL = `${import.meta.env.BASE_URL}college_sleep_and_gpa.csv`;

const FONT_SIZE = 28;
const LINE_HEIGHT = FONT_SIZE * 1.2;

export function LoadingAndSummarizingData() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();
  const [data, setData] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(DATA_URL)
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return;
        console.log(text);

        const parsed = csvParse(text);
        console.log(parsed);
        setData(
          parsed.map((row: any) => ({
            university: row.university,
            gender: row.gender,
            first_generation: row.first_generation,
            underrepresented: row.underrepresented,
            avg_sleep_hours: row.avg_sleep_hours,
            term_gpa: row.term_gpa,
            gpa_change: row.gpa_change,
          })),
        );
        console.log(data?.length);
      })
      .catch((error) => {
        console.error('Failed to load data', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo<Summary | null>(() => {
    if (!data) return null;
    console.log(JSON.stringify(data, null, 2));
    return {
      rows: data.length,
      columns: Object.keys(data[0]).length,
    };
  }, [data]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || dimensions.width === 0 || dimensions.height === 0 || !summary) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    select(svg)
      .selectAll('text')
      .data([summary])
      .join('text')
      .attr('x', centerX)
      .attr('y', centerY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', FONT_SIZE)
      .selectAll('tspan')
      .data((d) => [`Rows: ${d.rows}`, `Columns: ${d.columns}`])
      .join('tspan')
      .attr('x', centerX)
      .attr('dy', (_d, i) => (i === 0 ? 0 : LINE_HEIGHT))
      .text((d) => d);
  }, [dimensions, summary]);

  return (
    <div ref={divRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Summary of the Palmer Penguins dataset"
      ></svg>
      <h1 className="text-3xl font-bold mb-2">
        College Student's Average Sleep
      </h1>
      <p className="mb-6">
          <strong>Rows:</strong> {data?.length}{' '}
          <strong>Columns:</strong> {Object.keys(data?.[0] || {}).length}
      </p>
    </div>


    // <div className="overflow-x-auto">
    //     <table className="border-collapse border">
    //       <thead>
    //         <tr>
    //           {columns.map((column) => (
    //             <th
    //               key={column}
    //               className="border px-3 py-2"
    //             >
    //               {column}
    //             </th>
    //           ))}
    //         </tr>
    //       </thead>

    //       <tbody>
    //         {data.slice(0, 10).map((row, index) => (
    //           <tr key={index}>
    //             {columns.map((column) => (
    //               <td
    //                 key={column}
    //                 className="border px-3 py-2"
    //               >
    //                 {row[column]}
    //               </td>
    //             ))}
    //           </tr>
    //         ))}
    //       </tbody>
    //     </table>
    //   </div>
  );
}