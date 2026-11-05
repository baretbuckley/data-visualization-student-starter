import type { Config } from "./config";

export interface Menue {
    show: boolean,
    focusedOp: string|null, // If null, assumed focus is the root
    isLineGraph: boolean,
}

export function infoButton(size: number = 25, isPressed: boolean, press: () => void, config: Config) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="button"
      onClick={press}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 1}
        fill={isPressed? config.siteColors.subHeaderSel : config.siteColors.subHeader}
        stroke="black"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={`${size/2}px`}
        stroke="black"
      >?</text>
    </svg>
  )
}

export function displayHelpMenue(config: Config, setHelpMenuePressed: (pressed: boolean) => void) {
  return (
    <div
      className="absolute left-1/2 top-20 z-20 w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 rounded p-4 shadow-2xl"
      style={{
        border: '1px solid rgb(0, 0, 0)',
        background: config.siteColors.surfaceSecondary,
        color: config.siteColors.text
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <strong>Help</strong>
        <button
          type="button"
          onClick={() => setHelpMenuePressed(false)}
          className="rounded px-2 py-1 text-sm"
          style={{
            background:config.siteColors.surfaceSel, 
            // border:"solid", 
            // borderWidth:"0.1em",
            // borderColor:config.siteColors.text,
            cursor:"pointer",
          }}
          aria-label="Close help menu"
        >
          ×
        </button>
      </div>
      <div className="text-sm w-fit h-fit">
        <p>Welcome to the Eigen Benchmark Vectorization Explorer.</p>
        <p>Here the performance improvment from Hand-Vectorized and Auto-Vectorized are compared across different operations provided by Eigen's benchmarking system.</p>
        <div className="pt-4 space-y-1">
          <p>Explore different catagories through the interaactive bar-chart.</p>
        </div>
        <p>Each bar represents the average of all subcatagories/operations in that catagory</p>
        <p>Double click to drill deeper and explore subcatagories/operation.</p>
        <p>Use the breadcrumb tooltip at the top to go back to overarching catagories.</p>
        <p>Once you enter an operation it will show a linegraph of the performance over different matrix/vector sizes</p>
      </div>
        </div>
  )
}