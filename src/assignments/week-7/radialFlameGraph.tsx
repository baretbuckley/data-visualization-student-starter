import { useEffect, useMemo, useState, useRef } from 'react';
import * as d3 from "d3";
// import { select } from 'd3-selection';
import { csvParse } from 'd3-dsv';
// import { scaleBand, scaleLinear } from 'd3-scale';
// import { max } from 'd3-array';
import { select } from 'd3-selection';
import { useDimensions } from './useDimensions';
// import { min } from 'd3';;

// import { keys } from 'ts-transformer-keys';




// interface Summary {
//   rows: number;
//   columns: number;
// }

interface Dimensions {
  width: number;
  height: number;
}



interface Margin {
  top: number;
  right: number; 
  bottom: number; 
  left: number;
}







const DATA_URL = `${import.meta.env.BASE_URL}puzzle_stacks.csv`;



interface GraphSpace {
  dimensions: Dimensions;
  margin: Margin;
}


interface CallFrame {
  name: string
  encounters: number, // Number of times perf encountered this call frame
  parent: CallFrame | null,
  children: { [name:string]: CallFrame },
}

// Describes data in relation to how its shown on graph
interface DataDescription {
  fnCall: CallFrame,
  depth: number,
  x0: number,
  x1: number,
}

const colors = [
  "#b90e0e",
  "#e50505",
  "#fa1717",
  "#ff490c",
  "#d37517",
  "#b90505",
]

interface DisplayTraceStep {
  name: string;
  color: string;
}

//onMouse: (values: ToolTip|null) => void
function radialFlameGraph(svg: SVGSVGElement | null, data: DataDescription[], base: CallFrame, root: CallFrame, graphSpace: GraphSpace, setWorkingPath: (values: string[]) => void, setSelectPath: (values: DisplayTraceStep[]) =>void) {

  // if (svg == null) return;

  const svgSel = select(svg);
  svgSel.selectAll('*').remove()

  
  const select_colors = data.reduce((acc, curr) => {
    acc[1][curr.fnCall.name] = colors[acc[0]];
    const next: number = (acc[0]+1) % colors.length;
    return [next,acc[1]] as [number, {[key:string]:string}];
  }, [0, {}] as [number, {[key:string]:string}])[1];

  const dimensions = graphSpace.dimensions

  const radius = dimensions.width / 2;
  const width = dimensions.width;


  const maxDepth = Math.max(...data.map(d => d.depth));

  const minRad = radius / 3;
  const maxRad = radius;
  const domain = [0, maxDepth]
  function scaleRad(val: number): number {
    if (val > maxDepth) console.log("Val greater than max depth: ", val);
    return ((val - domain[0]) / (domain[1]-domain[0])) * (maxRad-minRad) + minRad;
  }

  const label = svgSel
    .append("text")
    .attr("text-anchor", "middle")
    .attr("fill", "#888")
    .style("visibility", "hidden")
    
  label
    .append("tspan")
    .attr("class", "function")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", `-${minRad/4}px`)
    .attr("font-size", "2em")
    .text("")

  label
    .append("tspan")
    .attr("class", "percentage")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "0.5em")
    .attr("font-size", "3em")
    .text("")

  label
    .append("tspan")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "2.7em")
    .text("of execution time");

  label
    .append("tspan")
    .attr("class", "total-percentage")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "3.3em")
    .attr("font-size", "1.4em")
    .text("of total program execution");
  
  svgSel
    .attr("viewBox", `${-radius} ${-radius} ${width} ${width}`)
    .style("max-width", `${width}px`)
    .style("font", "12px sans-serif");

  const arc = d3
    .arc<any, DataDescription>()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(1 / radius)
    .padRadius(radius)
    .innerRadius(d => scaleRad(d.depth-1))
    .outerRadius(d => scaleRad(d.depth) - 1);
    // Math.sqrt((d.depth-1 + 3) * 200)

  const mousearc = d3
    .arc<any, DataDescription>()
    .startAngle((d: any) => d.x0)
    .endAngle((d: any) => d.x1)
    .innerRadius((d: any) => scaleRad(d.depth-1))
    .outerRadius(maxRad);
  
  const path = svgSel
    .append("g")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("fill", d => select_colors[d.fnCall.name])
    .attr("d", arc);

  svgSel
    .append("g")
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseleave", () => {
      path.attr("fill-opacity", 1);
      label.style("visibility", "hidden");
      setSelectPath([]);
    })
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("d", mousearc)
    .on("mouseenter", (_event, d) =>{
      const sequence = getFramePath(d.fnCall);
      setSelectPath(sequence.map(name => {return {name: name, color: select_colors[name]}}));
      path.attr("fill-opacity", node => {
        if (d.depth < node.depth) return 0.3;
        const nodePath = getFramePath(node.fnCall);
        for (var i = 0; i < nodePath.length; i++) {
          if (nodePath[i] != sequence[i]) return 0.3
        }
        return 1;
      }
          // sequence.indexOf(node.fnCall.name) == node.depth ? 1.0 : 0.3
      );
      const percentage = ((100 * d.fnCall.encounters) / base.encounters).toPrecision(3)
      const total_percentage = ((100 * d.fnCall.encounters) / root.encounters).toPrecision(3)
      label
        .style("visibility", null)
        .select(".percentage")
        .text(percentage + "%");
      label
        .select(".function")
        .attr("font-size", `${Math.min(3*minRad/(d.fnCall.name.length), minRad/5)}px`)
        .text(d.fnCall.name);
      label
        .style("visibility", null)
        .select(".total-percentage")
        .text(total_percentage + "% of total program execution");
    })
    .on("click", (_event, d) => {
      setWorkingPath(getFramePath(d.fnCall));
    });

  svgSel

}











