export * from "./minato/index.js";

import { minatoForms } from "./minato/index.js";

export const allForms = [
  ...minatoForms,
  // add new jurisdiction arrays here: ...shinjukuForms, ...nationalForms, etc.
];
