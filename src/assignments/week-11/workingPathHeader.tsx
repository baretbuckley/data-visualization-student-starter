import type { Config } from "./config";


export function workingPathHeader(path: string[], setPath: (path: string[])=>void, config: Config) {

  return (
    <div 
    className="flex shrink-0 flex-row gap-0 bg-gray-300 p-0 text-left font-bold w-full"
    style={{background:config.siteColors.subHeader}}
    >
      <div key="All" className="flex flex-row gap-1">
        <button
          className="px-2 py-1 text-sm font-bold hover:bg-gray-400"
          style={{borderLeft: "solid", background:config.siteColors.subHeader, cursor: "pointer"}}
          onClick={() => {
            setPath([]);
          }}
        >
          {"All"}
        </button>
        {/* {index < workingPath.length - 1 && <span className="text-gray-500"></span>} */}
      </div>
      {path.map((p, index) => (
        <div key={index} className="flex flex-row gap-0">
          <button
            className="px-2 py-1 text-sm font-bold hover:bg-gray-400"
            style={{borderLeft: "solid", background:config.siteColors.subHeader, cursor: "pointer"}}
            onClick={() => {
              setPath(path.slice(0, index + 1));
            }}
          >
            {p}
          </button>
          {index < path.length - 1 && <span className="text-gray-500"></span>}
        </div>
      ))}
    </div>
  )
}