function getFramePath(frame: CallFrame): string[] {
  if (frame.parent == null) return [frame.name];
  else {
    var ancestors = getFramePath(frame.parent)
    ancestors.push(frame.name);
    return ancestors;
  };
}

// Add
function addCallStack(root: CallFrame, path: string[], encounters: number) {
  root.encounters += encounters;
  
  if (path.length <= 1) return;
    
  if (root.name != path[0]) {
    console.error(`Failed to add call stack, frame ${path[0]} does not match end frame in stack ${getFramePath(root)}`);
  }

  if (root.children[path[1]] == null) {
    root.children[path[1]] = {
      name: path[1],
      encounters: 0,
      parent: root,
      children: {}
    };
  }
  var child = root.children[path[1]];
  addCallStack(child, path.slice(1), encounters);
}

function indexWithPath(base: CallFrame|null, path: string[]): CallFrame|null {
  if (base == null || path.length == 0 || path[0] != base.name) return null;
  
  if (path.length == 1) return base; 
  return indexWithPath(base.children[path[1]], path.slice(1));
}

// // Describes data in relation to how its shown on graph
// interface DataDescription {
//   fnCall: CallFrame,
//   depth: number,
//   x0: number,
//   x1: number,
// }



function getDataPointsRecurse(base: CallFrame, domain: [number, number], maxDepth: number, curDepth=0): DataDescription[] {
  var dataPoints: DataDescription[] = [];
  if (maxDepth == curDepth) return [];
  const span = domain[1] - domain[0]
  var past_encounters = 0;
  for (const name in base.children) {
    if (base.children[name] == undefined) continue;
    console.log("Checking child", name, base.children[name])
    // divide the domain over the children based on child encounters vs parent encounters
    // may not be complete (sum of child encounters <= parent encounters)
    let subSpanStart = (span*past_encounters) /  base.encounters + domain[0];
    past_encounters += base.children[name].encounters;
    let subSpanEnd = (span*past_encounters) /  base.encounters + domain[0];
    console.log("parent encounters:", base.encounters, "mine: ", base.children[name].encounters)
    dataPoints.push({
      fnCall: base.children[name],
      depth: curDepth+1,
      x0: subSpanStart,
      x1: subSpanEnd,
    });
    
    if (Object.keys(base.children[name].children).length != 0)
      dataPoints = dataPoints.concat(getDataPoints(base.children[name], [subSpanStart, subSpanEnd], maxDepth, curDepth+1));
    
  }
  return dataPoints;
}

function getDataPoints(base: CallFrame, domain: [number, number], maxDepth: number, curDepth=0): DataDescription[] {
  var data = getDataPointsRecurse(base, domain, maxDepth, curDepth);
  data.unshift({
    fnCall: base,
    depth: curDepth,
    x0: domain[0],
    x1: domain[1],
  });
  return data;
}

