const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { demoucron } = require('../services/demoucron');

const router = express.Router();
const prisma = new PrismaClient();

// Toutes les routes nécessitent auth
router.use(authMiddleware);

// GET /api/sheets — lister les feuilles de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const sheets = await prisma.sheet.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, vertices: true,
        inputMode: true, createdAt: true, updatedAt: true,
      },
    });
    res.json(sheets);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sheets/:id — récupérer une feuille avec son résultat
router.get('/:id', async (req, res) => {
  try {
    const sheet = await prisma.sheet.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!sheet) return res.status(404).json({ error: 'Feuille introuvable' });
    res.json(sheet);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/sheets — créer une feuille et lancer l'algorithme
router.post('/', async (req, res) => {
  const { name, vertices, arcs, inputMode } = req.body;

  if (!name || !vertices || !arcs)
    return res.status(400).json({ error: 'Champs manquants' });

  if (vertices < 2 || vertices > 20)
    return res.status(400).json({ error: 'Nombre de sommets entre 2 et 20' });

  if (!Array.isArray(arcs) || arcs.length === 0)
    return res.status(400).json({ error: 'Au moins un arc requis' });

  // Validation des arcs
  for (const arc of arcs) {
    if (arc.from < 1 || arc.from > vertices || arc.to < 1 || arc.to > vertices)
      return res.status(400).json({ error: `Arc invalide: sommet hors limites` });
    if (arc.from === arc.to)
      return res.status(400).json({ error: `Arc invalide: boucle sur sommet ${arc.from}` });
    if (typeof arc.value !== 'number' || arc.value < 0)
      return res.status(400).json({ error: `Arc invalide: valeur doit être un nombre ≥ 0` });
  }

  try {
    // Lancer l'algorithme
    const result = demoucron(vertices, arcs);

    // Sérialiser Infinity
    const serializedResult = JSON.parse(
      JSON.stringify(result, (key, val) => (val === Infinity ? '+∞' : val))
    );

    const sheet = await prisma.sheet.create({
      data: {
        name,
        userId: req.userId,
        vertices,
        arcs,
        inputMode: inputMode || 'list',
        result: serializedResult,
      },
    });
    res.status(201).json(sheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du calcul' });
  }
});

// DELETE /api/sheets/:id — supprimer une feuille
router.delete('/:id', async (req, res) => {
  try {
    const sheet = await prisma.sheet.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!sheet) return res.status(404).json({ error: 'Feuille introuvable' });

    await prisma.sheet.delete({ where: { id: sheet.id } });
    res.json({ message: 'Feuille supprimée' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;