const prisma = require('../config/database');
const path = require('path');
const fs = require('fs');
const { getAIClient } = require('../config/ai');

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

    const { mealType, foodName, calories, protein, carbs, fats, fiber, imageUrl } = req.body;
    const log = await prisma.nutritionLog.create({
      data: {
        patientId: profile.id, mealType, foodName,
        calories: calories ? parseFloat(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fats: fats ? parseFloat(fats) : null,
        fiber: fiber ? parseFloat(fiber) : null,
        imageUrl: imageUrl || null,
      },
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка записи питания' });
  }
};

// POST /api/patient/nutrition/analyze-photo
const analyzeNutritionPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Фото не загружено' });

    const fileUrl  = `/uploads/${req.user.id}/${req.file.filename}`;
    const filePath = path.join(process.cwd(), 'uploads', req.user.id, req.file.filename);
    const ext      = path.extname(req.file.originalname || req.file.filename).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    const base64   = fs.readFileSync(filePath).toString('base64');

    const ai = getAIClient();
    const completion = await ai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Ты — диетолог и нутрициолог. Анализируй фото еды и возвращай ТОЛЬКО валидный JSON.

ПОЛЯ ответа:
- foodName: название блюда или блюд на русском (кратко, 2-6 слов)
- calories: калорийность ккал (число)
- protein: белки г (число)
- carbs: углеводы г (число)
- fats: жиры г (число)
- fiber: клетчатка г (число, 0 если не видно)
- confidence: уверенность — "low" | "medium" | "high"
- notes: краткий комментарий на русском (порция, особенности оценки)

Если на фото несколько блюд — суммируй всё. Оценивай стандартную порцию.
Если это не еда — верни {"error": "not_food"}.
ТОЛЬКО JSON, без пояснений вне JSON.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
            },
            { type: 'text', text: 'Определи состав и КБЖУ этого блюда. Верни JSON.' },
          ],
        },
      ],
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    if (parsed.error === 'not_food') {
      return res.status(422).json({ error: 'На фото не обнаружено еды' });
    }

    res.json({
      foodName:   parsed.foodName   || 'Блюдо',
      calories:   parsed.calories   ?? null,
      protein:    parsed.protein    ?? null,
      carbs:      parsed.carbs      ?? null,
      fats:       parsed.fats       ?? null,
      fiber:      parsed.fiber      ?? 0,
      confidence: parsed.confidence || 'medium',
      notes:      parsed.notes      || null,
      imageUrl:   fileUrl,
    });
  } catch (err) {
    console.error('Nutrition photo analysis error:', err);
    res.status(500).json({ error: 'Ошибка анализа фото' });
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

// POST /api/patient/nutrition/analyze-menu
const analyzeMenuPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Фото не загружено' });

    // ── Collect full patient health context ──────────────────────────────────
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        labResults: {
          orderBy: { testDate: 'desc' },
          take: 2,
          include: { parameters: { where: { isAbnormal: true }, take: 20 } },
        },
        healthMetrics: { orderBy: { recordedAt: 'desc' }, take: 30 },
        supplements: { where: { isActive: true } },
        nutritionLogs: {
          where: { loggedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          orderBy: { loggedAt: 'desc' },
        },
        geneticData: true,
      },
    });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    // Build concise context string
    const age = profile.dateOfBirth
      ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null;

    const lines = ['=== ПРОФИЛЬ ПАЦИЕНТА ==='];
    if (age) lines.push(`Возраст: ${age} лет`);
    if (profile.gender) lines.push(`Пол: ${profile.gender}`);
    if (profile.height) lines.push(`Рост: ${profile.height} см`);
    if (profile.weight) lines.push(`Вес: ${profile.weight} кг`);
    if (profile.height && profile.weight) {
      const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
      lines.push(`ИМТ: ${bmi}`);
    }
    if (profile.bloodType) lines.push(`Группа крови: ${profile.bloodType}`);
    if (profile.activityLevel) lines.push(`Активность: ${profile.activityLevel}`);
    if (profile.dietType) lines.push(`Тип питания/диета: ${profile.dietType}`);
    if (profile.goals?.length) lines.push(`Цели: ${profile.goals.join(', ')}`);
    if (profile.allergies?.length) lines.push(`АЛЛЕРГИИ: ${profile.allergies.join(', ')}`);
    if (profile.chronicDiseases?.length) lines.push(`Хронические заболевания: ${profile.chronicDiseases.join(', ')}`);
    if (profile.medications?.length) lines.push(`Препараты: ${profile.medications.join(', ')}`);
    if (profile.smokingStatus) lines.push(`Курение: ${profile.smokingStatus}`);
    if (profile.alcoholUsage) lines.push(`Алкоголь: ${profile.alcoholUsage}`);
    if (profile.stressLevel) lines.push(`Уровень стресса: ${profile.stressLevel}/10`);
    if (profile.sleepHours) lines.push(`Сон: ${profile.sleepHours} ч/сутки`);

    // Today's nutrition intake
    if (profile.nutritionLogs.length) {
      const todayCal = profile.nutritionLogs.reduce((s, l) => s + (l.calories || 0), 0);
      const todayProt = profile.nutritionLogs.reduce((s, l) => s + (l.protein || 0), 0);
      const todayCarbs = profile.nutritionLogs.reduce((s, l) => s + (l.carbs || 0), 0);
      const todayFats = profile.nutritionLogs.reduce((s, l) => s + (l.fats || 0), 0);
      const meals = profile.nutritionLogs.map(l => l.foodName).join(', ');
      lines.push(`\n=== ПИТАНИЕ СЕГОДНЯ ===`);
      lines.push(`Уже съедено: ${Math.round(todayCal)} ккал (Б:${Math.round(todayProt)}г У:${Math.round(todayCarbs)}г Ж:${Math.round(todayFats)}г)`);
      lines.push(`Блюда: ${meals}`);
    } else {
      lines.push(`\n=== ПИТАНИЕ СЕГОДНЯ ===\nСегодня ещё ничего не ел(а).`);
    }

    // Active supplements
    if (profile.supplements.length) {
      lines.push(`\n=== АКТИВНЫЕ БАД И ПРЕПАРАТЫ ===`);
      profile.supplements.forEach(s => {
        lines.push(`  ${s.name} ${s.dosage || ''} — ${s.reason || ''}`);
      });
    }

    // Abnormal lab values
    const abnormalParams = profile.labResults.flatMap(lr => lr.parameters);
    if (abnormalParams.length) {
      lines.push(`\n=== ОТКЛОНЕНИЯ В АНАЛИЗАХ ===`);
      abnormalParams.slice(0, 15).forEach(p => {
        lines.push(`  ${p.name}: ${p.value} ${p.unit || ''} (норма: ${p.normalRange || '?'}) — ${p.status}`);
      });
    }

    // Latest health metrics (last value of each type)
    if (profile.healthMetrics.length) {
      const latestByType: Record<string, any> = {};
      profile.healthMetrics.forEach(m => {
        if (!latestByType[m.type]) latestByType[m.type] = m;
      });
      lines.push(`\n=== ПОСЛЕДНИЕ ПОКАЗАТЕЛИ ===`);
      Object.values(latestByType).forEach((m: any) => {
        lines.push(`  ${m.type}: ${m.value} ${m.unit || ''}`);
      });
    }

    // Genetic risks
    if (profile.geneticData?.riskFactors) {
      lines.push(`\n=== ГЕНЕТИЧЕСКИЕ РИСКИ ===`);
      lines.push(JSON.stringify(profile.geneticData.riskFactors).slice(0, 500));
    }

    const contextText = lines.join('\n');

    // ── Call AI ──────────────────────────────────────────────────────────────
    const filePath = require('path').join(process.cwd(), 'uploads', req.user.id, req.file.filename);
    const ext = require('path').extname(req.file.originalname || req.file.filename).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    const base64 = fs.readFileSync(filePath).toString('base64');

    const ai = getAIClient();
    const completion = await ai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Ты — персональный нутрициолог-диетолог с медицинским образованием.
