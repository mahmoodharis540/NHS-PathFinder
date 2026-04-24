import { prisma } from "@/lib/prisma";
import type { Building, Media, Status } from "@prisma/client";

export async function cleanDatabase() {
  await prisma.distanceWeight.deleteMany();
  await prisma.path.deleteMany();
  await prisma.pSequence.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.media.deleteMany();
  await prisma.building.deleteMany();
  await prisma.status.deleteMany();
}

export function createBuilding(name: string): Promise<Building> {
  return prisma.building.create({ data: { BuildingName: name } });
}

export function createPlaceholderMedia(): Promise<Media> {
  return prisma.media.create({
    data: { Media: "/placeholder", MediaDesc: "No image" },
  });
}

export function createStatus(type: string): Promise<Status> {
  return prisma.status.upsert({
    where: { StatusType: type },
    update: {},
    create: { StatusType: type },
  });
}
