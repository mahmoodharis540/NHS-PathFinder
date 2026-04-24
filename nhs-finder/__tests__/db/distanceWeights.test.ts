import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanDatabase, createPlaceholderMedia } from "../helpers/db";

let _n = 0;

beforeEach(async () => {
  _n = 0;
  await cleanDatabase();
});

async function seedTwoNodes() {
  _n++;
  const building = await prisma.building.create({
    data: { BuildingName: `Hospital ${_n}` },
  });
  const media = await createPlaceholderMedia();

  const nodeA = await prisma.destination.create({
    data: {
      DestinationName: `Entrance A${_n}`,
      BuildingID: building.BuildingID,
      isEntrance: 1,
      Accessibility: 0,
      MediaID: media.MediaID,
    },
  });
  const nodeB = await prisma.destination.create({
    data: {
      DestinationName: `Ward B${_n}`,
      BuildingID: building.BuildingID,
      isEntrance: 0,
      Accessibility: 0,
      MediaID: media.MediaID,
    },
  });

  return { nodeA, nodeB };
}

describe("DistanceWeight — create", () => {
  it("creates a weight between two nodes", async () => {
    const { nodeA, nodeB } = await seedTwoNodes();

    const dw = await prisma.distanceWeight.create({
      data: { From: nodeA.DestinationID, To: nodeB.DestinationID, Weight: 5 },
    });

    expect(dw.DistanceWeightID).toBeGreaterThan(0);
    expect(dw.Weight).toBe(5);
  });
});

describe("DistanceWeight — read", () => {
  it("retrieves a weight by From/To pair", async () => {
    const { nodeA, nodeB } = await seedTwoNodes();

    await prisma.distanceWeight.create({
      data: { From: nodeA.DestinationID, To: nodeB.DestinationID, Weight: 10 },
    });

    const found = await prisma.distanceWeight.findFirst({
      where: { From: nodeA.DestinationID, To: nodeB.DestinationID },
    });

    expect(found?.Weight).toBe(10);
  });

  it("returns null when no weight exists for a pair", async () => {
    const found = await prisma.distanceWeight.findFirst({
      where: { From: 999, To: 1000 },
    });
    expect(found).toBeNull();
  });
});

describe("DistanceWeight — update", () => {
  it("updates an existing weight", async () => {
    const { nodeA, nodeB } = await seedTwoNodes();

    const dw = await prisma.distanceWeight.create({
      data: { From: nodeA.DestinationID, To: nodeB.DestinationID, Weight: 5 },
    });

    const updated = await prisma.distanceWeight.update({
      where: { DistanceWeightID: dw.DistanceWeightID },
      data: { Weight: 20 },
    });

    expect(updated.Weight).toBe(20);
  });
});

describe("DistanceWeight — delete (cascade)", () => {
  it("cascades when the From destination is deleted", async () => {
    const { nodeA, nodeB } = await seedTwoNodes();

    const dw = await prisma.distanceWeight.create({
      data: { From: nodeA.DestinationID, To: nodeB.DestinationID, Weight: 5 },
    });

    await prisma.destination.delete({ where: { DestinationID: nodeA.DestinationID } });

    const found = await prisma.distanceWeight.findUnique({
      where: { DistanceWeightID: dw.DistanceWeightID },
    });
    expect(found).toBeNull();
  });
});
