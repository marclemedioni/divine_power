-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('DIVINE', 'CHAOS', 'EXALTED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'EXECUTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "MarketItem" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "divineRate" DECIMAL(18,8),
    "chaosRate" DECIMAL(18,8),
    "exaltedRate" DECIMAL(18,8),
    "volume24h" DECIMAL(18,2),
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "currency" "Currency" NOT NULL,
    "volume" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "balance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costBasis" DECIMAL(18,8) NOT NULL,
    "costCurrency" "Currency" NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeOrder" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "targetPrice" DECIMAL(18,8) NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "TradeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "currency" "Currency" NOT NULL,
    "orderId" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncStatus" (
    "id" TEXT NOT NULL,
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketItem_externalId_key" ON "MarketItem"("externalId");

-- CreateIndex
CREATE INDEX "MarketItem_category_idx" ON "MarketItem"("category");

-- CreateIndex
CREATE INDEX "MarketItem_name_idx" ON "MarketItem"("name");

-- CreateIndex
CREATE INDEX "PriceHistory_itemId_currency_idx" ON "PriceHistory"("itemId", "currency");

-- CreateIndex
CREATE INDEX "PriceHistory_timestamp_idx" ON "PriceHistory"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_itemId_timestamp_currency_key" ON "PriceHistory"("itemId", "timestamp", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_currency_key" ON "Wallet"("currency");

-- CreateIndex
CREATE INDEX "VaultItem_itemId_idx" ON "VaultItem"("itemId");

-- CreateIndex
CREATE INDEX "TradeOrder_status_idx" ON "TradeOrder"("status");

-- CreateIndex
CREATE INDEX "TradeOrder_itemId_idx" ON "TradeOrder"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_orderId_key" ON "Trade"("orderId");

-- CreateIndex
CREATE INDEX "Trade_itemId_idx" ON "Trade"("itemId");

-- CreateIndex
CREATE INDEX "Trade_executedAt_idx" ON "Trade"("executedAt");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultItem" ADD CONSTRAINT "VaultItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrder" ADD CONSTRAINT "TradeOrder_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TradeOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
