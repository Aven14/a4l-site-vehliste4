import sharp from 'sharp';

/**
 * Converts an image buffer to WebP format.
 * @param buffer The original image buffer
 * @param quality Quality of the output WebP (1-100)
 * @returns A buffer containing the WebP image
 */
export async function convertToWebP(buffer: Buffer, quality = 80): Promise<Buffer> {
  return sharp(buffer)
    .webp({ quality })
    .toBuffer();
}

/**
 * Helper to determine if a URL is likely an image that needs conversion
 */
export function needsConversion(url: string | null): boolean {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase();
  // If it's already a webp or not an image (placeholder, etc.), skip
  if (lowercaseUrl.endsWith('.webp') || lowercaseUrl.includes('placeholder')) {
    return false;
  }
  // Check for common image extensions
  return (
    lowercaseUrl.endsWith('.jpg') ||
    lowercaseUrl.endsWith('.jpeg') ||
    lowercaseUrl.endsWith('.png') ||
    lowercaseUrl.endsWith('.avif') ||
    lowercaseUrl.split('?')[0].split('.').pop()?.match(/^(jpg|jpeg|png|avif)$/) !== null
  );
}
