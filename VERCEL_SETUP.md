# 🚀 Configuration Vercel

## ⚠️ Problèmes courants et solutions

### 1. Variables d'environnement

Sur Vercel, tu dois configurer les variables d'environnement :

1. Va dans ton projet Vercel
2. Clique sur **Settings** → **Environment Variables**
3. Ajoute ces variables :

```
DATABASE_URL=votre-url-postgresql
NEXTAUTH_SECRET=ton-secret-super-long-et-aleatoire-ici
NEXTAUTH_URL=https://a4l-listeveh.vercel.app
```

**Important** : Pour `NEXTAUTH_SECRET`, génère une clé aléatoire avec :
```bash
openssl rand -base64 32
```

Ou utilise un générateur en ligne : https://generate-secret.vercel.app/32

### 2. Base de données SQLite sur Vercel

⚠️ **Problème** : SQLite ne fonctionne pas bien sur Vercel (système de fichiers éphémère).

**Solutions** :

#### Option A : Utiliser une base de données externe (recommandé)
- **Turso** (SQLite cloud) : https://turso.tech
- **PlanetScale** (MySQL) : https://planetscale.com
- **Supabase** (PostgreSQL) : https://supabase.com

#### Option B : Utiliser Vercel Postgres (gratuit)
1. Dans ton projet Vercel → **Storage** → **Create Database** → **Postgres**
2. Récupère la connection string
3. Change `DATABASE_URL` dans les variables d'environnement
4. Modifie `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

### 3. Build Command

Le build command est déjà configuré dans `package.json` :
```json
"build": "prisma generate && next build"
```

### 4. Mise à jour Next.js (sécurité)

Vercel te signale une vulnérabilité dans Next.js 14.1.0. Pour corriger :

```bash
npm install next@latest
```

Puis commit et push :
```bash
git add package.json package-lock.json
git commit -m "Update Next.js to latest version"
git push
```

### 5. Redéployer

Après avoir configuré les variables d'environnement, redéploie :
- Va dans **Deployments**
- Clique sur les **3 points** du dernier déploiement
- **Redeploy**

## 📝 Checklist avant déploiement

- [ ] Variables d'environnement configurées sur Vercel
- [ ] `NEXTAUTH_URL` pointe vers ton domaine Vercel
- [ ] Base de données configurée (SQLite local ou cloud)
- [ ] Next.js mis à jour (optionnel mais recommandé)
- [ ] `.env` dans `.gitignore` (déjà fait ✅)

## 🔧 Si le build échoue

1. Vérifie les logs de build dans Vercel
2. Assure-toi que `prisma generate` s'exécute avant le build
3. Vérifie que toutes les dépendances sont dans `package.json`
4. Si erreur Prisma, vérifie que `@prisma/client` est bien installé
