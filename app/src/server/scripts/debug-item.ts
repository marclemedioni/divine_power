
import { prisma } from '../src/server/db';

async function main() {
  const item = await prisma.marketItem.findFirst({
    where: {
      OR: [
        { name: { contains: 'Fracturing' } },
        { detailsId: { contains: 'fracturing' } }
      ]
    },
    include: {
      pairs: true
    }
  });

  console.log('--- Market Item ---');
  console.log(JSON.stringify(item, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
