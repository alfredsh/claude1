const prisma = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        labResults: { orderBy: { testDate: 'desc' }, take: 5 },
        healthMetrics: { orderBy: { recordedAt: 'desc' }, take: 20 },
        recommendations: { orderBy: { createdAt: 'desc' }, take: 10 },
        supplements: { where: { isActive: true } },
      },
    });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      firstName, lastName, dateOfBirth, gender, height, weight,
      bloodType, phone, allergies, chronicDiseases, medications,
      goals, activityLevel, dietType, smokingStatus, alcoholUsage,
      sleepHours, stressLevel,
    } = req.body;

    const profile = await prisma.patientProfile.update({
      where: { userId: req.user.id },
      data: {
        firstName, lastName, gender, bloodType, phone,
        activityLevel, dietType, smokingStatus, alcoholUsage,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        stressLevel: stressLevel ? parseInt(stressLevel) : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        allergies: allergies || [],
        chronicDiseases: chronicDiseases || [],
        medications: medications || [],
        goals: goals || [],
      },
    });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
};

const addHealthMetric = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const { type, value, unit, note } = req.body;
    const metric = await prisma.healthMetric.create({
      data: { patientId: profile.id, type, value: parseFloat(value), unit, note },
    });
    res.status(201).json(metric);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления метрики' });
  }
};

const getHealthMetrics = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const { type, days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const metrics = await prisma.healthMetric.findMany({
      where: {
        patientId: profile.id,
        recordedAt: { gte: since },
        ...(type ? { type } : {}),
      },
      orderBy: { recordedAt: 'asc' },
    });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения метрик' });
  }
};

const getSupplements = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const supplements = await prisma.supplement.findMany({
      where: { patientId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(supplements);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения добавок' });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const recommendations = await prisma.recommendation.findMany({
      where: { patientId: profile.id },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения рекомендаций' });
  }
};

const addNutritionLog = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const { mealType, foodName, calories, protein, carbs, fats, fiber } = req.body;
    const log = await prisma.nutritionLog.create({
      data: {
        patientId: profile.id, mealType, foodName,
        calories: calories ? parseFloat(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fats: fats ? parseFloat(fats) : null,
        fiber: fiber ? parseFloat(fiber) : null,
      },
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка записи питания' });
  }
};

const getNutritionLogs = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const { days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const logs = await prisma.nutritionLog.findMany({
      where: { patientId: profile.id, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения дневника питания' });
  }
};

module.exports = {
  getProfile, updateProfile, addHealthMetric, getHealthMetrics,
  getSupplements, getRecommendations, addNutritionLog, getNutritionLogs,
};
