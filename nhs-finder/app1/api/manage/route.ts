import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PathRow = {
  PathID: number;
  PathName: string;
  Date: string;
  AccessToggle: number;
  Building?: { BuildingName: string } | null;
  Status?: { StatusType: string } | null;
  Destination_Path_StartToDestination?: { DestinationName: string } | null;
  Destination_Path_EndToDestination?: { DestinationName: string } | null;
};

export async function GET() {
  try {
    const paths = await prisma.path.findMany({
      orderBy: { PathID: "desc" },
      include: {
        Building: true,
        Status: true,
        Destination_Path_StartToDestination: true,
        Destination_Path_EndToDestination: true,
      },
    });

    const formatted = (paths as unknown as PathRow[]).map((p) => ({
      id: p.PathID,
      name: p.PathName,
      building: p.Building?.BuildingName ?? "Unknown",
      start: p.Destination_Path_StartToDestination?.DestinationName ?? "Unknown",
      end: p.Destination_Path_EndToDestination?.DestinationName ?? "Unknown",
      date: p.Date,
      status: p.Status?.StatusType ?? "Unknown",
      accessToggle: p.AccessToggle,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error(err);
    return NextResponse.json("Failed to load paths", { status: 500 });
  }
}
