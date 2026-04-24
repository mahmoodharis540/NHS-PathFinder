import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanDatabase, createBuilding } from "../helpers/db";

beforeEach(async () => {
  await cleanDatabase();
});

describe("Building — create", () => {
  it("persists and returns the new building", async () => {
    const created = await createBuilding("Northern General Hospital");
    expect(created.BuildingID).toBeGreaterThan(0);
    expect(created.BuildingName).toBe("Northern General Hospital");
  });

  it("rejects a duplicate name", async () => {
    await createBuilding("Northern General Hospital");
    await expect(createBuilding("Northern General Hospital")).rejects.toThrow();
  });
});

describe("Building — read", () => {
  it("retrieves a building by ID", async () => {
    const created = await createBuilding("Royal Hallamshire Hospital");
    const found = await prisma.building.findUnique({
      where: { BuildingID: created.BuildingID },
    });
    expect(found?.BuildingName).toBe("Royal Hallamshire Hospital");
  });

  it("returns null for a missing ID", async () => {
    const found = await prisma.building.findUnique({ where: { BuildingID: 9999 } });
    expect(found).toBeNull();
  });

  it("lists all buildings", async () => {
    await createBuilding("Northern General Hospital");
    await createBuilding("Royal Hallamshire Hospital");
    await createBuilding("Weston Park Hospital");
    const all = await prisma.building.findMany();
    expect(all).toHaveLength(3);
  });
});

describe("Building — delete", () => {
  it("removes the building from the database", async () => {
    const created = await createBuilding("Test Building");
    await prisma.building.delete({ where: { BuildingID: created.BuildingID } });
    const found = await prisma.building.findUnique({
      where: { BuildingID: created.BuildingID },
    });
    expect(found).toBeNull();
  });
});
