const prisma = require('../config/database');
const { getAIClient, AI_MODEL, SYSTEM_PROMPTS } = require('../config/ai');

const chat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

    // Get patient context
    let patientContext = '';
    if (req.user.role === 'PATIENT') {
      const profile = await prisma.patientProfile.findUnique({
        where: { userId: req.user.id },
        include: {
          labResults:       { orderBy: { testDate: 'desc' }, take: 3, include: { parameters: true } },
          medicalDocuments: { orderBy: { docDate: 'desc' }, take: 5, select: { docType: true, title: true, docDate: true, aiSummary: true } },
          healthMetrics:    { orderBy: { recordedAt: 'desc' }, take: 10 },
          supplements:      { where: { isActive: true } },
        },
      });

      if (profile) {
        patientContext = buildPatientContext(profile);
      }
    }

    // Get or create chat session
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: req.user.id },
      });
    }

    const history = session ? session.messages : [];

    const messages = [
      {
        role: 'system',
        content: req.user.role === 'DOCTOR'
          ? SYSTEM_PROMPTS.doctorAssistant
          : `${SYSTEM_PROMPTS.healthCoach}\n\nДанные пациента:\n${patientContext}`,
      },
      ...history,
      { role: 'user', content: message },
    ];

    const ai = getAIClient();
    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0].message.content;

    // Save session
    const newHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage },
    ].slice(-20); // Keep last 20 messages

    if (session) {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { messages: newHistory, updatedAt: new Date() },
      });
    } else {
      session = await prisma.chatSession.create({
        data: {
          userId: req.user.id,
          title: message.substring(0, 50),
          messages: newHistory,
        },
      });
    }

    res.json({ response: assistantMessage, sessionId: session.id });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Ошибка ИИ-ассистента. Проверьте настройки API.' });
  }
};

const buildPatientContext = (profile) => {
  const lines = [];
  if (profile.firstName) lines.push(`Имя: ${profile.firstName} ${profile.lastName}`);
  if (profile.dateOfBirth) {
    const age = Math.floor((Date.now() - new Date(profile.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
    lines.push(`Возраст: ${age} лет`);
  }
  if (profile.gender) lines.push(`Пол: ${profile.gender}`);
  if (profile.height && profile.weight) {
    const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
    lines.push(`Рост: ${profile.height} см, Вес: ${profile.weight} кг, ИМТ: ${bmi}`);
  }
  if (profile.bloodType) lines.push(`Группа крови: ${profile.bloodType}`);
  if (profile.chronicDiseases?.length) lines.push(`Хронические заболевания: ${profile.chronicDiseases.join(', ')}`);
  if (profile.allergies?.length) lines.push(`Аллергии: ${profile.allergies.join(', ')}`);
  if (profile.activityLevel) lines.push(`Уровень активности: ${profile.activityLevel}`);
  if (profile.sleepHours) lines.push(`Сон: ${profile.sleepHours} ч/сут`);
  if (profile.stressLevel) lines.push(`Уровень стресса: ${profile.stressLevel}/10`);

  if (profile.healthMetrics?.length) {
    const latest = {};
    profile.healthMetrics.forEach((m) => {
      if (!latest[m.type]) latest[m.type] = m;
    });
    const metricStr = Object.values(latest).map((m) => `${m.type}: ${m.value} ${m.unit}`).join(', ');
    lines.push(`Последние показатели: ${metricStr}`);
  }

  if (profile.supplements?.length) {
    lines.push(`Текущие добавки: ${profile.supplements.map((s) => `${s.name} (${s.dosage})`).join(', ')}`);
  }

  if (profile.labResults?.length) {
    const labLines = profile.labResults.map((lab) => {
      const dateStr = new Date(lab.testDate).toLocaleDateString('ru-RU');
      const params = lab.parameters?.length
        ? lab.parameters.map((p) => `${p.name}: ${p.value} ${p.unit} (${p.status})`).join(', ')
        : 'параметры не введены';
      return `  - ${lab.testName} (${dateStr}): ${params}`;
    });
    lines.push(`Последние анализы:\n${labLines.join('\n')}`);
  }

  if (profile.medicalDocuments?.length) {
    const docLines = profile.medicalDocuments.map((d) => {
      const dateStr = new Date(d.docDate).toLocaleDateString('ru-RU');
      const summary = d.aiSummary ? d.aiSummary.substring(0, 200) : 'заключение обрабатывается';
      return `  - ${d.docType} "${d.title}" (${dateStr}): ${summary}`;
    });
    lines.push(`Медицинские исследования:\n${docLines.join('\n')}`);
  }

  return lines.join('\n');
};

const getChatSessions = async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.id },
      select: { id: true, title: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения сессий чата' });
  }
};

const getChatSession = async (req, res) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!session) return res.status(404).json({ error: 'Сессия не найдена' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения сессии' });
  }
};

const generateRecommendations = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        labResults: { orderBy: { testDate: 'desc' }, take: 3, include: { parameters: true } },
        healthMetrics: { orderBy: { recordedAt: 'desc' }, take: 10 },
      },
    });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const context = buildPatientContext(profile);
    const ai = getAIClient();

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.healthCoach },
        {
          role: 'user',
          content: `На основе данных пациента создай 5 персональных рекомендаций в формате JSON массива с полями: category (питание/активность/сон/стресс/нутриенты), title, description, priority (high/medium/low).\n\nДанные:\n${context}`,
        },
      ],
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    let recommendations = [];
    try {
      const parsed = JSON.parse(completion.choices[0].message.content);
      recommendations = parsed.recommendations || parsed;
    } catch {
      recommendations = [];
    }

    // Save recommendations
    await prisma.recommendation.deleteMany({
      where: { patientId: profile.id, source: 'ai' },
    });

    for (const rec of recommendations) {
      await prisma.recommendation.create({
        data: {
          patientId: profile.id,
          category: rec.category || 'общее',
          title: rec.title,
          description: rec.description,
          priority: rec.priority || 'medium',
          source: 'ai',
        },
      });
    }

    res.json({ message: 'Рекомендации обновлены', count: recommendations.length });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Ошибка генерации рекомендаций' });
  }
};

const getAISettings = async (req, res) => {
  res.json({
    baseUrl: process.env.AI_API_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-4o',
    isConfigured: !!(process.env.AI_API_KEY && process.env.AI_API_KEY !== 'sk-your-api-key-here'),
  });
};

module.exports = { chat, getChatSessions, getChatSession, generateRecommendations, getAISettings };
