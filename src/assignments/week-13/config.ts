

export interface ColorPallet {
  header: string;
  subHeader: string; 
  subHeaderSel: string;
  surface: string;
  surfaceSecondary: string;
  surfaceSel: string;
  text: string;
}

export interface GraphColors {
  hand: string;
  auto: string;
  handSel: string;
  autoSel: string;
  multiPallet: string[];
}

export interface Config {
  siteColors: ColorPallet;
  graphColors: GraphColors;
}

// Basic Color Pallets
export const LIGHT_MODE: ColorPallet = {
  header: "#FFFFFF",
  subHeader: "#d0d0d0",
  subHeaderSel: "#676767",
  surface: "#e5e5e5",
  surfaceSecondary: "#c1bfbf",
  surfaceSel: "#676767",
  text: "#000000",
} 



export const DARK_MODE: ColorPallet = {
  header: "#121212",
  subHeader: "#676767",
  subHeaderSel: "#4f4f4f",
  surface: "#121212",
  surfaceSecondary: "#373737",
  surfaceSel: '#716b74',
  text: "#FFFFFF",
}

export const DARK_MODE_DEFAULT_GRAPH: GraphColors = {
  hand: '#ff8503',
  auto: '#d53600',
  handSel: '#ffa526',
  // handSel: '#feb204',
  autoSel: '#f2622e',
  multiPallet: [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#FF33A6",
    "#FFC300",
    "#DAF7A6",
    "#e00f4a",
    "#900C3F",
  ],
};

export const LIGHT_MODE_DEFAULT_GRAPH: GraphColors = {
  hand: '#ff8503',
  auto: '#d53600',
  handSel: '#ffa526',
  // handSel: '#feb204',
  autoSel: '#f2622e',
  multiPallet: [
    "#274001",
    "#828a00",
    "#f29f05",
    "#f25c05",
    "#d6568c",
    "#4d8584",
    "#a62f03",
    "#400d01"
  ],
};