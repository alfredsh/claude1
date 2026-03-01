const prisma = require('../config/database');
const { getAIClient, AI_MODEL, SYSTEM_PROMPTS } = require('../config/ai');

const getPatients = async (req, res) => {
  try {
    const { search } = req.query;

    const patients = await prisma.patientProfile.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {},
      include: {
        user: { select: { email: true, createdAt: true } },
        labResults: { orderBy: { testDate: 'desc' }, take: 1 },
        healthMetrics: { orderBy: { recordedAt: 'desc' }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения списка пациентов' });
  }
};

const getPatient = async (req, res) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, createdAt: true } },
        labResults: { include: { parameters: true }, orderBy: { testDate: 'desc' } },
        healthMetrics: { orderBy: { recordedAt: 'desc' }, take: 50 },
        recommendations: { orderBy: { createdAt: 'desc' } },
        supplements: true,
        nutritionLogs: { orderBy: { loggedAt: 'desc' }, take: 20 },
        geneticData: true,
      },
    });
    if (!patient) return res.status(404).json({ error: 'Пациент не найден' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения данных пациента' });
  }
};

const addPrescription = async (req, res) => {
  try {
    const { patientId, name, dosage, frequency, reason, startDate, endDate } = req.body;

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
    const prescribedBy = doctorProfile ? `${doctorProfile.firstName} ${doctorProfile.lastName}` : 'Врач';

    const supplement = await prisma.supplement.create({
      data: {
        patientId,
        name,
        dosage,
        frequency,
        reason,
        prescribedBy,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    res.status(201).json(supplement);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления назначения' });
  }
};

const addDoctorRecommendation = async (req, res) => {
  try {
    const { patientId, category, title, description, priority } = req.body;

    const recommendation = await prisma.recommendation.create({
      data: {
        patientId,
        category: category || 'врач',
        title,
        description,
        priority: priority || 'high',
        source: 'doctor',
      },
    });
    res.status(201).json(recommendation);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления рекомендации' });
  }
};

const analyzePatientAI = async (req, res) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: req.params.id },
      include: {
        labResults:      { include: { parameters: true }, orderBy: { testDate: 'desc' }, take: 5 },
        healthMetrics:   { orderBy: { recordedAt: 'desc' }, take: 20 },
        supplements:     { where: { isActive: true } },
        medicalDocuments:{ orderBy: { docDate: 'desc' }, take: 10 },
        recommendations: { orderBy: { createdAt: 'desc' }, take: 10 },
        nutritionLogs:   { orderBy: { loggedAt: 'desc' }, take: 7 },
        geneticData:     true,
      },
    });
    if (!patient) return res.status(404).json({ error: 'Пациент не найден' });

    const context = buildFullPatientSummary(patient);
    const ai = getAIClient();

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.doctorAssistant },
        {
          role: 'user',
          content: `Проанализируй данные пациента и дай клиническое заключение с рекомендациями по дальнейшему лечению:\n\n${context}`,
        },
      ],
      max_tokens: 2000,
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (err) {
    console.error('Doctor AI analysis error:', err);
    res.status(500).json({ error: 'Ошибка анализа пациента' });
  }
};

