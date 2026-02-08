-- Migration pour supprimer la colonne "condition" de DealershipListing
-- Cette colonne n'est plus nécessaire car il n'y a pas d'état de véhicule en jeu

ALTER TABLE "DealershipListing" DROP COLUMN IF EXISTS "condition";