export function radialFlame() {

  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();

  
  // Data values
  const [callFrames, setCallFrames] = useState<CallFrame | null> (null);
  const [displayData, setDisplayData] = useState<[CallFrame|null, DataDescription[]]> ([null,[]]);
  const [workingPath, setWorkingPath] = useState<string[]> (["root"]);
  const [hoverPath, setHoverPath] = useState<DisplayTraceStep[]> ([]);

  // Process data

  // Read in csv into call
  useEffect(() => {
    let cancelled = false;

    fetch(DATA_URL)
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return;
        const parsed = csvParse(text);
        
        // Construct tree structure representing
        // flame graph with each node keeping track of times encountered
        // of itself and all children combined
        setCallFrames(parsed.reduce((root: CallFrame, row) => {
          const path = row.path.split(';');
          path.unshift("root"); // Ensure root is included
          addCallStack(root, path, parseInt(row.encounters));
          return root;
        }, {
          name: "root",
          encounters: 0,
          parent: null,
          children: {}
        } as CallFrame));

      })
      .catch((error) => {
        console.error('Failed to load data', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const workingRoot = indexWithPath(callFrames, workingPath);
    console.log(callFrames);
    if (workingRoot == null) setDisplayData([null, []]);
    else setDisplayData([workingRoot, getDataPoints(workingRoot, [-Math.PI, Math.PI], 100, 0)]);
  }, [callFrames, workingPath])




  // Get graph dimensions and aspects -----------------------------------------

  
  // Get graph dimensions and aspects -----------------------------------------
  const svg_dim: Dimensions = useMemo(() => {
    return {
      width: dimensions.width / 2,
      height: Math.min(dimensions.height, dimensions.width/2),
    }
  }, [dimensions]);

  const graphSpace: GraphSpace = useMemo(() => {
      
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    return {
      dimensions: svg_dim,
      margin
    };
  }, [svg_dim]);
  // const graphSpace = useMemo(() => {
    
  //   const margin = { top: 20, right: 30, bottom: 50, left: 50 };
  //   const svg_dim = {
  //     width: dimensions.width / 2,
  //     height: Math.min(dimensions.height, dimensions.width/2),
  //   };
  //   return {
  //     dimensions: svg_dim,
  //     margin,
  //   };
  // }, [dimensions]);



  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || graphSpace.dimensions.width === 0 || graphSpace.dimensions.height === 0) return;
    
    if (displayData[0] != null && callFrames != null)
      radialFlameGraph(svg, displayData[1], displayData[0], callFrames, graphSpace, setWorkingPath, setHoverPath);
  }, [displayData, graphSpace, callFrames]);

  return (
    <div ref={divRef} className="relative flex h-full w-full flex-row bg-gray-200">

      <div className="flex flex-col gap-0 p-2 w-full">


        


        <div className="flex shrink-0 flex-row gap-2 bg-gray-200 p-2 text-left font-bold w-full">
          {workingPath.length >= 10 && <div className="flex flex-row gap-1">
            <button
              // className="rounded bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400"
            >
              • • •
            </button>
            {/* {(index + workingPath.length-9) < workingPath.length - 1 && <span className="text-gray-500"></span>} */}
          </div>}

          {((workingPath.length < 10)? workingPath : workingPath.slice(-10)).map((path, index) => (
            <div key={index + workingPath.length-9} className="flex flex-row gap-0">
              <button
                className="rounded bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400"
                onClick={() => {
                  setWorkingPath(workingPath.slice(0, (workingPath.length < 10)? index+1 : index + workingPath.length-9));
                }}
              >
                {path}
              </button>
              {(index + workingPath.length-9) < workingPath.length - 1 && <span className="text-gray-500"></span>}
            </div>
          )) }
        </div>


        <div className="flex shrink-0 flex-row gap-0 bg-gray-200 p-2 text-left font-bold w-full">
          
          <div className="flex flex-row gap-1 px-2 py-1 text-sm font-bold">
            <span style={{opacity:"0"}}> l </span>
          </div>
          
          {hoverPath.slice(workingPath.length).length >= 10 && <div className="flex flex-row gap-1">
            <span>
              • • •
            </span>
            {/* {(index + workingPath.length-9) < workingPath.length - 1 && <span className="text-gray-500"></span>} */}
          </div>}

          {((hoverPath.slice(workingPath.length).length < 10)? hoverPath.slice(workingPath.length) : hoverPath.slice(-10)).map((path, index) => (
            <div key={index + hoverPath.length-9} className="flex flex-row gap-0">
              <span
                className="bg-gray-300 px-2 py-1 text-sm font-bold"
                style={{borderLeft: "solid"}}
              >
                {path.name}
              </span>
              {/* {(index + hoverPath.length-9) < hover.length - 1 && <span className="text-gray-500"></span>} */}
            </div>
          )) }
        </div>

        <div className='relative flex h-full w-full flex-row'>
          <svg
            ref={svgRef}
            width={svg_dim.width.toString()}
            height={svg_dim.height.toString()}
            className="h-full"
            role="img"
            aria-label="Responsive scatter plot showing 6 data points"
          >
          </svg>

        </div>

      </div>
      {/* {toolTip && (
          <div className="rounded border" style={{position: 'fixed', left: toolTip.pos[0] + 10, top: toolTip.pos[1] + 10, background: 'gray', color: 'white', padding: '5px'}}>
              <div>Average Sleep: {toolTip.value[1].toFixed(1)}</div>
              <div>{X_AXIS_CONFIG[xAxis].label}: {toolTip.value[0].toFixed(2)}</div>
              <div>Number of Students: {toolTip.numStudents}</div>
          </div>
      )} */}


      {/* <div> {* THIS *}
        <svg
          ref={svgRef}
          width = {graphSpace.dimensions.width.toString()}
          className="h-full"
          role="img"
          aria-label="Responsive scatter plot showing 6 data points"
        >
        </svg>

      </div> */}
      



      {/* <label className="flex shrink-0 flex-col gap-2">
          
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
            value={filter.uni}
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


        </label> */}

    </div>
     
  );
}