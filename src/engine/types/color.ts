export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSLA {
  h: number;
  s: number;
  l: number;
  a: number;
}

export type HexColor = string;

export interface ColorPair {
  primary: HexColor;
  secondary: HexColor;
}
