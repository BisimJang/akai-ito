import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  let user = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!user) {
    user = await prisma.user.create({
      data: { username: 'admin', email: 'admin@akaiito.com' }
    });
    console.log('Created user:', user.username, '| ID:', user.id);
  } else {
    console.log('User already exists:', user.username, '| ID:', user.id);
  }
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
