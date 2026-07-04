import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  let admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!admin) {
    admin = await prisma.user.create({ data: { username: 'admin', email: 'admin@akai-ito.com' } });
  }

  const caseNumber = `CASE-${Date.now().toString(36).toUpperCase()}-OG`;
  
  const ogCase = await prisma.case.create({
    data: {
      userId: admin.id,
      caseNumber: caseNumber,
      title: 'PetroGlobal Deepwater Scandal',
      description: 'An investigative probe into PetroGlobal’s sudden acquisition of the North Sea drilling rights, suspected bribery of government officials, and use of offshore shell companies.',
      status: 'active',
      priority: 'high',
      summary: 'Anonymous tip suggests PetroGlobal used a fixer to bribe ministry officials for the North Sea contract.',
      keyFacts: '["Contract awarded mysteriously in Q3 2025.","Whistleblower claims off-book payments made in Panama.","Fixer identified only as \'Mr. Vance\'."]',
      persons: '["Mr. Vance (Fixer)","Minister Robert Thorne"]',
      locations: '["London, UK","Panama City, Panama"]',
      leads: '["Cross-reference offshore shell companies with PetroGlobal executives.","Identify the true identity of Mr. Vance."]'
    }
  });

  console.log('Seeded new case:', ogCase.title);
}

seed()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
