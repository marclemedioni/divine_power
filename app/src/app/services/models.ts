
export enum OrderStatus {
    PENDING = 'PENDING',
    EXECUTED = 'EXECUTED',
    CANCELLED = 'CANCELLED'
}

export enum OrderType {
    BUY = 'BUY',
    SELL = 'SELL'
}

export interface Order {
    id: string;
    type: OrderType;
    status: OrderStatus;
    marketItemId: string;
    pricePerUnit: number;
    quantity: number;
    fulfilledQuantity?: number;
    fulfilledPricePerUnit?: number;
    createdAt: Date;
    marketItem: {
        id: string;
        name: string;
        detailsId: string;
    };
}
