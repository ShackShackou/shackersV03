-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('male', 'female');

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
CREATE TABLE "public"."Brute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "hp" INTEGER NOT NULL DEFAULT 10,
    "strength" INTEGER NOT NULL DEFAULT 3,
    "agility" INTEGER NOT NULL DEFAULT 3,
    "speed" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Brute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bruteAId" TEXT NOT NULL,
    "bruteBId" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "log" TEXT NOT NULL,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Brute_name_key" ON "public"."Brute"("name");

-- AddForeignKey
ALTER TABLE "public"."Brute" ADD CONSTRAINT "Brute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fight" ADD CONSTRAINT "Fight_bruteAId_fkey" FOREIGN KEY ("bruteAId") REFERENCES "public"."Brute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fight" ADD CONSTRAINT "Fight_bruteBId_fkey" FOREIGN KEY ("bruteBId") REFERENCES "public"."Brute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
