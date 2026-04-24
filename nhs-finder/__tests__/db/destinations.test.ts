import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanDatabase, createBuilding, createPlaceholderMedia } from "../helpers/db";

beforeEach(async () => {
  await cleanDatabase();
});

async function createDestination(
  name: string,
  buildingId: number,
  mediaId: number,
  isEntrance = 0,
  accessibility = 0
) {
  return prisma.destination.create({
    data: {
      DestinationName: name,
      BuildingID: buildingId,
      isEntrance,
      Accessibility: accessibility,
      MediaID: mediaId,
    },
  });
}

describe("Destination — create", () => {
  it("persists and returns the new node", async () => {
    const building = await createBuilding("Northern General Hospital");
    const media = await createPlaceholderMedia();
    const dest = await createDestination("Main Entrance", building.BuildingID, media.MediaID, 1);

    expect(dest.DestinationID).toBeGreaterThan(0);
    expect(dest.DestinationName).toBe("Main Entrance");
    expect(dest.isEntrance).toBe(1);
  });

  it("rejects a duplicate destination name", async () => {
    const building = await createBuilding("Northern General Hospital");
    const media = await createPlaceholderMedia();
    await createDestination("Cardiology", building.BuildingID, media.MediaID);
    await expect(
      createDestination("Cardiology", building.BuildingID, media.MediaID)
    ).rejects.toThrow();
  });
});

describe("Destination — read", () => {
  it("finds a destination by name", async () => {
    const building = await createBuilding("Northern General Hospital");
    const media = await createPlaceholderMedia();
    await createDestination("Cardiology Ward", building.BuildingID, media.MediaID);

    const found = await prisma.destination.findFirst({
      where: { DestinationName: "Cardiology Ward" },
    });
    expect(found?.DestinationName).toBe("Cardiology Ward");
  });

  it("returns null when the name does not exist", async () => {
    const found = await prisma.destination.findFirst({
      where: { DestinationName: "Nonexistent Ward" },
    });
    expect(found).toBeNull();
  });

  it("filters by building", async () => {
    const b1 = await createBuilding("Northern General Hospital");
    const b2 = await createBuilding("Weston Park Hospital");
    const media = await createPlaceholderMedia();

    await createDestination("NGH Entrance", b1.BuildingID, media.MediaID, 1);
    await createDestination("WP Entrance", b2.BuildingID, media.MediaID, 1);

    const b1Nodes = await prisma.destination.findMany({
      where: { BuildingID: b1.BuildingID },
    });
    expect(b1Nodes).toHaveLength(1);
    expect(b1Nodes[0].DestinationName).toBe("NGH Entrance");
  });

  it("filters entrances from locations", async () => {
    const building = await createBuilding("Northern General Hospital");
    const media = await createPlaceholderMedia();

    await createDestination("Main Entrance", building.BuildingID, media.MediaID, 1);
    await createDestination("Cardiology", building.BuildingID, media.MediaID, 0);
    await createDestination("Pharmacy", building.BuildingID, media.MediaID, 0);

    const entrances = await prisma.destination.findMany({ where: { isEntrance: 1 } });
    const locations = await prisma.destination.findMany({ where: { isEntrance: 0 } });

    expect(entrances).toHaveLength(1);
    expect(locations).toHaveLength(2);
  });

  it("filters accessible nodes", async () => {
    const building = await createBuilding("Northern General Hospital");
    const media = await createPlaceholderMedia();

    await createDestination("Lift Entrance", building.BuildingID, media.MediaID, 1, 1);
    await createDestination("Stair Entrance", building.BuildingID, media.MediaID, 1, 0);

    const accessible = await prisma.destination.findMany({
      where: { Accessibility: 1 },
    });
    expect(accessible).toHaveLength(1);
    expect(accessible[0].DestinationName).toBe("Lift Entrance");
  });
});

describe("Destination — delete", () => {
  it("removes the destination", async () => {
    const building = await createBuilding("Northern General Hospital");
    const media = await createPlaceholderMedia();
    const dest = await createDestination("Temp Node", building.BuildingID, media.MediaID);

    await prisma.destination.delete({ where: { DestinationID: dest.DestinationID } });
    const found = await prisma.destination.findUnique({
      where: { DestinationID: dest.DestinationID },
    });
    expect(found).toBeNull();
  });
});
