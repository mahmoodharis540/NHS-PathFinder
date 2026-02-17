import { prisma } from './lib/prisma'

async function main() {
  // Example: Fetch all records from a table
  // This script displays all in a table in terminal 

  const allbuildings = await prisma.building.findMany()
  console.log('All users:', JSON.stringify(allbuildings, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })