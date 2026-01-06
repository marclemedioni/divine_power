export interface MarketItem {
  id: string;
  name: string;
  detailsId: string;
  image?: string | null;
  category: string;
  primaryValue: number;
  volumePrimaryValue?: number;
  change24h?: number;
  updatedAt?: Date | string;
  pairs?: Array<{
    currencyId: string;
    rate: number;
    volume: number;
  }>;
}

export interface Wallet {
  id: string;
  userId: string;
  balances: Balance[];
  inventory: Inventory[];
}

export interface Balance {
  id: string;
  walletId: string;
  currency: 'DIVINE' | 'CHAOS' | 'EXALTED';
  amount: number;
}

export interface Inventory {
  id: string;
  walletId: string;
  marketItemId: string;
  marketItem: MarketItem;
  quantity: number;
  totalValue?: number;
}

export interface InventoryLot {
  id: string;
  walletId: string;
  marketItemId: string;
  marketItem: MarketItem;
  quantity: number;
  purchasePrice: number;
  purchasedAt: Date | string;
}

export interface Order {
  id: string;
  userId: string;
  marketItemId: string;
  marketItem: MarketItem;
  type: 'BUY' | 'SELL';
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  currency: 'DIVINE' | 'CHAOS' | 'EXALTED';
  pricePerUnit: number;
  quantity: number;
  fulfilledQuantity?: number | null;
  fulfilledPricePerUnit?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OracleAnalysisItem {
  id: string;
  name: string;
  detailsId: string;
  image?: string;
  category: string;
  currentPrice: number;
  change24h: number;
  volume: number;
  volumeScore: number;
  trendSlope: number;
  trendDirection: 'rising' | 'falling' | 'sideways';
  volatility: number;
  tradabilityScore: number;
  rsi: number;
  bollingerUpper: number;
  bollingerLower: number;
  floorProximity: number;
  stabilityScore: number;
  chaosCorrelation: number;
}
