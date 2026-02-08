import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT modifier une annonce
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { price, mileage, description, images, isAvailable } =
      await req.json()

    // Get user dealership (owner or manager)
    const dealershipResult = await query(
      `SELECT d.id FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       WHERE u.email = $1 AND ud.role IN ('owner', 'manager')`,
      [session.user.email]
    )

    if (dealershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les droits d\'accès pour ce concessionnaire' },
        { status: 403 }
      )
    }

    const dealershipId = dealershipResult.rows[0].id

    // Check listing ownership
    const listingResult = await query(
      `SELECT "dealershipId" FROM "DealershipListing" WHERE id = $1`,
      [params.id]
    )

    if (listingResult.rows.length === 0 || listingResult.rows[0].dealershipId !== dealershipId) {
      return NextResponse.json(
        { error: 'Annonce non trouvée ou accès refusé' },
        { status: 403 }
      )
    }

    const updateData: any = [];
    const updateValues = [];
    let updateIndex = 2;

    if (price !== undefined) {
      updateData.push(`price = $${updateIndex}`);
      updateValues.push(price);
      updateIndex++;
    }
    if (mileage !== undefined) {
      updateData.push(`mileage = $${updateIndex}`);
      updateValues.push(mileage);
      updateIndex++;
    }
    if (description !== undefined) {
      updateData.push(`description = $${updateIndex}`);
      updateValues.push(description);
      updateIndex++;
    }
    if (images !== undefined) {
      updateData.push(`images = $${updateIndex}`);
      updateValues.push(images ? JSON.stringify(images) : null);
      updateIndex++;
    }
    if (isAvailable !== undefined) {
      updateData.push(`"isAvailable" = $${updateIndex}`);
      updateValues.push(isAvailable);
      updateIndex++;
    }

    if (updateData.length === 0) {
      // No updates to make, return current listing
      const currentListingResult = await query(
        `SELECT dl.id, dl.price, dl.mileage, dl.description, dl.images, dl."isAvailable",
                v.id as vehicle_id, v.name, v.description as vehicle_description,
                v.price as vehicle_price, v.power, v.trunk, v.vmax, v.seats, v.images as vehicle_images,
                b.id as brand_id, b.name as brand_name, b.logo as brand_logo
         FROM "DealershipListing" dl
         JOIN "Vehicle" v ON dl."vehicleId" = v.id
         JOIN "Brand" b ON v."brandId" = b.id
         WHERE dl.id = $1`,
        [params.id]
      );
      
      return NextResponse.json(currentListingResult.rows[0]);
    }

    updateValues.unshift(params.id); // Add id as first parameter

    const updateResult = await query(
      `UPDATE "DealershipListing" SET ${updateData.join(', ')} WHERE id = $1 RETURNING *`,
      updateValues
    );

    // Récupérer les détails complets de l'annonce mise à jour
    const fullListingResult = await query(
      `SELECT dl.id, dl.price, dl.mileage, dl.description, dl.images, dl."isAvailable",
              v.id as vehicle_id, v.name, v.description as vehicle_description,
              v.price as vehicle_price, v.power, v.trunk, v.vmax, v.seats, v.images as vehicle_images,
              b.id as brand_id, b.name as brand_name, b.logo as brand_logo
       FROM "DealershipListing" dl
       JOIN "Vehicle" v ON dl."vehicleId" = v.id
       JOIN "Brand" b ON v."brandId" = b.id
       WHERE dl.id = $1`,
      [params.id]
    )

    return NextResponse.json(fullListingResult.rows[0])
  } catch (error) {
    console.error('Erreur modification annonce:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'annonce' },
      { status: 500 }
    )
  }
}

// DELETE supprimer une annonce
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    // Get user dealership (owner or manager)
    const dealershipResult = await query(
      `SELECT d.id FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       WHERE u.email = $1 AND ud.role IN ('owner', 'manager')`,
      [session.user.email]
    )

    if (dealershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les droits d\'accès pour ce concessionnaire' },
        { status: 403 }
      )
    }

    const dealershipId = dealershipResult.rows[0].id

    // Check listing ownership
    const listingResult = await query(
      `SELECT "dealershipId" FROM "DealershipListing" WHERE id = $1`,
      [params.id]
    )

    if (listingResult.rows.length === 0 || listingResult.rows[0].dealershipId !== dealershipId) {
      return NextResponse.json(
        { error: 'Annonce non trouvée ou accès refusé' },
        { status: 403 }
      )
    }

    await query(
      `DELETE FROM "DealershipListing" WHERE id = $1 AND "dealershipId" = $2`,
      [params.id, dealershipId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression annonce:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'annonce' },
      { status: 500 }
    )
  }
}