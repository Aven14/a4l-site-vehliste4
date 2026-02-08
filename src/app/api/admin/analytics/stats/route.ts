import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session.user as any).canAccessAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const last30Days = subDays(now, 30);

    // 1. Stats globales par jour sur 30 jours
    const visits = await prisma.pageVisit.findMany({
      where: {
        createdAt: { gte: last30Days }
      },
      select: {
        createdAt: true,
        path: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Groupement par jour
    const dailyStats: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(now, i), 'yyyy-MM-dd');
      dailyStats[date] = 0;
    }

    visits.forEach((v: any) => {
      const date = format(v.createdAt, 'yyyy-MM-dd');
      if (dailyStats[date] !== undefined) {
        dailyStats[date]++;
      }
    });

    const chartData = Object.entries(dailyStats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Top pages
    const pageCounts: Record<string, number> = {};
    visits.forEach((v: any) => {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    });

    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3. Totaux
    const totalToday = visits.filter((v: any) => v.createdAt >= startOfDay(now)).length;
    const totalWeek = visits.filter((v: any) => v.createdAt >= subDays(now, 7)).length;
    const totalMonth = visits.length;

    return NextResponse.json({
      chartData,
      topPages,
      totals: {
        today: totalToday,
        week: totalWeek,
        month: totalMonth
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
