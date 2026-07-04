import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!admin) {
    console.error('Admin user not found. Cannot seed cases.');
    process.exit(1);
  }

  const isisCase = await prisma.case.create({
    data: {
      userId: admin.id,
      caseNumber: `CASE-${Date.now().toString(36).toUpperCase()}-1`,
      title: 'ISIS Financial Networks in Europe',
      description: 'Investigative piece tracking shell companies and illicit funding networks allegedly tied to ISIS operatives operating across Western Europe.',
      status: 'active',
      priority: 'high',
      summary: 'Initial brief indicates a complex web of shell companies in Eastern Europe funneling money to suspected operatives in France and Germany. Key entities include a logistics firm in Sofia and several charities.',
      keyFacts: JSON.stringify([
        'Suspected funding routed through Sofia logistics firm.',
        'Charities in Lyon under surveillance.',
        'Wire transfers flagged by EUROPOL in Q1 2024.'
      ]),
      persons: JSON.stringify(['Tariq Al-Fayed (Suspect)', 'Elena Rostova (Director, Logistics Firm)']),
      locations: JSON.stringify(['Sofia, Bulgaria', 'Lyon, France', 'Berlin, Germany']),
      leads: JSON.stringify([
        'Request corporate registry documents for Sofia logistics firm.',
        'Cross-reference board members of Lyon charities.',
        'Investigate Q1 2024 wire transfers.'
      ])
    }
  });

  const murderCase = await prisma.case.create({
    data: {
      userId: admin.id,
      caseNumber: `CASE-${Date.now().toString(36).toUpperCase()}-2`,
      title: 'Homicide at the Blackwood Estate',
      description: 'Victim found deceased in the study at 11:45 PM during a private dinner party. The only evidence available so far is the guest list and the time of discovery.',
      status: 'active',
      priority: 'critical',
      summary: 'Victim: Arthur Blackwood. Time of discovery: 11:45 PM. The body was found in the locked study. The dinner party had 6 confirmed guests. No murder weapon found at the scene.',
      keyFacts: JSON.stringify([
        'Victim discovered at 11:45 PM.',
        'Study door was locked from the inside.',
        'Six guests were present in the house at the time of the murder.'
      ]),
      persons: JSON.stringify([
        'Arthur Blackwood (Victim)',
        'Eleanor Blackwood (Wife)',
        'Julian Vance (Business Partner)',
        'Dr. Aris Thorne (Family Doctor)',
        'Clara Higgins (Housekeeper)',
        'Marcus Thorne (Nephew)',
        'Lydia Vance (Julian\'s Wife)'
      ]),
      locations: JSON.stringify(['Blackwood Estate', 'The Study', 'Dining Room']),
      leads: JSON.stringify([
        'Establish alibis for all 6 guests between 11:00 PM and 11:45 PM.',
        'Determine how the study door was locked from the inside.',
        'Investigate Julian Vance\'s recent business dealings with the victim.'
      ])
    }
  });

  console.log('Seeded cases:');
  console.log('1.', isisCase.title);
  console.log('2.', murderCase.title);

  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
