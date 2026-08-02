const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const plan = await prisma.installmentPlan.findFirst();
    if (!plan) return console.log("No plan found");
    console.log("Found plan:", plan.id);
    const updated = await prisma.installmentPlan.update({
      where: { id: plan.id },
      data: { notes: "test note" }
    });
    console.log("Successfully updated notes!");
  } catch(e) {
    console.error("Prisma Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
