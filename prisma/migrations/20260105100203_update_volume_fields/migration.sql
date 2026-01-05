/*
  Warnings:

  - You are about to drop the column `volume24h` on the `MarketItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MarketItem" DROP COLUMN "volume24h",
ADD COLUMN     "chaosVolume" DECIMAL(18,2),
ADD COLUMN     "divineVolume" DECIMAL(18,2),
ADD COLUMN     "exaltedVolume" DECIMAL(18,2);
