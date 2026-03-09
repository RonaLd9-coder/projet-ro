# Algorithme de Demoucron — Application Web

Application web permettant de calculer et visualiser les **chemins de valeur minimale** dans un graphe orienté pondéré, en utilisant l'algorithme de Demoucron.

---

## Aperçu

- **Authentification** complète (inscription, connexion, réinitialisation de mot de passe)
- **Saisie du graphe** en 3 modes : éditeur visuel interactif, liste d'arcs, matrice d'adjacence
- **Déroulement pas à pas** de l'algorithme avec toutes les matrices D1 à D(n-1) et les calculs détaillés
- **Visualisation finale** du graphe avec tous les chemins minimaux en couleurs
- **Sauvegarde** des feuilles de calcul par utilisateur

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Base de données | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Containerisation | Docker + Docker Compose |

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et lancé
- C'est tout. Pas besoin de Node.js, npm, ou PostgreSQL en local.

---

## Installation et lancement

### 1. Cloner le projet

```bash
git clone https://github.com/TON_USERNAME/projet-ro.git
cd projet-ro
```

### 2. Créer le fichier `.env`

```bash
cp .env.example .env
```

Ou crée le fichier `.env` manuellement à la racine du projet :

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=projet_ro_db
JWT_SECRET=change_this_in_production
```

### 3. Lancer les conteneurs

```bash
docker compose up --build
```

Le premier lancement télécharge les images Docker et installe les dépendances — cela peut prendre quelques minutes.

### 4. Accéder à l'application

| Service | URL |
|---|---|
| Application (frontend) | http://localhost:5173 |
| API (backend) | http://localhost:5000 |
| Base de données | localhost:5432 |

---

## Structure du projet

```
projet-ro/
├── docker-compose.yml
├── .env                          # Variables d'environnement (non versionné)
├── .env.example                  # Modèle de configuration
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma         # Modèles User et Sheet
│   │   └── migrations/
│   └── src/
│       ├── index.js              # Point d'entrée Express
│       ├── middleware/
│       │   └── auth.js           # Vérification JWT
│       ├── services/
│       │   └── demoucron.js      # Moteur de l'algorithme
│       └── routes/
│           ├── auth.js           # Register, login, reset password
│           └── sheets.js         # CRUD feuilles + déclenchement algorithme
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx               # Routeur principal
        ├── App.css               # Styles globaux
        ├── api.js                # Helper fetch vers l'API
        ├── context/
        │   └── AuthContext.jsx   # Contexte d'authentification
        ├── components/
        │   ├── GraphEditor.jsx   # Éditeur visuel interactif (SVG)
        │   └── GraphViewer.jsx   # Visualisation des chemins minimaux
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── ForgotPassword.jsx
            ├── Dashboard.jsx     # Liste des feuilles
            ├── GraphInput.jsx    # Saisie du graphe
            └── ResultViewer.jsx  # Affichage pas à pas + schéma final
```

---

## Fonctionnalités détaillées

### Authentification

- Inscription avec email + mot de passe (hashé avec bcrypt)
- Connexion avec token JWT valable 7 jours
- Réinitialisation de mot de passe par token (en développement, le token est affiché directement)

### Saisie du graphe

**Éditeur visuel** — Les sommets apparaissent disposés en cercle. Tu peux :
- Glisser-déposer les sommets pour les repositionner
- Cliquer sur un sommet, puis un autre pour tracer un arc
- Saisir la valeur de l'arc dans le popup qui apparaît
- Cliquer sur un arc existant pour le supprimer

**Liste d'arcs** — Saisie manuelle ligne par ligne (sommet de départ, sommet d'arrivée, valeur).

**Matrice d'adjacence** — Grille n×n, laisser vide = +∞.

### Algorithme de Demoucron

L'algorithme calcule les chemins de valeur minimale dans un graphe orienté acyclique pondéré.

**Principe :**

1. Construire la matrice initiale D1 :
   - `V_ij(1) = poids(arc xi→xj)` si l'arc existe
   - `V_ij(1) = +∞` sinon

2. Pour k = 2 à n-1, calculer la matrice Dk :
   - `W_ij(k-1) = V_ik(k-1) + V_kj(k-1)` (chemin via le sommet k)
   - `V_ij(k) = MIN(W_ij(k-1), V_ij(k-1))` (garder le minimum)

3. La matrice finale D(n-1) contient toutes les valeurs minimales.

**Affichage :** navigation étape par étape avec les calculs intermédiaires mis en surbrillance.

### Visualisation finale

- Graphe complet affiché en SVG
- Chaque chemin minimal a sa propre couleur
- Liste des chemins à droite — cliquer sur un chemin l'isole sur le graphe
- Les arcs non utilisés s'estompent

---

## API REST

### Authentification

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| POST | `/api/auth/forgot-password` | Demander un reset |
| POST | `/api/auth/reset-password` | Réinitialiser le mot de passe |

### Feuilles

Toutes les routes nécessitent le header `Authorization: Bearer <token>`.

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/sheets` | Lister ses feuilles |
| GET | `/api/sheets/:id` | Récupérer une feuille avec son résultat |
| POST | `/api/sheets` | Créer une feuille et lancer le calcul |
| DELETE | `/api/sheets/:id` | Supprimer une feuille |

