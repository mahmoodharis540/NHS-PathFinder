-- CreateTable
CREATE TABLE "Building" (
    "BuildingID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "BuildingName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Destination" (
    "DestinationID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "DestinationName" TEXT NOT NULL,
    "BuildingID" INTEGER NOT NULL,
    "isEntrance" INTEGER NOT NULL,
    "Accessibility" INTEGER,
    "Weight" INTEGER,
    CONSTRAINT "Destination_BuildingID_fkey" FOREIGN KEY ("BuildingID") REFERENCES "Building" ("BuildingID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Login" (
    "Code" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Media" (
    "MediaID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Media" TEXT NOT NULL,
    "MediaDesc" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PSequence" (
    "PSequenceID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "MediaID" INTEGER NOT NULL,
    "Next" INTEGER NOT NULL,
    "Prev" INTEGER NOT NULL,
    CONSTRAINT "PSequence_Prev_fkey" FOREIGN KEY ("Prev") REFERENCES "Media" ("MediaID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PSequence_Next_fkey" FOREIGN KEY ("Next") REFERENCES "Media" ("MediaID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PSequence_MediaID_fkey" FOREIGN KEY ("MediaID") REFERENCES "Media" ("MediaID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Path" (
    "PathID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "PathName" TEXT NOT NULL,
    "AccessToggle" INTEGER NOT NULL,
    "Date" TEXT NOT NULL,
    "Start" INTEGER NOT NULL,
    "End" INTEGER NOT NULL,
    "PSequenceID" INTEGER NOT NULL,
    "StatusID" INTEGER NOT NULL,
    "BuildingID" INTEGER NOT NULL,
    CONSTRAINT "Path_StatusID_fkey" FOREIGN KEY ("StatusID") REFERENCES "Status" ("StatusID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Path_Start_fkey" FOREIGN KEY ("Start") REFERENCES "Destination" ("DestinationID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Path_PSequenceID_fkey" FOREIGN KEY ("PSequenceID") REFERENCES "PSequence" ("PSequenceID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Path_End_fkey" FOREIGN KEY ("End") REFERENCES "Destination" ("DestinationID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Path_BuildingID_fkey" FOREIGN KEY ("BuildingID") REFERENCES "Building" ("BuildingID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Status" (
    "StatusID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "StatusType" TEXT NOT NULL
);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Building_1" ON "Building"("BuildingID");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Building_2" ON "Building"("BuildingName");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Destination_1" ON "Destination"("DestinationID");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Destination_2" ON "Destination"("DestinationName");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Media_1" ON "Media"("MediaID");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_PSequence_1" ON "PSequence"("PSequenceID");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Path_1" ON "Path"("PathID");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Status_1" ON "Status"("StatusID");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Status_2" ON "Status"("StatusType");
Pragma writable_schema=0;