const buildFullPatientSummary = (patient) => {
  const lines = [`Пациент: ${patient.firstName} ${patient.lastName}`];
  if (patient.gender) lines.push(`Пол: ${patient.gender}`);
  if (patient.dateOfBirth) {
    const age = Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
    lines.push(`Возраст: ${age} лет`);
  }
  if (patient.height && patient.weight) {
    const bmi = (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1);
    lines.push(`Рост/Вес/ИМТ: ${patient.height}см / ${patient.weight}кг / ${bmi}`);
  }
  if (patient.bloodType)  lines.push(`Группа крови: ${patient.bloodType}`);
  if (patient.chronicDiseases?.length) lines.push(`Хронические заболевания: ${patient.chronicDiseases.join(', ')}`);
  if (patient.allergies?.length)       lines.push(`Аллергии: ${patient.allergies.join(', ')}`);
  if (patient.medications?.length)     lines.push(`Постоянные препараты: ${patient.medications.join(', ')}`);

  // Lifestyle
  const lifestyle = [
    patient.activityLevel  && `активность: ${patient.activityLevel}`,
    patient.dietType       && `питание: ${patient.dietType}`,
    patient.sleepHours     && `сон: ${patient.sleepHours}ч`,
    patient.stressLevel    && `стресс: ${patient.stressLevel}/10`,
    patient.smokingStatus  && `курение: ${patient.smokingStatus}`,
    patient.alcoholUsage   && `алкоголь: ${patient.alcoholUsage}`,
  ].filter(Boolean);
  if (lifestyle.length) lines.push(`Образ жизни: ${lifestyle.join(', ')}`);

  if (patient.healthGoals?.length) lines.push(`Цели здоровья: ${patient.healthGoals.join(', ')}`);

  // Lab results — all parameters, mark abnormal
  if (patient.labResults?.length) {
    lines.push('\n--- ЛАБОРАТОРНЫЕ АНАЛИЗЫ ---');
    patient.labResults.forEach((lr) => {
      lines.push(`${lr.testName} (${new Date(lr.testDate).toLocaleDateString('ru')}):`);
      if (lr.parameters?.length) {
        lr.parameters.forEach((p) => {
          const flag = p.status !== 'NORMAL' ? ` ⚠️ ${p.status}` : '';
          lines.push(`  ${p.name}: ${p.value} ${p.unit}${flag}`);
        });
      }
      if (lr.aiInterpretation) lines.push(`  ИИ-интерпретация: ${lr.aiInterpretation.substring(0, 200)}`);
    });
  }

  // Health metrics — latest values per type
  if (patient.healthMetrics?.length) {
    lines.push('\n--- ПОКАЗАТЕЛИ ЗДОРОВЬЯ (последние) ---');
    const seen = new Set();
    patient.healthMetrics.forEach((m) => {
      if (!seen.has(m.metricType)) {
        seen.add(m.metricType);
        lines.push(`  ${m.metricType}: ${m.value} ${m.unit || ''} (${new Date(m.recordedAt).toLocaleDateString('ru')})`);
      }
    });
  }

  // Medical documents
  if (patient.medicalDocuments?.length) {
    lines.push('\n--- МЕДИЦИНСКИЕ ИССЛЕДОВАНИЯ ---');
    patient.medicalDocuments.forEach((d) => {
      const date = new Date(d.docDate).toLocaleDateString('ru');
      lines.push(`${d.docType} «${d.title}» (${date}), статус: ${d.status}`);
      if (d.aiSummary) lines.push(`  Заключение: ${d.aiSummary.substring(0, 300)}`);
      if (d.measurements && Object.keys(d.measurements).length) {
        const mStr = Object.entries(d.measurements)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`)
          .join(', ');
        if (mStr) lines.push(`  Показатели: ${mStr}`);
      }
    });
  }

  // Active supplements / prescriptions
  if (patient.supplements?.length) {
    lines.push('\n--- НАЗНАЧЕНИЯ ---');
    patient.supplements.forEach((s) => {
      lines.push(`  ${s.name} ${s.dosage}, ${s.frequency}${s.reason ? ` (${s.reason})` : ''}`);
    });
  }

  // Recent nutrition (average summary)
  if (patient.nutritionLogs?.length) {
    lines.push('\n--- ПИТАНИЕ (последние записи) ---');
    const avg = (arr, key) => {
      const vals = arr.map(x => x[key]).filter(Boolean);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    };
    const avgCal = avg(patient.nutritionLogs, 'calories');
    const avgP   = avg(patient.nutritionLogs, 'protein');
    const avgF   = avg(patient.nutritionLogs, 'fat');
    const avgC   = avg(patient.nutritionLogs, 'carbs');
    if (avgCal) lines.push(`  Среднее за ${patient.nutritionLogs.length} дн.: ${avgCal} ккал, белки ${avgP}г, жиры ${avgF}г, углеводы ${avgC}г`);
  }

  // Genetic data
  if (patient.geneticData) {
    const g = patient.geneticData;
    lines.push('\n--- ГЕНЕТИЧЕСКИЕ ДАННЫЕ ---');
    if (g.haplotypeGroup) lines.push(`  Гаплогруппа: ${g.haplotypeGroup}`);
    if (g.geneticRisks?.length) lines.push(`  Генетические риски: ${g.geneticRisks.join(', ')}`);
    if (g.protectiveFactors?.length) lines.push(`  Протективные факторы: ${g.protectiveFactors.join(', ')}`);
    if (g.drugResponse) lines.push(`  Фармакогенетика: ${JSON.stringify(g.drugResponse).substring(0, 200)}`);
  }

  // Active recommendations
  if (patient.recommendations?.length) {
    lines.push('\n--- ТЕКУЩИЕ РЕКОМЕНДАЦИИ ---');
    patient.recommendations.slice(0, 5).forEach((r) => {
      lines.push(`  [${r.priority.toUpperCase()}] ${r.title}: ${r.description?.substring(0, 120) || ''}`);
    });
  }

  return lines.join('\n');
};

const getPatientDocs = async (req, res) => {
  try {
    const docs = await prisma.medicalDocument.findMany({
      where: { patientId: req.params.id },
      orderBy: { docDate: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения документов пациента' });
  }
};

const getDoctorProfile = async (req, res) => {
  try {
    const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль врача не найден' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения профиля врача' });
  }
};

module.exports = { getPatients, getPatient, addPrescription, addDoctorRecommendation, analyzePatientAI, getDoctorProfile, getPatientDocs };