Пациент прислал фото меню ресторана. Твоя задача — дать персонализированные рекомендации
что заказать, основываясь на его состоянии здоровья, образе жизни и рационе питания сегодня.

Правила:
1. Учитывай аллергии как абсолютные противопоказания
2. Учитывай уже съеденное сегодня — балансируй БЖУ и калории
3. Учитывай хронические заболевания, отклонения в анализах, принимаемые БАД
4. Учитывай цели пациента (похудение, набор мышц, контроль сахара и т.д.)
5. Если диета пациента не указана — ориентируйся на здоровое питание
6. Давай конкретные практические советы (порция, способ приготовления)

Верни ТОЛЬКО валидный JSON без пояснений вне JSON:
{
  "personalNote": "Краткий персональный совет (2-3 предложения) с учётом сегодняшнего рациона и состояния",
  "caloriesBudget": число (примерный остаток калорий на этот приём пищи) или null,
  "topPicks": ["название1", "название2"] (2-4 лучших выбора с меню),
  "items": [
    {
      "name": "точное название блюда с меню",
      "category": "recommended" | "moderate" | "avoid",
      "reason": "краткое объяснение (1 предложение)",
      "tip": "совет по порции или модификации (необязательно)"
    }
  ],
  "avoidSummary": "что и почему избегать в этом заведении (1-2 предложения)" или null,
  "balanceNote": "как этот приём пищи вписывается в дневной рацион" или null
}

Если на фото не меню, верни {"error": "not_menu"}.
Постарайся распознать максимум блюд из меню. Если текст частично нечитаем — распознай что можешь.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `Вот данные о пациенте:\n\n${contextText}\n\nПроанализируй меню на фото и дай персонализированные рекомендации. Верни JSON.`,
            },
          ],
        },
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    if (parsed.error === 'not_menu') {
      return res.status(422).json({ error: 'На фото не обнаружено меню ресторана' });
    }

    res.json({
      personalNote:   parsed.personalNote   || null,
      caloriesBudget: parsed.caloriesBudget ?? null,
      topPicks:       parsed.topPicks       || [],
      items:          parsed.items          || [],
      avoidSummary:   parsed.avoidSummary   || null,
      balanceNote:    parsed.balanceNote    || null,
    });
  } catch (err) {
    console.error('Menu analysis error:', err);
    res.status(500).json({ error: 'Ошибка анализа меню' });
  }
};

module.exports = {
  getProfile, updateProfile, addHealthMetric, getHealthMetrics,
  getSupplements, getRecommendations, addNutritionLog, getNutritionLogs,
  analyzeNutritionPhoto, analyzeMenuPhoto,
};
