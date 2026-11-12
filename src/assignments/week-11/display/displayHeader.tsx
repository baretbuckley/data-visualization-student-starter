import type { JSX } from "react";
import type { Config } from "../config";


interface HeaderButton {
  label: string;
  display: ((config: Config) => JSX.Element) | null;
  show: boolean;
  onClick: () => void;
  isActive: boolean;
}

export function displayHeader(config: Config, buttons: HeaderButton[]) {
  return (
    <div 
    className="relative flex h-fit w-full flex-row"
    style={{background:config.siteColors.header, color:config.siteColors.text}}
    >
      <header className="w8-header p-2">
        <h1 className="text-2xl">Performance Ratio of Hand- and Auto-Vectorized Against Scalar Code</h1>
        <p className="w8-eyebrow">Comparison of Vectorization on the Eigen Library Benchmark</p>
      </header>

      <div className="flex w-full"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'right',
        paddingRight: 45,
        gap: 12,
      }}>
        {buttons.filter((button) => button.show).map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.onClick}
            className="rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              background: button.isActive ? config.graphColors.hand : config.siteColors.subHeader,
              color: config.siteColors.text,
              border: `1px solid ${config.siteColors.surfaceSecondary}`,
              cursor: 'pointer',
            }}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  )
}
        // {workingPath.length === 2 && (
        //   <button
        //     type="button"
        //     onClick={() => setCompareMode((current) => !current)}
        //     className="rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
        //     style={{
        //       background: compareMode ? config.graphColors.hand : config.siteColors.subHeader,
        //       color: config.siteColors.text,
        //       border: `1px solid ${config.siteColors.surfaceSecondary}`,
        //       cursor: 'pointer',
        //     }}
        //     aria-label="Toggle comparing operations in this subcategory"
        //   >
        //     {compareMode ? 'Hide comparison' : 'Compare operations'}
        //   </button>
        // )}

        // <button
        //   type="button"
        //   onClick={toggleTheme}
        //   className="rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
        //   style={{
        //     background: config.siteColors.subHeader,
        //     color: config.siteColors.text,
        //     border: `1px solid ${config.siteColors.surfaceSecondary}`,
        //     cursor: 'pointer',
        //   }}
        //   aria-label="Toggle light and dark mode"
        // >
        //   {config.siteColors === DARK_MODE ? 'Light mode' : 'Dark mode'}
        // </button>
        // {infoButton(45, helpMenuePressed, () => {setHelpMenuePressed(!helpMenuePressed)}, config)}
//       </div>
//     </div>
//   )
// }

