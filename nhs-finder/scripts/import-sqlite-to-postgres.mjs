import "dotenv/config";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const sqlitePath = process.env.SQLITE_DATABASE_PATH
  ? path.resolve(projectRoot, process.env.SQLITE_DATABASE_PATH)
  : path.resolve(projectRoot, "prisma", "PathfinderDB.db");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env before importing data.");
}

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

function readSqliteJson(query) {
  const raw = execFileSync("sqlite3", ["-json", sqlitePath, query], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  return JSON.parse(raw || "[]");
}

async function resetPostgresData() {
  await prisma.path.deleteMany();
  await prisma.pSequence.deleteMany();
  await prisma.media.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.building.deleteMany();
  await prisma.status.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.login.deleteMany();
}

async function syncSequences() {
  const sequenceTargets = [
    { table: "Building", column: "BuildingID" },
    { table: "Destination", column: "DestinationID" },
    { table: "Media", column: "MediaID" },
    { table: "PSequence", column: "PSequenceID" },
    { table: "Path", column: "PathID" },
    { table: "Status", column: "StatusID" },
    { table: "ContactMessage", column: "ContactMessageID" },
  ];

  for (const target of sequenceTargets) {
    const sql = `
      SELECT setval(
        pg_get_serial_sequence('"${target.table}"', '${target.column}'),
        COALESCE((SELECT MAX("${target.column}") FROM "${target.table}"), 1),
        (SELECT COUNT(*) > 0 FROM "${target.table}")
      );
    `;
    await prisma.$executeRawUnsafe(sql);
  }
}

async function main() {
  console.log(`Importing SQLite data from ${sqlitePath}`);

  const buildings = readSqliteJson('SELECT "BuildingID", "BuildingName" FROM "Building" ORDER BY "BuildingID";');
  const destinations = readSqliteJson(
    'SELECT "DestinationID", "DestinationName", "BuildingID", "isEntrance", "Accessibility", "Weight", "NodeImage" FROM "Destination" ORDER BY "DestinationID";'
  );
  const logins = readSqliteJson('SELECT "Code" FROM "Login";');
  const media = readSqliteJson('SELECT "MediaID", "Media", "MediaDesc" FROM "Media" ORDER BY "MediaID";');
  const sequences = readSqliteJson(
    'SELECT "PSequenceID", "MediaID", "Next", "Prev" FROM "PSequence" ORDER BY "PSequenceID";'
  );
  const statuses = readSqliteJson('SELECT "StatusID", "StatusType" FROM "Status" ORDER BY "StatusID";');
  const paths = readSqliteJson(
    'SELECT "PathID", "PathName", "AccessToggle", "Date", "Start", "End", "PSequenceID", "StatusID", "BuildingID" FROM "Path" ORDER BY "PathID";'
  );
  const contactMessages = readSqliteJson(
    'SELECT "ContactMessageID", "FullName", "Email", "Phone", "Category", "Building", "Message", "Date" FROM "ContactMessage" ORDER BY "ContactMessageID";'
  );

  await resetPostgresData();

  if (buildings.length) await prisma.building.createMany({ data: buildings });
  if (destinations.length) await prisma.destination.createMany({ data: destinations });
  if (logins.length) await prisma.login.createMany({ data: logins });
  if (media.length) await prisma.media.createMany({ data: media });
  if (sequences.length) await prisma.pSequence.createMany({ data: sequences });
  if (statuses.length) await prisma.status.createMany({ data: statuses });
  if (paths.length) await prisma.path.createMany({ data: paths });
  if (contactMessages.length) await prisma.contactMessage.createMany({ data: contactMessages });

  await syncSequences();

  console.log("SQLite data import completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
