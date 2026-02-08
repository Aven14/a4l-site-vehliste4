// Liste des concessionnaires officiels en jeu
export const IG_DEALERSHIPS = [
  { name: 'Concessionnaire A-F', location: 'Perrytonia' },
  { name: 'Concessionnaire G-L', location: 'Los Diablos' },
  { name: 'Concessionnaire M-R', location: 'Jamestown' },
  { name: 'Concessionnaire S-Z', location: 'Watergate' },
  { name: 'Concessionnaire Moto/Quad', location: 'Woodland Heights' },
  { name: 'Concessionnaire Transports', location: 'Lakeside' },
  { name: 'Concessionnaire Aérien', location: 'Aux Aéroports' },
  { name: 'Concessionnaire Maritime', location: 'Aux Ports' },
  { name: 'Concessionnaire EVENT', location: 'Palm' },
]

// Fonction pour déterminer le concessionnaire selon la marque et la catégorie
// Note: Cette fonction est conservée pour la compatibilité mais les marques devraient maintenant
// avoir leur concessionnaire défini manuellement en base de données.
export function getDealershipLocation(brand: any, category?: string | null): { name: string; location: string } {
  // Si la marque a déjà un concessionnaire défini manuellement
  if (brand.dealershipName && brand.dealershipLocation && brand.dealershipLocation !== 'Inconnu') {
    return { name: brand.dealershipName, location: brand.dealershipLocation }
  }

  const brandName = typeof brand === 'string' ? brand : brand.name

  // Catégories spéciales (fallback)
  if (category) {
    const cat = category.toLowerCase()
    if (cat === 'moto' || cat === 'quad') {
      return { name: 'Concessionnaire Moto/Quad', location: 'Woodland Heights' }
    }
    if (cat === 'utilitaire' || cat === 'transport' || cat === 'poids lourd' || cat === 'camion') {
      return { name: 'Concessionnaire Transports', location: 'Lakeside' }
    }
    if (cat === 'event' || cat === 'shop event') {
      return { name: 'Concessionnaire EVENT', location: 'Palm' }
    }
    if (cat === 'avion' || cat === 'aérien') {
      return { name: 'Concessionnaire Aérien', location: 'Aux Aéroports' }
    }
    if (cat === 'bateau' || cat === 'maritime') {
      return { name: 'Concessionnaire Maritime', location: 'Aux Ports' }
    }
  }

  // Par première lettre de la marque
  const firstLetter = brandName.charAt(0).toUpperCase()
  
  if ('ABCDEF'.includes(firstLetter)) {
    return { name: 'Concessionnaire A-F', location: 'Perrytonia' }
  }
  if ('GHIJKL'.includes(firstLetter)) {
    return { name: 'Concessionnaire G-L', location: 'Los Diablos' }
  }
  if ('MNOPQR'.includes(firstLetter)) {
    return { name: 'Concessionnaire M-R', location: 'Jamestown' }
  }
  if ('STUVWXYZ'.includes(firstLetter)) {
    return { name: 'Concessionnaire S-Z', location: 'Watergate' }
  }

  return { name: 'Concessionnaire', location: 'Inconnu' }
}
