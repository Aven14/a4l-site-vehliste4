// Script pour vérifier si les comptes existent dans la base de données
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Vérification de la base de données...\n')
    
    // Vérifier les rôles
    const roles = await prisma.role.findMany()
    console.log(`📋 Rôles trouvés: ${roles.length}`)
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.isSystem ? 'système' : 'personnalisé'})`)
    })
    
    // Vérifier les utilisateurs
    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    })
    console.log(`\n👤 Utilisateurs trouvés: ${users.length}`)
    users.forEach(user => {
      console.log(`   - ${user.username || 'N/A'} (${user.email || 'N/A'}) - Rôle: ${user.role?.name || 'Aucun'}`)
    })
    
    // Vérifier spécifiquement superadmin et admin
    const superadmin = await prisma.user.findUnique({
      where: { username: 'superadmin' },
      include: { role: true }
    })
    
    const admin = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: { role: true }
    })
    
    console.log('\n✅ Vérification des comptes par défaut:')
    if (superadmin) {
      console.log(`   ✓ Superadmin existe (${superadmin.email})`)
    } else {
      console.log(`   ✗ Superadmin N'EXISTE PAS`)
    }
    
    if (admin) {
      console.log(`   ✓ Admin existe (${admin.email})`)
    } else {
      console.log(`   ✗ Admin N'EXISTE PAS`)
    }
    
    if (!superadmin || !admin) {
      console.log('\n⚠️  Les comptes par défaut n\'existent pas!')
      console.log('   Exécute: npm run db:seed')
    }
    
    // Vérifier les marques
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { vehicles: true }
        }
      }
    })
    console.log(`\n🚗 Marques trouvées: ${brands.length}`)
    if (brands.length > 0) {
      brands.slice(0, 10).forEach(brand => {
        console.log(`   - ${brand.name} (${brand._count.vehicles} véhicules)`)
      })
      if (brands.length > 10) {
        console.log(`   ... et ${brands.length - 10} autres marques`)
      }
    }
    
    // Vérifier les véhicules
    const vehiclesCount = await prisma.vehicle.count()
    console.log(`\n🚙 Véhicules trouvés: ${vehiclesCount}`)
    
    if (vehiclesCount === 0) {
      console.log('\n⚠️  Aucun véhicule dans la base de données!')
      console.log('   Exécute: npm run db:seed')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error('\nVérifie que:')
    console.error('1. DATABASE_URL est correct dans .env')
    console.error('2. Les tables existent (exécute: npx prisma db push)')
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
