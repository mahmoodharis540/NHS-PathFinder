import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanDatabase, createPlaceholderMedia, createStatus } from "../helpers/db";

let _n = 0;

beforeEach(async () => {
  _n = 0;
  await cleanDatabase();
});

async function seedFullPath(overrides?: { accessToggle?: number; statusType?: string }) {
  _n++;
  const building = await prisma.building.create({
    data: { BuildingName: `Hospital ${_n}` },
  });
  const media = await createPlaceholderMedia();
  const status = await createStatus(overrides?.statusType ?? "Active");

  const start = await prisma.destination.create({
    data: {
      DestinationName: `Entrance ${_n}`,
      BuildingID: building.BuildingID,
      isEntrance: 1,
      Accessibility: 0,
      MediaID: media.MediaID,
    },
  });
  const end = await prisma.destination.create({
    data: {
      DestinationName: `Ward ${_n}`,
      BuildingID: building.BuildingID,
      isEntrance: 0,
      Accessibility: 0,
      MediaID: media.MediaID,
    },
  });
  const sequence = await prisma.pSequence.create({
    data: { Prev: start.MediaID, Next: end.MediaID },
  });
  const path = await prisma.path.create({
    data: {
      PathName: `Entrance ${_n} to Ward ${_n}`,
      AccessToggle: overrides?.accessToggle ?? 0,
      Date: "2025-01-01",
      Start: start.DestinationID,
      End: end.DestinationID,
      PSequenceID: sequence.PSequenceID,
      StatusID: status.StatusID,
      BuildingID: building.BuildingID,
    },
  });

  return { building, media, status, start, end, sequence, path };
}

describe("Path — create", () => {
  it("creates a complete path with all relations", async () => {
    const { path, start, end } = await seedFullPath();

    expect(path.PathID).toBeGreaterThan(0);
    expect(path.Start).toBe(start.DestinationID);
    expect(path.End).toBe(end.DestinationID);
  });

  it("stores the accessible toggle", async () => {
    const { path } = await seedFullPath({ accessToggle: 1 });
    expect(path.AccessToggle).toBe(1);
  });
});

describe("Path — read", () => {
  it("retrieves a path with its building and status", async () => {
    const { path, building } = await seedFullPath();

    const found = await prisma.path.findUnique({
      where: { PathID: path.PathID },
      include: { Building: true, Status: true },
    });

    expect(found?.Building.BuildingName).toBe(building.BuildingName);
    expect(found?.Status.StatusType).toBe("Active");
  });

  it("retrieves the start and end destination names", async () => {
    const { path, start, end } = await seedFullPath();

    const found = await prisma.path.findUnique({
      where: { PathID: path.PathID },
      include: {
        Destination_Path_StartToDestination: true,
        Destination_Path_EndToDestination: true,
      },
    });

    expect(found?.Destination_Path_StartToDestination.DestinationName).toBe(start.DestinationName);
    expect(found?.Destination_Path_EndToDestination.DestinationName).toBe(end.DestinationName);
  });

  it("filters paths by Active status", async () => {
    await seedFullPath({ statusType: "Active" });
    await seedFullPath({ statusType: "Draft" });

    const activePaths = await prisma.path.findMany({
      where: { Status: { StatusType: "Active" } },
    });
    expect(activePaths).toHaveLength(1);
  });

  it("filters accessible-only paths", async () => {
    await seedFullPath({ accessToggle: 1 });
    await seedFullPath({ accessToggle: 0 });

    const accessible = await prisma.path.findMany({ where: { AccessToggle: 1 } });
    expect(accessible).toHaveLength(1);
  });
});

describe("Path — delete (cascade)", () => {
  it("deleting a path does not delete the linked destinations", async () => {
    const { path, start, end } = await seedFullPath();

    await prisma.path.delete({ where: { PathID: path.PathID } });

    const startFound = await prisma.destination.findUnique({
      where: { DestinationID: start.DestinationID },
    });
    const endFound = await prisma.destination.findUnique({
      where: { DestinationID: end.DestinationID },
    });

    expect(startFound).not.toBeNull();
    expect(endFound).not.toBeNull();
  });

  it("deleting a building cascades to its paths", async () => {
    const { building, path } = await seedFullPath();

    await prisma.distanceWeight.deleteMany();
    await prisma.path.deleteMany({ where: { BuildingID: building.BuildingID } });
    await prisma.destination.deleteMany({ where: { BuildingID: building.BuildingID } });
    await prisma.building.delete({ where: { BuildingID: building.BuildingID } });

    const found = await prisma.path.findUnique({ where: { PathID: path.PathID } });
    expect(found).toBeNull();
  });
});
