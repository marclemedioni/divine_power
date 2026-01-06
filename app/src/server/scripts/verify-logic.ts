
/**
 * Script to verify financial logic algorithms
 * Run with: npx ts-node app/src/server/scripts/verify-logic.ts
 */

const INVESTMENT_MODES = {
  PRUDENT: 0.1,
  BALANCED: 0.3,
  AGGRESSIVE: 0.5
} as const;

// Replicated Logic from CreateOrderComponent
function calculateOptimalQuantity(
    capital: number, 
    buyPrice: number, 
    mode: keyof typeof INVESTMENT_MODES
): { qty: number, distinctRatio: number, diff: number } {
    
    if (buyPrice <= 0) return { qty: 0, distinctRatio: 0, diff: 0 };
    
    const percent = INVESTMENT_MODES[mode];
    const budget = capital * percent;
    
    let bestQty = 0;
    let bestRatioDiff = Infinity;
    const maxQty = Math.floor(budget / buyPrice) + 10;
    
    for (let qty = 1; qty <= maxQty; qty++) {
        const divinesNeeded = Math.floor(qty * buyPrice);
        if (divinesNeeded > budget) continue;
        
        // Logic: specific in-game integer math simulation
        const inGameRatio = divinesNeeded / qty;
        const diff = Math.abs(inGameRatio - buyPrice);
        
        if (diff < bestRatioDiff || (diff === bestRatioDiff && qty > bestQty)) {
            bestQty = qty;
            bestRatioDiff = diff;
        }
    }
    
    const finalDivines = Math.floor(bestQty * buyPrice);
    const finalRatio = bestQty > 0 ? finalDivines / bestQty : 0;
    
    return {
        qty: bestQty,
        distinctRatio: finalRatio,
        diff: Math.abs(finalRatio - buyPrice)
    };
}

// Replicated Logic for Deviation
function calculateDeviation(inputPrice: number, marketPrice: number) {
    if (marketPrice === 0) return 0;
    return ((inputPrice - marketPrice) / marketPrice) * 100;
}

function runTests() {
    console.log("=== Running Financial Logic Verification ===");
    
    // Test 1: Deviation
    console.log("\n[Test 1] Price Deviation Checks");
    const devTests = [
        { market: 100, input: 110, expected: 10 },
        { market: 100, input: 90, expected: -10 },
        { market: 150, input: 300, expected: 100 },
        // Edge cases
        { market: 1, input: 1.5, expected: 50 },
    ];
    

    devTests.forEach(t => {
        const res = calculateDeviation(t.input, t.market);
        if (Math.abs(res - t.expected) > 0.01) {
            console.error(`FAILED: Market ${t.market}, Input ${t.input}. Expected ${t.expected}, Got ${res}`);
        } else {
             console.log(`PASS: Market ${t.market}, Input ${t.input} => ${res}%`);
        }
    });

    // Test 2: Optimal Quantity Algorithm (Fuzzing)
    console.log("\n[Test 2] Optimal Quantity Fuzzing");
    const capital = 100; // 100 divines
    
    // We want to ensure that for a range of prices, the resulting Ratio is close to the Target Price
    // PoE Trade allows integer inputs. divines / items.
    
    const pricesToTest = [
        0.5, 0.33, 1.5, 2.75, 40, 0.05
    ];
    
    pricesToTest.forEach(price => {
        const res = calculateOptimalQuantity(capital, price, 'BALANCED');
        console.log(`Target Price: ${price} => Best Qty: ${res.qty} (In-Game Ratio: ${res.distinctRatio.toFixed(4)}) Diff: ${res.diff.toFixed(6)}`);
        
        if (res.diff > 0.1) { // If distinct ratio is way off (>10% per unit divergence is huge for currency)
             console.warn(`WARNING: Large divergence for price ${price}!`);
        }
    });
    
    console.log("\n=== Logic Verification Complete ===");
}

runTests();
