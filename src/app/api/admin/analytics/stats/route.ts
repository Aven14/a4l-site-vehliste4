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
        path: true,
        sessionId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Groupement par jour
    const dailyStats: Record<string, { views: number, visitors: Set<string> }> = {};
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(now, i), 'yyyy-MM-dd');
      dailyStats[date] = { views: 0, visitors: new Set() };
    }

    visits.forEach((v: any) => {
      const date = format(v.createdAt, 'yyyy-MM-dd');
      if (dailyStats[date] !== undefined) {
        dailyStats[date].views++;
        if (v.sessionId) {
          dailyStats[date].visitors.add(v.sessionId);
        }
      }
    });

    const chartData = Object.entries(dailyStats)
      .map(([date, data]) => ({ 
        date, 
        views: data.views, 
        visitors: data.visitors.size 
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Top pages avec résolution des noms
    const pageCounts: Record<string, number> = {};
    visits.forEach((v: any) => {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    });

    const topPagesRaw = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Résolution des IDs en noms
    const topPages = await Promise.all(topPagesRaw.map(async (p) => {
      if (p.path.startsWith('/vehicles/')) {
        const id = p.path.split('/')[2];
        if (id) {
          const vehicle = await prisma.vehicle.findUnique({ 
            where: { id },
            select: { name: true, brand: { select: { name: true } } }
          });
          if (vehicle) return { ...p, title: `${vehicle.brand.name} ${vehicle.name}` };
        }
      }
      if (p.path.startsWith('/brands/')) {
        const id = p.path.split('/')[2];
        if (id) {
          const brand = await prisma.brand.findUnique({ 
            where: { id },
            select: { name: true }
          });
          if (brand) return { ...p, title: `Marque: ${brand.name}` };
        }
      }
      
      const titles: Record<string, string> = {
        '/': 'Accueil',
        '/vehicles': 'Catalogue Véhicules',
        '/brands': 'Liste des Marques',
        '/dealerships': 'Concessionnaires',
        '/account': 'Mon Compte',
        '/auth/login': 'Connexion',
        '/auth/register': 'Inscription',
      };

      return { ...p, title: titles[p.path] || p.path };
    }));

    // 3. Totaux
    const totalTodayViews = visits.filter((v: any) => v.createdAt >= startOfDay(now)).length;
    const totalTodayVisitors = new Set(visits.filter((v: any) => v.createdAt >= startOfDay(now)).map((v: any) => v.sessionId)).size;
    
    const totalWeekViews = visits.filter((v: any) => v.createdAt >= subDays(now, 7)).length;
    const totalWeekVisitors = new Set(visits.filter((v: any) => v.createdAt >= subDays(now, 7)).map((v: any) => v.sessionId)).size;
    
    const totalMonthViews = visits.length;
    const totalMonthVisitors = new Set(visits.map((v: any) => v.sessionId)).size;

    return NextResponse.json({
      chartData,
      topPages,
      totals: {
        today: { views: totalTodayViews, visitors: totalTodayVisitors },
        week: { views: totalWeekViews, visitors: totalWeekVisitors },
        month: { views: totalMonthViews, visitors: totalMonthVisitors }
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
