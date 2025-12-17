const currencyList = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD" },
  { code: "GBP", name: "British Pound", symbol: "£" },
] as const;

export const CURRENCIES = currencyList;
export const currencies = currencyList;

export type CurrencyCode = (typeof currencyList)[number]["code"];
