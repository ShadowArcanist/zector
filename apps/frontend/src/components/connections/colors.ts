/** Wave's connection color ramp — each saved connection gets a stable color. */
const RAMP = [
  '#53b4ea',
  '#aa67ff',
  '#fda7fd',
  '#ef476f',
  '#497bf8',
  '#ffa24e',
  '#dbde52',
  '#7aa2f7',
];

export function connColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return RAMP[h % RAMP.length];
}
