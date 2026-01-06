
import { PrismaPg } from '@prisma/adapter-pg'

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../../../../prisma/generated/client/client');
const PrismaClient = pkg.default?.PrismaClient || pkg.PrismaClient;

const connectionString = `${process.env['DATABASE_URL']}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'https://poe.ninja/poe2/api/economy/exchange/current';
const LEAGUE = 'Fate of the Vaal';
const CATEGORIES = ['Currency', 'Ritual', 'Abyss'];

interface ApiOverviewResponse {
    lines: Array<{
      id: string;
      primaryValue: number;
    }>;
    items: Array<{
        id: string;
        detailsId: string;
    }>;
}

async function main() {
    console.log('Starting category update...');

    for (const category of CATEGORIES) {
        console.log(`Processing ${category}...`);
        try {
            const url = `${BASE_URL}/overview?league=${encodeURIComponent(LEAGUE)}&type=${category}`;
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch ${category}: ${response.statusText}`);
                continue;
            }
            
            const data = await response.json() as ApiOverviewResponse;
            const itemMap = new Map(data.items.map(i => [i.id, i]));
            
            console.log(`Found ${data.lines.length} items.`);

            for (const line of data.lines) {
                const info = itemMap.get(line.id);
                if (info) {
                    // We only need to update the category
                    await prisma.marketItem.updateMany({
                        where: { detailsId: info.detailsId },
                        data: { category: category }
                    });
                }
            }
        } catch (e) {
            console.error(`Error processing ${category}:`, e);
        }
    }
    
    console.log('Update complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
