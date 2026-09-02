import { useEffect, useRef, useState } from 'react';
// import { select } from 'd3-selection';
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

// interface Summary {
//   rows: number;
//   columns: number;
// }

interface Row {
  university: string;
  gender: string;
  first_generation: boolean;
  underrepresented: boolean;
  avg_sleep_hours: number;
  term_gpa: number;
  gpa_change: number;
}

interface UniStats {
  university: string;
  student_avg: number;
  student_cnt: number;
  female_avg: number;
  female_cnt: number;
  male_avg: number;
  male_cnt: number;
  first_gen_avg: number;
  first_gen_cnt: number;
  gpa_inc_avg: number;
  gpa_inc_cnt: number;
  gpa_dec_avg: number;
  gpa_dec_cnt: number;
}

function avg_sleep(rows: Row[]) {
  if (!rows || rows.length === 0) return 0;
  const sum = rows.map((row) => row.avg_sleep_hours).reduce((acc, curr) => acc + curr, 0);
  return sum / rows.length;
}

function GetUniStats(uni_name: string, students: Row[]): UniStats {
  const female_students = students.filter((row) => row.gender == "female");
  const male_students = students.filter((row) => row.gender == "male");
  const first_gen = students.filter((row) => row.first_generation == true);
  const gpa_inc = students.filter((row) => row.gpa_change > 0);
  const gpa_dec = students.filter((row) => row.gpa_change < 0);

  return {
    university: uni_name,
    student_avg: avg_sleep(students),
    student_cnt: students.length,
    female_avg: avg_sleep(female_students),
    female_cnt: female_students.length,
    male_avg: avg_sleep(male_students),
    male_cnt: male_students.length,
    first_gen_avg: avg_sleep(first_gen),
    first_gen_cnt: first_gen.length,
    gpa_inc_avg: avg_sleep(gpa_inc),
    gpa_inc_cnt: gpa_inc.length,
    gpa_dec_avg: avg_sleep(gpa_dec),
    gpa_dec_cnt: gpa_dec.length,
  };
}

// const DATA_URL = `${import.meta.env.BASE_URL}datasets/college_sleep_and_gpa.csv`;
const DATA_URL = `${import.meta.env.BASE_URL}college_sleep_and_gpa.csv`;

// const FONT_SIZE = 28;
// const LINE_HEIGHT = FONT_SIZE * 1.2;



export function LoadingAndSummarizingData() {
  const svgRef = useRef<SVGSVGElement>(null);
  // const { ref: divRef, dimensions } = useDimensions();
  const [data, setData] = useState<Row[]>([]);
  const [CMU, setCMU] = useState<Row[]>([]);
  const [uniStats, setUniStats] = useState<UniStats[]>([]);

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
            first_generation: row.first_generation,
            underrepresented: row.underrepresented,
            avg_sleep_hours: row.avg_sleep_hours,
            term_gpa: row.term_gpa,
            gpa_change: row.gpa_change,
          })),
        );
        var unis = Array.from(new Set(data.map(item => item.university)).add("Total"));
        console.log("unis", unis);

        setUniStats(
          unis.map((uni) => {
            if (uni === "Total") {
              return GetUniStats(uni, data);
            }
            return GetUniStats(uni, data.filter((row) => row.university === uni));
          })
        )
        console.log("stats:", uniStats);

        setCMU((data || []).filter((row) => {row.university == "Carnegie Mellon University"}));
        console.log(data?.length);
      })
      .catch((error) => {
        console.error('Failed to load data', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // const summary = useMemo<Summary | null>(() => {
  //   if (!data) return null;
  //   console.log(JSON.stringify(data, null, 2));
  //   return {
  //     rows: data.length,
  //     columns: Object.keys(data[0]).length,
  //   };
  // }, [data]);

  return (
    //  ref={divRef}
    <div className="relative w-full h-full">
      <h1 className="text-3xl font-bold mb-2">
        College Student's Average Sleep
      </h1>
      <p className="mb-6">
        <strong>Rows:</strong> {data?.length}{' '}
        <strong>Columns:</strong> {Object.keys(data?.[0] || {}).length}
      </p>
      <h2 className="text-3xl font-bold mb-2">
        Average Student's Sleep
      </h2>
      <p className="mb-6">
        <strong>All Students</strong> ( {data?.length} ): {avg_sleep(data || [])}
        <strong>Carnegie Mellon</strong> ( {CMU?.length} ): {avg_sleep(CMU)}
      </p>

      <table  className="border-collapse border">
        <tr>
          <th>Company</th>
          <th>Contact</th>
          <th>Country</th>
        </tr>
        <tr>
          <td>Alfreds Futterkiste</td>
          <td>Maria Anders</td>
          <td>Germany</td>
        </tr>
        <tr>
          <td>Centro comercial Moctezuma</td>
          <td>Francisco Chang</td>
          <td>Mexico</td>
        </tr>
      </table>
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