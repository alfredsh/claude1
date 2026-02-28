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
        labResults: { include: { parameters: true }, orderBy: { testDate: 'desc' }, take: 5 },
        healthMetrics: { orderBy: { recordedAt: 'desc' }, take: 20 },
        supplements: { where: { isActive: true } },
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
      max_tokens: 1500,
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
  if (patient.height && patient.weight) lines.push(`Рост/Вес: ${patient.height}см / ${patient.weight}кг`);
  if (patient.bloodType) lines.push(`Группа крови: ${patient.bloodType}`);
  if (patient.chronicDiseases?.length) lines.push(`Хронические заболевания: ${patient.chronicDiseases.join(', ')}`);
  if (patient.allergies?.length) lines.push(`Аллергии: ${patient.allergies.join(', ')}`);
  if (patient.medications?.length) lines.push(`Текущие препараты: ${patient.medications.join(', ')}`);

  if (patient.labResults?.length) {
    lines.push('\nПоследние анализы:');
    patient.labResults.slice(0, 3).forEach((lr) => {
      lines.push(`- ${lr.testName} (${new Date(lr.testDate).toLocaleDateString('ru')})`);
      const abnormal = lr.parameters.filter((p) => p.status !== 'NORMAL');
      if (abnormal.length) {
        abnormal.forEach((p) => lines.push(`  ⚠️ ${p.name}: ${p.value} ${p.unit} (${p.status})`));
      }
    });
  }

  if (patient.supplements?.length) {
    lines.push(`\nТекущие назначения: ${patient.supplements.map((s) => `${s.name} ${s.dosage}`).join(', ')}`);
  }

  return lines.join('\n');
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

module.exports = { getPatients, getPatient, addPrescription, addDoctorRecommendation, analyzePatientAI, getDoctorProfile };
