import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { 
  LaBruteLevelSystem, 
  LABRUTE_WEAPONS, 
  LABRUTE_SKILLS,
  LABRUTE_PETS,
  LABRUTE_CONFIG 
} from '../../../src/engine/labrute-complete.js';

const router = Router();

const CreateShackerSchema = z.object({
  name: z.string().min(3),
  gender: z.enum(['male', 'female']),
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const shackers = await prisma.shacker.findMany({ where: { userId } });
  return res.json(shackers);
});

// Route pour obtenir TOUS les Shackers (pour l'arène) - DOIT ÊTRE AVANT /:id
router.get('/all', async (req, res) => {
  try {
    const shackers = await prisma.shacker.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        level: 'desc'
      }
    });
    return res.json(shackers);
  } catch (error) {
    console.error('Error fetching all shackers:', error);
    return res.status(500).json({ error: 'Failed to fetch shackers' });
  }
});

// Route pour obtenir les opposants potentiels (exclut les Shackers de l'utilisateur)
router.get('/opponents', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { shackerId } = req.query;
  
  try {
    // Si un shackerId est fourni, on peut filtrer par niveau similaire
    let whereClause: any = {
      userId: {
        not: userId // Exclure les Shackers de l'utilisateur actuel
      }
    };
    
    if (shackerId) {
      const myShacker = await prisma.shacker.findUnique({
        where: { id: shackerId as string }
      });
      
      if (myShacker) {
        // Chercher des opposants de niveau similaire (+/- 3 niveaux)
        whereClause.level = {
          gte: Math.max(1, myShacker.level - 3),
          lte: myShacker.level + 3
        };
      }
    }
    
    const opponents = await prisma.shacker.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        level: 'desc'
      },
      take: 20 // Limiter à 20 opposants
    });
    
    return res.json(opponents);
  } catch (error) {
    console.error('Error fetching opponents:', error);
    return res.status(500).json({ error: 'Failed to fetch opponents' });
  }
});

// Route pour obtenir la liste des armes disponibles
router.get('/weapons', async (req, res) => {
  return res.json(LABRUTE_WEAPONS);
});

// Route pour obtenir la liste des skills disponibles
router.get('/skills', async (req, res) => {
  return res.json(LABRUTE_SKILLS);
});

// Route pour obtenir la liste des pets disponibles
router.get('/pets', async (req, res) => {
  return res.json(LABRUTE_PETS);
});

// Route pour obtenir un Shacker par ID (pour l'utilisateur connecté)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.userId!;
  
  try {
    const shacker = await prisma.shacker.findFirst({
      where: { 
        id,
        userId // S'assurer que le Shacker appartient à l'utilisateur
      }
    });
    
    if (!shacker) {
      return res.status(404).json({ error: 'Shacker not found' });
    }
    
    return res.json(shacker);
  } catch (error) {
    console.error('Error fetching shacker:', error);
    return res.status(500).json({ error: 'Failed to fetch shacker' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parse = CreateShackerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
    }
  const userId = req.userId!;
  const { name, gender } = parse.data;
  try {
    const shacker = await prisma.shacker.create({
      data: {
        name,
        gender: gender as any,
        userId,
        level: 1,
        xp: 0,
        hp: 50,
        strength: 3,
        agility: 3,
        speed: 3,
        endurance: 3,
        talentPoints: 0,
        unlockedTalents: '[]',
        weapons: '[]',
        skills: '[]',
      },
    });
    return res.status(201).json(shacker);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json({ error: 'Name already taken' });
    }
    return res.status(500).json({ error: 'Failed to create shacker' });
  }
});

