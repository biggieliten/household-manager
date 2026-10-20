import { auth } from "../lib/auth.ts";
import { db } from "../lib/prisma.ts";

// Shared password for the local test logins, never used outside the seed
const SEED_PASSWORD = "password123";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

async function main() {
  // Clear existing data (children first)
  await db.completedTask.deleteMany();
  await db.memberToTask.deleteMany();
  await db.pause.deleteMany();
  await db.task.deleteMany();
  await db.member.deleteMany();
  await db.household.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  // Users with email/password logins, created like a normal sign-up
  const [anna, erik, sara, johan, lisa] = await Promise.all(
    [
      { name: "Anna Andersson", email: "anna@example.com" },
      { name: "Erik Svensson", email: "erik@example.com" },
      { name: "Sara Nilsson", email: "sara@example.com" },
      { name: "Johan Berg", email: "johan@example.com" },
      { name: "Lisa Karlsson", email: "lisa@example.com" },
    ].map(async (user) => {
      const result = await auth.api.signUpEmail({
        body: { ...user, password: SEED_PASSWORD },
      });
      return result.user;
    }),
  );

  // Households
  const family = await db.household.create({
    data: { name: "Familjen Andersson", accessCode: "FAM12346" },
  });
  const flat = await db.household.create({
    data: { name: "Studentkorridoren", accessCode: "KOR45678" },
  });

  // Members — Anna belongs to both households
  const annaFamily = await db.member.create({
    data: {
      nickname: "Mamma",
      avatar: "FOX",
      isAdmin: true,
      householdId: family.id,
      userId: anna.id,
    },
  });
  const erikFamily = await db.member.create({
    data: {
      nickname: "Pappa",
      avatar: "OWL",
      householdId: family.id,
      userId: erik.id,
    },
  });
  const saraFamily = await db.member.create({
    data: {
      nickname: "Sara",
      avatar: "UNICORN",
      householdId: family.id,
      userId: sara.id,
    },
  });
  const johanFlat = await db.member.create({
    data: {
      nickname: "Jojo",
      avatar: "FROG",
      isAdmin: true,
      householdId: flat.id,
      userId: johan.id,
    },
  });
  const annaFlat = await db.member.create({
    data: {
      nickname: "Anna",
      avatar: "DOLPHIN",
      householdId: flat.id,
      userId: anna.id,
    },
  });
  const lisaFlat = await db.member.create({
    data: {
      nickname: "Lisa",
      avatar: "CHICKEN",
      householdId: flat.id,
      userId: lisa.id,
      leftAt: daysAgo(5),
    },
  });

  // Pauses — Erik is currently paused, Sara had a finished pause
  await db.pause.createMany({
    data: [
      { memberId: erikFamily.id, startDate: daysAgo(3) },
      { memberId: saraFamily.id, startDate: daysAgo(20), endDate: daysAgo(14) },
    ],
  });

  // Tasks (frequency = every N days, difficultyLevel = 1–8)
  const taskData = [
    {
      householdId: family.id,
      name: "Laga mat",
      description: "Laga middag till familjen",
      frequency: 1,
      difficultyLevel: 4,
    },
    {
      householdId: family.id,
      name: "Diska",
      description: "Diska och torka av bänkarna",
      frequency: 1,
      difficultyLevel: 2,
    },
    {
      householdId: family.id,
      name: "Dammsuga",
      description: "Dammsuga hela huset",
      frequency: 7,
      difficultyLevel: 6,
    },
    {
      householdId: family.id,
      name: "Vattna blommor",
      description: "Vattna alla krukväxter",
      frequency: 3,
      difficultyLevel: 1,
    },
    {
      householdId: family.id,
      name: "Tvätta",
      description: "Tvätta, hänga och vika",
      frequency: 4,
      difficultyLevel: 4,
    },
    {
      householdId: family.id,
      name: "Rensa kylskåpet",
      description: "Släng gammal mat",
      frequency: 14,
      difficultyLevel: 2,
      isArchived: true,
    },
    {
      householdId: flat.id,
      name: "Städa köket",
      description: "Torka ytor och golv i gemensamma köket",
      frequency: 7,
      difficultyLevel: 6,
    },
    {
      householdId: flat.id,
      name: "Ta ut soporna",
      description: "Sortera och slänga sopor",
      frequency: 2,
      difficultyLevel: 2,
    },
    {
      householdId: flat.id,
      name: "Städa badrummet",
      description: "Toalett, handfat och dusch",
      frequency: 7,
      difficultyLevel: 8,
    },
  ];
  const tasks = await Promise.all(
    taskData.map((data) => db.task.create({ data })),
  );
  const familyTasks = tasks.filter(
    (t) => t.householdId === family.id && !t.isArchived,
  );
  const flatTasks = tasks.filter((t) => t.householdId === flat.id);

  // Assignments
  const familyMembers = [annaFamily, erikFamily, saraFamily];
  const flatMembers = [johanFlat, annaFlat, lisaFlat];
  await db.memberToTask.createMany({
    data: [
      ...familyTasks.map((task, i) => ({
        taskId: task.id,
        memberId: familyMembers[i % familyMembers.length].id,
      })),
      ...flatTasks.map((task, i) => ({
        taskId: task.id,
        memberId: flatMembers[i % flatMembers.length].id,
      })),
    ],
  });

  // Completed tasks spread over the last 30 days
  const completions: { taskId: number; memberId: number; completedAt: Date }[] =
    [];
  const addCompletions = (
    taskList: typeof tasks,
    members: typeof familyMembers,
  ) => {
    for (const task of taskList) {
      for (let day = 30; day >= 0; day -= task.frequency) {
        // Rotate members, and skip some days so stats are not perfect
        const member = members[(day + task.id) % members.length];
        if ((day + task.id) % 5 === 0) continue;
        if (member.leftAt && daysAgo(day) > member.leftAt) continue;
        completions.push({
          taskId: task.id,
          memberId: member.id,
          completedAt: new Date(
            daysAgo(day).setHours(8 + ((day * 3) % 12), 0, 0, 0),
          ),
        });
      }
    }
  };
  addCompletions(familyTasks, familyMembers);
  addCompletions(flatTasks, flatMembers);
  await db.completedTask.createMany({ data: completions });

  console.log(
    `Seeded: 5 email logins (password "${SEED_PASSWORD}"), 2 households, 6 members, ${tasks.length} tasks, ${completions.length} completed tasks`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
