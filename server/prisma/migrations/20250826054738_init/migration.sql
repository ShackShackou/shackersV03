-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shacker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "characterType" TEXT NOT NULL DEFAULT 'spineboy',
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL DEFAULT 50,
    "strength" INTEGER NOT NULL DEFAULT 3,
    "agility" INTEGER NOT NULL DEFAULT 3,
    "speed" INTEGER NOT NULL DEFAULT 3,
    "endurance" INTEGER NOT NULL DEFAULT 3,
    "talentPoints" INTEGER NOT NULL DEFAULT 0,
    "unlockedTalents" TEXT NOT NULL DEFAULT '[]',
    "weapons" TEXT NOT NULL DEFAULT '[]',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "pet" TEXT,
    "masterId" TEXT,
    "tournamentWins" INTEGER NOT NULL DEFAULT 0,
    "tournamentBest" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Shacker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shackerAId" TEXT NOT NULL,
    "shackerBId" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "log" TEXT NOT NULL,
    "xpGained" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'normal',

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tournament" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "brackets" TEXT NOT NULL,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Shacker_name_key" ON "public"."Shacker"("name");

-- AddForeignKey
ALTER TABLE "public"."Shacker" ADD CONSTRAINT "Shacker_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "public"."Shacker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shacker" ADD CONSTRAINT "Shacker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fight" ADD CONSTRAINT "Fight_shackerAId_fkey" FOREIGN KEY ("shackerAId") REFERENCES "public"."Shacker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fight" ADD CONSTRAINT "Fight_shackerBId_fkey" FOREIGN KEY ("shackerBId") REFERENCES "public"."Shacker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