// Route pour level up
router.post('/:id/levelup', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { choice } = req.body;
  const userId = req.userId!;
  
  try {
    const shacker = await prisma.shacker.findFirst({
      where: { id, userId }
    });
    
    if (!shacker) {
      return res.status(404).json({ error: 'Shacker not found' });
    }
    
    const levelSystem = new LaBruteLevelSystem();
    const currentLevel = levelSystem.getLevel(shacker.xp);
    const nextLevel = currentLevel + 1;
    
    // Vérifier si le shacker peut level up
    const xpNeeded = levelSystem.xpTable[currentLevel]; // XP pour le prochain niveau
    if (shacker.xp < xpNeeded) {
      return res.status(400).json({ error: 'Not enough XP to level up' });
    }
    
    // Générer les choix disponibles
    const choices = levelSystem.getLevelUpChoices(nextLevel);
    
    // Appliquer le choix sélectionné
    const updateData: any = { level: nextLevel };
    
    if (choice.type === 'stat') {
      updateData[choice.stat] = shacker[choice.stat as keyof typeof shacker] + choice.value;
    } else if (choice.type === 'double_stat') {
      updateData[choice.stat1] = shacker[choice.stat1 as keyof typeof shacker] + choice.value1;
      updateData[choice.stat2] = shacker[choice.stat2 as keyof typeof shacker] + choice.value2;
    } else if (choice.type === 'weapon') {
      const weapons = JSON.parse(shacker.weapons);
      weapons.push(choice.weapon);
      updateData.weapons = JSON.stringify(weapons);
    } else if (choice.type === 'skill') {
      const skills = JSON.parse(shacker.skills);
      skills.push(choice.skill);
      updateData.skills = JSON.stringify(skills);
    } else if (choice.type === 'pet') {
      updateData.pet = choice.pet;
    }
    
    const updatedShacker = await prisma.shacker.update({
      where: { id },
      data: updateData
    });
    
    return res.json(updatedShacker);
  } catch (error) {
    console.error('Level up error:', error);
    return res.status(500).json({ error: 'Failed to level up' });
  }
});

// Route pour obtenir les choix de level up
router.get('/:id/levelup-choices', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.userId!;
  
  try {
    const shacker = await prisma.shacker.findFirst({
      where: { id, userId }
    });
    
    if (!shacker) {
      return res.status(404).json({ error: 'Shacker not found' });
    }
    
    const levelSystem = new LaBruteLevelSystem();
    const currentLevel = levelSystem.getLevel(shacker.xp);
    const nextLevel = currentLevel + 1;
    
    const choices = levelSystem.getLevelUpChoices(nextLevel);
    
    return res.json({
      currentLevel,
      nextLevel,
      xpNeeded: levelSystem.xpTable[currentLevel],
      currentXp: shacker.xp,
      choices
    });
  } catch (error) {
    console.error('Get level up choices error:', error);
    return res.status(500).json({ error: 'Failed to get level up choices' });
  }
});

// Route pour ajouter un pupil
router.post('/:id/pupils', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { pupilId } = req.body;
  const userId = req.userId!;
  
  try {
    // Vérifier que le maître existe et appartient à l'utilisateur
    const master = await prisma.shacker.findFirst({
      where: { id, userId }
    });
    
    if (!master) {
      return res.status(404).json({ error: 'Master not found' });
    }
    
    // Vérifier que le pupil existe
    const pupil = await prisma.shacker.findUnique({
      where: { id: pupilId }
    });
    
    if (!pupil) {
      return res.status(404).json({ error: 'Pupil not found' });
    }
    
    // Vérifier que le pupil n'a pas déjà un maître
    if (pupil.masterId) {
      return res.status(400).json({ error: 'Pupil already has a master' });
    }
    
    // Ajouter le pupil
    const updatedPupil = await prisma.shacker.update({
      where: { id: pupilId },
      data: { masterId: id }
    });
    
    return res.json(updatedPupil);
  } catch (error) {
    console.error('Add pupil error:', error);
    return res.status(500).json({ error: 'Failed to add pupil' });
  }
});


// Route pour obtenir un Shacker par ID (pour voir les détails d'un opposant)
router.get('/:id/details', async (req, res) => {
  const { id } = req.params;
  
  try {
    const shacker = await prisma.shacker.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!shacker) {
      return res.status(404).json({ error: 'Shacker not found' });
    }
    
    return res.json(shacker);
  } catch (error) {
    console.error('Error fetching shacker details:', error);
    return res.status(500).json({ error: 'Failed to fetch shacker details' });
  }
});

export default router;