**Corps de la requête POST `/api/sheets` :**

```json
{
  "name": "Exercice 1",
  "vertices": 6,
  "inputMode": "list",
  "arcs": [
    { "from": 1, "to": 2, "value": 3 },
    { "from": 1, "to": 3, "value": 8 }
  ]
}
```

---

## Commandes utiles

```bash
# Démarrer le projet
docker compose up --build

# Démarrer sans rebuild (après le premier lancement)
docker compose up

# Arrêter
docker compose down

# Arrêter et supprimer les données (reset complet)
docker compose down -v

# Voir les logs en temps réel
docker compose logs -f

# Accéder à Prisma Studio (interface BDD)
docker compose exec backend npx prisma studio

# Créer une nouvelle migration après modification du schema
docker compose exec backend npx prisma migrate dev --name nom_migration
```

---

## Modèles de données

### User
```
id              Int       identifiant auto-incrémenté
email           String    unique
password        String    hashé avec bcrypt
resetToken      String?   token de réinitialisation
resetTokenExpiry DateTime? expiration du token
createdAt       DateTime
```

### Sheet
```
id          Int      identifiant auto-incrémenté
name        String   nom donné par l'utilisateur
userId      Int      référence vers User
vertices    Int      nombre de sommets
arcs        Json     liste des arcs [{ from, to, value }]
inputMode   String   "list" | "matrix" | "visual"
result      Json?    résultat complet { matrices, finalMatrix, predecessors }
createdAt   DateTime
updatedAt   DateTime
```

---

## Exemple de test

Graphe à 6 sommets tiré du cours :

| Arc | Valeur |
|---|---|
| x1 → x2 | 3 |
| x1 → x3 | 8 |
| x1 → x4 | 6 |
| x2 → x4 | 2 |
| x2 → x5 | 6 |
| x3 → x5 | 1 |
| x4 → x3 | 2 |
| x4 → x6 | 7 |
| x5 → x6 | 2 |

**Résultat attendu (matrice D5) :**

|   | x1 | x2 | x3 | x4 | x5 | x6 |
|---|---|---|---|---|---|---|
| x1 | +∞ | 3 | 7 | 5 | 8 | 10 |
| x2 | +∞ | +∞ | 4 | 2 | 5 | 7 |
| x3 | +∞ | +∞ | +∞ | +∞ | 1 | 3 |
| x4 | +∞ | +∞ | 2 | +∞ | 3 | 5 |
| x5 | +∞ | +∞ | +∞ | +∞ | +∞ | 2 |
| x6 | +∞ | +∞ | +∞ | +∞ | +∞ | +∞ |

---

## Développement

Le projet utilise des volumes Docker, donc toute modification des fichiers source est **immédiatement reflétée** sans avoir à relancer les conteneurs (hot reload activé pour le frontend via Vite et pour le backend via nodemon).

---

## Auteur

Projet réalisé dans le cadre d'un cours de Recherche Opérationnelle.