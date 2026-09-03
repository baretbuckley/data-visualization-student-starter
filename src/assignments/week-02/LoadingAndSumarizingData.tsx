import { useEffect, useMemo, useRef, useState } from 'react';
// import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';
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
  if (rows.length === 0) return 0;
  const sum = rows.map((row) => row.avg_sleep_hours).reduce((acc: number, curr: number) => acc + curr, 0);
  console.log("from", typeof(sum), sum, "to");
  return Number((sum / rows.length).toFixed(2));
}

function GetUniStats(uni_name: string, students: Row[]): UniStats {
  const female_students = students.filter((row) => row.gender === "Female");
  const male_students = students.filter((row) => row.gender === "Male");
  const first_gen = students.filter((row) => row.first_generation === 1);
  const gpa_inc = students.filter((row) => row.gpa_change > 0);
  const gpa_dec = students.filter((row) => row.gpa_change < 0);

  console.log("lengths", {female: female_students.length, male: male_students.length, first_get: first_gen, gpa_inc: gpa_inc, gpa_dec: gpa_dec}, students);

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
  // const svgRef = useRef<SVGSVGElement>(null);
  // const { ref: divRef, dimensions } = useDimensions();
  const [data, setData] = useState<Row[]>([]);
  // const [universities, setUniversities] = useState<string[]>([]);
  const statCols = ["university", "all students", "female students", "male students", "first gen students", "increased GPA", "decreased GPA"];
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
    
    //  ref={divRef}
    <div className="relative w-full h-full">
      
      {/* <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Summary of the Palmer Penguins dataset"
      ></svg> */}

      <h1 className="text-3xl font-bold mb-2">
        College Student's Average Sleep
      </h1>
      <p className="mb-6">
        <strong>Rows:</strong> {data?.length}{' '}
        <strong>Columns:</strong> {Object.keys(data?.[0] || {}).length}
      </p>
      {/* <h2 className="text-3xl font-bold mb-2">
        Average Student's Sleep
      </h2>
      <p className="mb-6">
        <strong>All Students</strong> ( {stats.length} ): {avg_sleep(data || [])}
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
      </table>*/}

      <h2 className="text-3xl font-bold mb-2">
        Average Student's Sleep
      </h2>

      <div className="overflow-x-auto">
         <table className="border-collapse border">
           <thead>
             <tr>
               {statCols.map((col) => (
                 <th
                   key={col}
                   className="border px-3 py-2"
                 >
                   {col}
                 </th>
               ))}
             </tr>
           </thead>

            <tbody>
            {stats.map((stat, index) => (
              <tr key={index}>

                <td
                  key={statCols[0]}
                  className="border px-3 py-2"
                >
                  {stat.university}
                </td>

                <td
                  key={statCols[1]}
                  className="border px-3 py-2"
                >
                  {stat.student_avg} ( {stat.student_cnt} )
                </td>

                <td
                  key={statCols[2]}
                  className="border px-3 py-2"
                >
                  {stat.female_avg} ( {stat.female_cnt} )
                </td>

                <td
                  key={statCols[3]}
                  className="border px-3 py-2"
                >
                  {stat.male_avg} ( {stat.male_cnt} )
                </td>

                <td
                  key={statCols[4]}
                  className="border px-3 py-2"
                >
                  {stat.first_gen_avg} ( {stat.first_gen_cnt} )
                </td>

                <td
                  key={statCols[5]}
                  className="border px-3 py-2"
                >
                  {stat.gpa_inc_avg} ( {stat.gpa_inc_cnt} )
                </td>

                <td
                  key={statCols[6]}
                  className="border px-3 py-2"
                >
                  {stat.gpa_dec_avg} ( {stat.gpa_dec_cnt} )
                </td>


              </tr>
            ))}
          </tbody>


         </table>
       </div>

    </div>
     
  );
}