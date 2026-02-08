import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // On ignore les visites admin pour ne pas fausser les stats
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ skipped: true });
    }

    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const referer = req.headers.get('referer') || 'Direct';

    await prisma.pageVisit.create({
      data: {
        path,
        userAgent,
        referer,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
  }
}
