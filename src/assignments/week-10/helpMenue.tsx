export interface Menue {
    show: boolean,
    focusedOp: string|null, // If null, assumed focus is the root
    isLineGraph: boolean,
}

export function infoButton(size: number = 25, isPressed: boolean, press: () => void) {
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
        fill={isPressed? "#A9A9A9" : "#C8C8C8"}
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

export function DisplayMenue(menue: Menue) {
  return (
    <div>
    {(menue.show) && (<span>TEST</span>)}
    </div>
  )
}