/*
  Warnings:

  - You are about to drop the column `category` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `change7d` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `chaosRate` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `chaosVolume` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `divineRate` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `divineVolume` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `exaltedRate` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `exaltedVolume` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `lastSync` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `sparklineData` on the `MarketItem` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the `PriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TradeOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VaultItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[detailsId]` on the table `MarketItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `detailsId` to the `MarketItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryValue` to the `MarketItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `volumePrimaryValue` to the `MarketItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_orderId_fkey";

-- DropForeignKey
ALTER TABLE "TradeOrder" DROP CONSTRAINT "TradeOrder_itemId_fkey";

-- DropForeignKey
ALTER TABLE "VaultItem" DROP CONSTRAINT "VaultItem_itemId_fkey";

-- DropIndex
DROP INDEX "MarketItem_category_idx";

-- DropIndex
DROP INDEX "MarketItem_externalId_key";

-- DropIndex
DROP INDEX "MarketItem_name_idx";

-- DropIndex
DROP INDEX "Wallet_currency_key";

-- AlterTable
ALTER TABLE "MarketItem" DROP COLUMN "category",
DROP COLUMN "change7d",
DROP COLUMN "chaosRate",
DROP COLUMN "chaosVolume",
DROP COLUMN "createdAt",
DROP COLUMN "divineRate",
DROP COLUMN "divineVolume",
DROP COLUMN "exaltedRate",
DROP COLUMN "exaltedVolume",
DROP COLUMN "externalId",
DROP COLUMN "imageUrl",
DROP COLUMN "lastSync",
DROP COLUMN "sparklineData",
ADD COLUMN     "detailsId" TEXT NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "primaryValue" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "volumePrimaryValue" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "balance",
DROP COLUMN "currency",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "PriceHistory";

-- DropTable
DROP TABLE "SyncStatus";

-- DropTable
DROP TABLE "Trade";

-- DropTable
DROP TABLE "TradeOrder";

-- DropTable
DROP TABLE "VaultItem";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPair" (
    "id" TEXT NOT NULL,
    "marketItemId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MarketPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketHistory" (
    "id" TEXT NOT NULL,
    "marketPairId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MarketHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_walletId_currency_key" ON "Balance"("walletId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPair_marketItemId_currencyId_key" ON "MarketPair"("marketItemId", "currencyId");

-- CreateIndex
CREATE INDEX "MarketHistory_marketPairId_timestamp_idx" ON "MarketHistory"("marketPairId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketItem_detailsId_key" ON "MarketItem"("detailsId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPair" ADD CONSTRAINT "MarketPair_marketItemId_fkey" FOREIGN KEY ("marketItemId") REFERENCES "MarketItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketHistory" ADD CONSTRAINT "MarketHistory_marketPairId_fkey" FOREIGN KEY ("marketPairId") REFERENCES "MarketPair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
