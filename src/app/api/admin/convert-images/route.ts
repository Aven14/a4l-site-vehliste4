import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { convertToWebP, needsConversion } from '@/lib/image-utils';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Extend timeout for long-running conversion

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Basic security check
  if (!session || !session.user?.canAccessAdmin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const results = {
    brands: 0,
    vehicles: 0,
    dealerships: 0,
    listings: 0,
    totalConverted: 0,
    errors: [] as string[],
  };

  try {
    // 1. Process Brands
    const brands = await prisma.brand.findMany({
      where: { logo: { not: null } }
    });

    for (const brand of brands) {
      if (brand.logo && needsConversion(brand.logo)) {
        try {
          const newUrl = await processImageUrl(brand.logo);
          if (newUrl) {
            await prisma.brand.update({
              where: { id: brand.id },
              data: { logo: newUrl }
            });
            results.brands++;
            results.totalConverted++;
          }
        } catch (e: any) {
          results.errors.push(`Brand ${brand.name}: ${e.message}`);
        }
      }
    }

    // 2. Process Dealerships
    const dealerships = await prisma.dealership.findMany({
      where: { logo: { not: null } }
    });

    for (const dealership of dealerships) {
      if (dealership.logo && needsConversion(dealership.logo)) {
        try {
          const newUrl = await processImageUrl(dealership.logo);
          if (newUrl) {
            await prisma.dealership.update({
              where: { id: dealership.id },
              data: { logo: newUrl }
            });
            results.dealerships++;
            results.totalConverted++;
          }
        } catch (e: any) {
          results.errors.push(`Dealership ${dealership.name}: ${e.message}`);
        }
      }
    }

    // 3. Process Vehicles (JSON array of images)
    const vehicles = await prisma.vehicle.findMany();
    for (const vehicle of vehicles) {
      try {
        let images: string[] = [];
        try {
          images = JSON.parse(vehicle.images || '[]');
        } catch (e) {
          continue; // Not a valid JSON array
        }

        if (!Array.isArray(images)) continue;

        let changed = false;
        const newImages = await Promise.all(images.map(async (url) => {
          if (needsConversion(url)) {
            const newUrl = await processImageUrl(url);
            if (newUrl) {
              changed = true;
              results.totalConverted++;
              return newUrl;
            }
          }
          return url;
        }));

        if (changed) {
          await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { images: JSON.stringify(newImages) }
          });
          results.vehicles++;
        }
      } catch (e: any) {
        results.errors.push(`Vehicle ${vehicle.name}: ${e.message}`);
      }
    }

    // 4. Process DealershipListings (JSON array of images)
    const listings = await prisma.dealershipListing.findMany({
      where: { images: { not: null } }
    });
    for (const listing of listings) {
      try {
        let images: string[] = [];
        try {
          images = JSON.parse(listing.images || '[]');
        } catch (e) {
          continue;
        }

        if (!Array.isArray(images)) continue;

        let changed = false;
        const newImages = await Promise.all(images.map(async (url) => {
          if (needsConversion(url)) {
            const newUrl = await processImageUrl(url);
            if (newUrl) {
              changed = true;
              results.totalConverted++;
              return newUrl;
            }
          }
          return url;
        }));

        if (changed) {
          await prisma.dealershipListing.update({
            where: { id: listing.id },
            data: { images: JSON.stringify(newImages) }
          });
          results.listings++;
        }
      } catch (e: any) {
        results.errors.push(`Listing ${listing.id}: ${e.message}`);
      }
    }

    // 5. Process SiteSettings
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: ['siteLogo', 'siteFavicon'] } }
    });

    for (const setting of settings) {
      if (setting.value && needsConversion(setting.value)) {
        try {
          const newUrl = await processImageUrl(setting.value);
          if (newUrl) {
            await prisma.siteSettings.update({
              where: { id: setting.id },
              data: { value: newUrl }
            });
            results.totalConverted++;
          }
        } catch (e: any) {
          results.errors.push(`Setting ${setting.key}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processImageUrl(url: string): Promise<string | null> {
  try {
    // 1. Download the image
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Convert to WebP
    const webpBuffer = await convertToWebP(buffer);

    // 3. Generate new filename
    const originalName = path.basename(url.split('?')[0]);
    const nameWithoutExt = originalName.includes('.') 
      ? originalName.substring(0, originalName.lastIndexOf('.'))
      : originalName;
    const newFileName = `${nameWithoutExt}_${Math.random().toString(36).substring(7)}.webp`;

    // 4. Upload to Supabase
    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(newFileName, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) throw error;

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(newFileName);

    return publicUrl;
  } catch (e) {
    console.error(`Error processing image ${url}:`, e);
    throw e;
  }
}
