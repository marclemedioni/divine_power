import { poeNinjaService } from '../services/poe-ninja.service';

async function main() {
    console.log("Starting update...");
    await poeNinjaService.updateAll();
    console.log("Update complete.");
    process.exit(0);
}

main().catch(console.error);
