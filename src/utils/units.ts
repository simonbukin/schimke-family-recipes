type UnitType = "volume" | "mass" | "length" | "temperature" | "count";

export type Unit = {
  name: string;
  type: UnitType;
  conversions: { [key: string]: number };
  displayName?: string;
};

// Define unit aliases mapping with common abbreviations
const unitAliases: { [key: string]: string } = {
  // Volume aliases
  cups: "cup",
  c: "cup",
  "c.": "cup",

  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbl: "tbsp",
  tbs: "tbsp",
  "tbsp.": "tbsp",
  T: "tbsp",
  "T.": "tbsp",

  teaspoon: "tsp",
  teaspoons: "tsp",
  "tsp.": "tsp",
  t: "tsp",
  "t.": "tsp",

  milliliter: "ml",
  milliliters: "ml",
  "ml.": "ml",
  mL: "ml",
  "mL.": "ml",

  liter: "l",
  liters: "l",
  "l.": "l",
  L: "l",
  "L.": "l",

  "fluid ounce": "fl oz",
  "fluid ounces": "fl oz",
  "fluid oz": "fl oz",
  "fl. oz.": "fl oz",
  "fl.oz.": "fl oz",
  "fl oz.": "fl oz",
  "fl. oz": "fl oz",

  pint: "pint",
  pints: "pint",
  pt: "pint",
  "pt.": "pint",

  quart: "quart",
  quarts: "quart",
  qt: "quart",
  "qt.": "quart",

  // Mass aliases
  gram: "g",
  grams: "g",
  "g.": "g",

  kilogram: "kg",
  kilograms: "kg",
  "kg.": "kg",

  ounce: "oz",
  ounces: "oz",
  "oz.": "oz",

  pound: "lb",
  pounds: "lb",
  "lb.": "lb",
  lbs: "lb",
  "lbs.": "lb",
  "#": "lb",

  stick: "stick",
  sticks: "stick",
  "stick of": "stick",
  "sticks of": "stick",
};

// Core unit definitions remain the same
export const units: { [key: string]: Unit } = {
  // Volume Units
  cup: {
    name: "cup",
    type: "volume",
    conversions: {
      ml: 236.588,
      l: 0.236588,
      tbsp: 16,
      tsp: 48,
      "fl oz": 8,
      pint: 0.5,
      quart: 0.25,
      cup: 1,
      stick: 2,
    },
  },
  ml: {
    name: "ml",
    type: "volume",
    displayName: "mL",
    conversions: {
      cup: 0.00422675,
      l: 0.001,
      tbsp: 0.067628,
      tsp: 0.202884,
      "fl oz": 0.033814,
      ml: 1,
      stick: 0.0084535,
    },
  },
  l: {
    name: "l",
    type: "volume",
    displayName: "L",
    conversions: {
      ml: 1000,
      cup: 4.22675,
      pint: 2.11338,
      quart: 1.05669,
      gallon: 0.264172,
      l: 1,
      stick: 8.4535,
    },
  },
  tbsp: {
    name: "tbsp",
    type: "volume",
    conversions: {
      ml: 14.7868,
      tsp: 3,
      cup: 0.0625,
      "fl oz": 0.5,
      tbsp: 1,
      stick: 0.125,
    },
  },
  tsp: {
    name: "tsp",
    type: "volume",
    conversions: {
      ml: 4.92892,
      tbsp: 0.333333,
      cup: 0.0208333,
      "fl oz": 0.166667,
      tsp: 1,
      stick: 0.0416667,
    },
  },
  "fl oz": {
    name: "fl oz",
    type: "volume",
    conversions: {
      ml: 29.5735,
      cup: 0.125,
      tbsp: 2,
      tsp: 6,
      "fl oz": 1,
      stick: 0.25,
    },
  },
  pint: {
    name: "pint",
    type: "volume",
    conversions: {
      cup: 2,
      quart: 0.5,
      "fl oz": 16,
      ml: 473.176,
      l: 0.473176,
      pint: 1,
      stick: 4,
    },
  },
  quart: {
    name: "quart",
    type: "volume",
    conversions: {
      pint: 2,
      cup: 4,
      "fl oz": 32,
      ml: 946.353,
      l: 0.946353,
      quart: 1,
      stick: 8,
    },
  },
  stick: {
    name: "stick",
    type: "volume",
    conversions: {
      cup: 0.5,
      tbsp: 8,
      tsp: 24,
      "fl oz": 4,
      ml: 118.294,
      l: 0.118294,
      stick: 1,
    },
  },

  // Mass Units
  g: {
    name: "g",
    type: "mass",
    conversions: {
      kg: 0.001,
      oz: 0.035274,
      lb: 0.00220462,
      g: 1,
    },
  },
  kg: {
    name: "kg",
    type: "mass",
    conversions: {
      g: 1000,
      oz: 35.274,
      lb: 2.20462,
      kg: 1,
    },
  },
  oz: {
    name: "oz",
    type: "mass",
    conversions: {
      g: 28.3495,
      kg: 0.0283495,
      lb: 0.0625,
      oz: 1,
    },
  },
  lb: {
    name: "lb",
    type: "mass",
    conversions: {
      g: 453.592,
      kg: 0.453592,
      oz: 16,
      lb: 1,
    },
  },
};

// Modified helper functions to handle aliases
export function normalizeUnit(unit: string): string {
  if (!unit) return unit;
  const normalized = unit.toLowerCase().trim();
  return unitAliases[normalized] || normalized;
}

export function isConvertible(unit: string): boolean {
  const normalized = normalizeUnit(unit);
  return !!units[normalized];
}

export function getUnitDisplay(unit: string): string {
  const normalized = normalizeUnit(unit);
  const unitData = units[normalized];
  return unitData?.displayName || unit;
}

export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);
  const unit = units[normalizedFrom];

  if (!unit || !unit.conversions[normalizedTo]) {
    return value;
  }
  const converted = +(value * unit.conversions[normalizedTo]).toFixed(3);
  return converted;
}

export function getNextUnit(currentUnit: string): string {
  console.log("currentUnit", currentUnit);
  const normalized = normalizeUnit(currentUnit);
  console.log("normalized", normalized);
  const unit = units[normalized];
  console.log("unit", unit);
  if (!unit) return currentUnit;

  const possibleUnits = Object.keys(unit.conversions);
  console.log("possibleUnits", possibleUnits);
  const sortedUnits = possibleUnits.sort();
  console.log("sortedUnits", sortedUnits);
  const currentIndex = sortedUnits.indexOf(normalized);
  console.log("currentIndex", currentIndex);
  return sortedUnits[(currentIndex + 1) % sortedUnits.length];
}
