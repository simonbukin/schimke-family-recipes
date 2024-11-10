type UnitType = "volume" | "mass" | "length" | "temperature" | "count";

export type Unit = {
  name: string;
  type: UnitType;
  conversions: { [key: string]: number };
  displayName?: string;
};

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

// Helper function to check if a unit is convertible
export function isConvertible(unit: string): boolean {
  return !!units[unit?.toLowerCase()];
}

// Get the display name of a unit (for proper capitalization/formatting)
export function getUnitDisplay(unit: string): string {
  const unitData = units[unit?.toLowerCase()];
  return unitData?.displayName || unit;
}

// Convert between units
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const unit = units[fromUnit.toLowerCase()];
  if (!unit || !unit.conversions[toUnit]) {
    return value;
  }
  return +(value * unit.conversions[toUnit]).toFixed(3);
}

// Get the next unit in the conversion cycle
export function getNextUnit(currentUnit: string): string {
  const unit = units[currentUnit.toLowerCase()];
  if (!unit) return currentUnit;

  const possibleUnits = Object.keys(unit.conversions);
  // Sort units to ensure consistent order
  const sortedUnits = possibleUnits.sort();
  const currentIndex = sortedUnits.indexOf(currentUnit.toLowerCase());
  return sortedUnits[(currentIndex + 1) % sortedUnits.length];
}
