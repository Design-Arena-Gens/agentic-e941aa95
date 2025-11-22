export type ForexPair = {
  pair: string;
  symbol: string;
  description: string;
};

export const FOREX_PAIRS: ForexPair[] = [
  {
    pair: "EURUSD",
    symbol: "EURUSD=X",
    description: "Euro / US Dollar",
  },
  {
    pair: "GBPUSD",
    symbol: "GBPUSD=X",
    description: "British Pound / US Dollar",
  },
  {
    pair: "USDJPY",
    symbol: "USDJPY=X",
    description: "US Dollar / Japanese Yen",
  },
  {
    pair: "USDCHF",
    symbol: "USDCHF=X",
    description: "US Dollar / Swiss Franc",
  },
  {
    pair: "AUDUSD",
    symbol: "AUDUSD=X",
    description: "Australian Dollar / US Dollar",
  },
  {
    pair: "USDCAD",
    symbol: "CAD=X",
    description: "US Dollar / Canadian Dollar",
  },
  {
    pair: "NZDUSD",
    symbol: "NZDUSD=X",
    description: "New Zealand Dollar / US Dollar",
  },
  {
    pair: "EURJPY",
    symbol: "EURJPY=X",
    description: "Euro / Japanese Yen",
  },
  {
    pair: "EURGBP",
    symbol: "EURGBP=X",
    description: "Euro / British Pound",
  },
  {
    pair: "GBPJPY",
    symbol: "GBPJPY=X",
    description: "British Pound / Japanese Yen",
  },
];

export const DEFAULT_SIGNAL_LOOKBACK_MINUTES = 240;
