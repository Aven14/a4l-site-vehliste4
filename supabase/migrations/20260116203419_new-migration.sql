-- Créer extension pour les CUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table des rôles
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "canAccessAdmin" BOOLEAN NOT NULL DEFAULT false,
    "canEditBrands" BOOLEAN NOT NULL DEFAULT false,
    "canEditVehicles" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteBrands" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteVehicles" BOOLEAN NOT NULL DEFAULT false,
    "canImport" BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageRoles" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "username" TEXT UNIQUE,
    "email" TEXT UNIQUE,
    "password" TEXT,
    "image" TEXT,
    "roleId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "codeExpires" TIMESTAMP(3),
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "passwordChangeToken" TEXT,
    "passwordChangeExpires" TIMESTAMP(3),
    "passwordChangePending" TEXT,
    "emailChangeToken" TEXT,
    "emailChangeExpires" TIMESTAMP(3),
    "emailChangePending" TEXT,
    "themeColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id")
);

-- Table des marques
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des véhicules
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "power" INTEGER,
    "trunk" INTEGER,
    "vmax" INTEGER,
    "seats" INTEGER,
    "images" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE
);

-- Table des paramètres du site
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
CREATE INDEX "Vehicle_brandId_idx" ON "Vehicle"("brandId");

-- Table des concessionnaires
CREATE TABLE "Dealership" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "logo" TEXT,
    "userId" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dealership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Table des annonces de concessionnaires
CREATE TABLE "DealershipListing" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "images" TEXT,
    "mileage" INTEGER,
    "condition" TEXT,
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DealershipListing_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership" ("id") ON DELETE CASCADE,
    CONSTRAINT "DealershipListing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE,
    CONSTRAINT "DealershipListing_dealershipId_vehicleId_key" UNIQUE("dealershipId", "vehicleId")
);

-- Créer les index
CREATE INDEX "Dealership_userId_idx" ON "Dealership"("userId");
CREATE INDEX "DealershipListing_dealershipId_idx" ON "DealershipListing"("dealershipId");
CREATE INDEX "DealershipListing_vehicleId_idx" ON "DealershipListing"("vehicleId");
