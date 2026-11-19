

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
  autoSel: '#f2622e'
};