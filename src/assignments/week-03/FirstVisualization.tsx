import { useEffect, useMemo, useRef, useState } from 'react';
// import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { select } from 'd3-selection';
// import { keys } from 'ts-transformer-keys';



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

// interface Summary {
//   rows: number;
//   columns: number;
// }

interface Row {
  university: string;
  gender: string;
  first_generation: number;
  avg_sleep_hours: number;
  term_gpa: number;
  gpa_change: number;
}

interface UniStats {
  university: string;
  student_avg: number;
  student_cnt: number;
}

function avg_sleep(rows: Row[]) {
  if (rows.length === 0) return 0;
  const sum = rows.map((row) => row.avg_sleep_hours).reduce((acc: number, curr: number) => acc + curr, 0);
  console.log("from", typeof(sum), sum, "to");
  return Number((sum / rows.length).toFixed(2));
}

function GetUniStats(uni_name: string, students: Row[]): UniStats {
  // const female_students = students.filter((row) => row.gender === "Female");
  // const male_students = students.filter((row) => row.gender === "Male");
  // const first_gen = students.filter((row) => row.first_generation === 1);
  // const gpa_inc = students.filter((row) => row.gpa_change > 0);
  // const gpa_dec = students.filter((row) => row.gpa_change < 0);

  // console.log("lengths", {female: female_students.length, male: male_students.length, first_get: first_gen, gpa_inc: gpa_inc, gpa_dec: gpa_dec}, students);

  return {
    university: uni_name,
    student_avg: avg_sleep(students),
    student_cnt: students.length,
    // female_avg: avg_sleep(female_students),
    // female_cnt: female_students.length,
    // male_avg: avg_sleep(male_students),
    // male_cnt: male_students.length,
    // first_gen_avg: avg_sleep(first_gen),
    // first_gen_cnt: first_gen.length,
    // gpa_inc_avg: avg_sleep(gpa_inc),
    // gpa_inc_cnt: gpa_inc.length,
    // gpa_dec_avg: avg_sleep(gpa_dec),
    // gpa_dec_cnt: gpa_dec.length,
  };
}

// const DATA_URL = `${import.meta.env.BASE_URL}datasets/college_sleep_and_gpa.csv`;
const DATA_URL = `${import.meta.env.BASE_URL}college_sleep_and_gpa.csv`;

// const FONT_SIZE = 28;
// const LINE_HEIGHT = FONT_SIZE * 1.2;


const STATUS_COLORS: Record<string, string> = {
  Unbanked: '#dc2626',
  Underbanked: '#f59e0b',
  'Fully Banked': '#16a34a',
};

function BarChart({ data }: { data: UniStats[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 500;
  const height = 350;
  const margin = { top: 20, right: 20, bottom: 10, left: 60 };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || data.length === 0) return;

    const xScale = scaleBand()
      .domain(data.map((d) => d.university))
      .range([margin.left, width - margin.right])
      .padding(0.3);
    
    const yScale = scaleLinear()
      .domain([0, max(data, (d) => d.student_avg) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const svgSel = select(svg);
    svgSel.selectAll('*').remove()

    const ticks = yScale.ticks(5);
    svgSel
      .selectAll('line.grid')
      .data(ticks)
      .join('line')
      .attr('class', 'grid')
      .attr('x1', margin.left)
      .attr('x2', width-margin.right)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#e5e7eb');

    svgSel
      .selectAll('text.ytick')
      .data(ticks)
      .join('text')
      .attr('class', 'ytick')
      .attr('class', 'ytick')
      .attr('x', margin.left - 10)
      .attr('y', (d) => yScale(d))
      .attr('font-size', 12)
      .text((d) => d.toLocaleString());

      svgSel
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', (d) => xScale(d.university) ?? 0)
        .attr('y', (d) => yScale(d.student_avg))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => height - margin.bottom - yScale(d.student_avg))
        .attr('fill', (d) => STATUS_COLORS[d.university] ?? '#888')

  }, [data]);
  return <svg ref={svgRef} width={width} height={height} role="img" aria-label="test barchart" />
}



export function FirstVisualization() {
  // const svgRef = useRef<SVGSVGElement>(null);
  // const { ref: divRef, dimensions } = useDimensions();
  const [data, setData] = useState<Row[]>([]);
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
            university: row.university,
            gender: row.gender,
            first_generation: parseInt(row.first_generation),
            avg_sleep_hours: parseFloat(row.avg_sleep_hours),
            term_gpa: parseFloat(row.term_gpa),
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

  const stats = useMemo<UniStats[]>(() => {
    if (data.length === 0) return [];
    const unis = Array.from(new Set(data.map(item => item.university)).add("Total"));
    // setUniversities(unis);)
    return unis.map((uni) => {
      if (uni === "Total") {
        return GetUniStats(uni, data);
      }
      const tmp = GetUniStats(uni, data.filter((row) => row.university === uni));
      // console.log(tmp);
      return tmp;
    })
  }, [data]);

  return (
    <div className="p-6 max-w-2xl w-full overflow-y-auto h-full">
      <h1 className="text-2xl font-bold mb-1">First Visual: Banking Status Counts</h1>
      <p className="text-gray-600 mb-6">
        A simple bar chart showing how many of the 10,000 sampled households fall into each banking status
        category.
      </p>
      <BarChart data={stats} />
    </div>
     
  );
}