const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const { getAIClient, AI_MODEL, SYSTEM_PROMPTS } = require('../config/ai');

const extractPdfText = async (fileUrl) => {
  if (!fileUrl || !fileUrl.toLowerCase().endsWith('.pdf')) return '';
  try {
    const filePath = path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);
    if (!fs.existsSync(filePath)) return '';
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text ? data.text.substring(0, 4000) : '';
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    return '';
  }
};

const uploadLabResult = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const { testName, testDate, parameters } = req.body;
    const fileUrl = req.file ? `/uploads/${req.user.id}/${req.file.filename}` : null;

    const parsedParams = parameters ? JSON.parse(parameters) : [];

    const labResult = await prisma.labResult.create({
      data: {
        patientId: profile.id,
        testName,
        testDate: new Date(testDate),
        fileUrl,
        status: 'processing',
        parameters: {
          create: parsedParams.map((p) => ({
            name: p.name,
            value: parseFloat(p.value),
            unit: p.unit,
            normalMin: p.normalMin ? parseFloat(p.normalMin) : null,
            normalMax: p.normalMax ? parseFloat(p.normalMax) : null,
            status: getParameterStatus(parseFloat(p.value), p.normalMin, p.normalMax),
          })),
        },
      },
      include: { parameters: true },
    });

    // Run AI interpretation asynchronously
    interpretLabResultAI(labResult, profile).catch(console.error);

    res.status(201).json(labResult);
  } catch (err) {
    console.error('Lab upload error:', err);
    res.status(500).json({ error: 'Ошибка загрузки анализа' });
  }
};

const getParameterStatus = (value, min, max) => {
  const hasMin = min !== null && min !== undefined && !isNaN(min);
  const hasMax = max !== null && max !== undefined && !isNaN(max);
  if (!hasMin && !hasMax) return 'NORMAL';
  if (hasMax && value > max * 1.2) return 'CRITICAL';
  if (hasMin && value < min * 0.8) return 'CRITICAL';
  if (hasMax && value > max) return 'HIGH';
  if (hasMin && value < min) return 'LOW';
  return 'NORMAL';
};

const interpretLabResultAI = async (labResult, profile) => {
  try {
    const ai = getAIClient();
    const paramsSummary = labResult.parameters
      .map((p) => `${p.name}: ${p.value} ${p.unit} (норма: ${p.normalMin}-${p.normalMax}, статус: ${p.status})`)
      .join('\n');

    const pdfText = await extractPdfText(labResult.fileUrl);

    let userContent = `Интерпретируй результаты анализа "${labResult.testName}":\n\n`;
    if (paramsSummary) userContent += `Параметры:\n${paramsSummary}\n\n`;
    if (pdfText) userContent += `Содержимое документа:\n${pdfText}\n\n`;
    if (!paramsSummary && !pdfText) userContent += 'Данные анализа не предоставлены.\n\n';
    userContent += 'Дай краткое объяснение для пациента и рекомендации.';

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.labAnalysis },
        { role: 'user', content: userContent },
      ],
      max_tokens: 800,
    });

    const interpretation = completion.choices[0].message.content;

    await prisma.labResult.update({
      where: { id: labResult.id },
      data: { aiInterpretation: interpretation, status: 'completed' },
    });
  } catch (err) {
    console.error('AI interpretation error:', err);
    await prisma.labResult.update({
      where: { id: labResult.id },
      data: { status: 'error' },
    });
  }
};

const getLabResults = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const results = await prisma.labResult.findMany({
      where: { patientId: profile.id },
      include: { parameters: true },
      orderBy: { testDate: 'desc' },
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения анализов' });
  }
};

const getLabResult = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const result = await prisma.labResult.findFirst({
      where: { id: req.params.id, patientId: profile.id },
      include: { parameters: true },
    });
    if (!result) return res.status(404).json({ error: 'Анализ не найден' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения анализа' });
  }
};

const parsePdfLabResults = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

    const fileUrl = `/uploads/${req.user.id}/${req.file.filename}`;
    const filePath = path.join(process.cwd(), fileUrl.slice(1));

    let rawText = '';
    try {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      rawText = (data.text || '').trim();
    } catch (err) {
      console.error('PDF read error:', err.message);
      return res.status(422).json({ error: 'Не удалось прочитать PDF. Возможно, это скан-изображение.' });
    }

    if (!rawText) {
      return res.status(422).json({ error: 'PDF не содержит текста. Загрузите текстовый PDF, не скан.' });
    }

    // Normalize text: collapse excessive whitespace but keep newlines for structure
    const pdfText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{4,}/g, '\n\n\n')
      .substring(0, 50000); // GPT-4o can handle large contexts

    const today = new Date().toISOString().slice(0, 10);

    const ai = getAIClient();
    const completion = await ai.chat.completions.create({
      model: 'gpt-4o', // Always use best model for structured medical extraction
      messages: [
        {
          role: 'system',
          content: `Ты — эксперт по обработке российских медицинских лабораторных документов.
Твоя задача — извлечь ВСЕ показатели из текста и вернуть валидный JSON.

КАТЕГОРИИ АНАЛИЗОВ (определяй автоматически):
• Общий анализ крови (ОАК): гемоглобин, эритроциты, лейкоциты, тромбоциты, СОЭ, гематокрит, нейтрофилы (сег/пал), лимфоциты, моноциты, эозинофилы, базофилы, MCV, MCH, MCHC, RDW, MPV
• Биохимия крови: глюкоза, мочевина, креатинин, мочевая кислота, билирубин (общий/прямой/непрямой), АЛТ, АСТ, ГГТ, ЩФ, ЛДГ, КФК, амилаза, липаза, холестерин, триглицериды, ЛПВП, ЛПНП, ЛПОНП, общий белок, альбумин, глобулины, железо, ферритин, трансферрин, ОЖСС, С-реактивный белок (СРБ/hs-CRP)
• Общий анализ мочи (ОАМ): удельный вес, pH, белок, глюкоза, кетоны, уробилиноген, билирубин, нитриты, лейкоциты, эритроциты, эпителий, цилиндры, слизь, бактерии
• Гормоны щитовидной железы: ТТГ, Т3 общий/свободный, Т4 общий/свободный, антитела к ТПО (АТ-ТПО), антитела к тиреоглобулину (АТ-ТГ), тиреоглобулин
• Половые гормоны: ЛГ, ФСГ, эстрадиол, прогестерон, тестостерон (общий/свободный), пролактин, ДГЭА-с, ГСПГ, АМГ (антимюллеров гормон), ингибин B
• Надпочечники: кортизол, АКТГ, альдостерон, ренин, 17-ОН прогестерон, андростендион
• Онкомаркеры: ПСА (общий/свободный), ХГЧ, АФП, РЭА (CEA), СА-125, СА-19-9, СА-15-3, НСЕ, CYFRA 21-1, SCC, ПРЛ
• Коагулограмма (гемостаз): МНО, ПТВ, ПТИ, протромбин по Квику, АЧТВ, тромбиновое время, фибриноген, Д-димер, антитромбин III, протеин C, протеин S
• Иммунология и инфекции: ЦРБ, ревматоидный фактор, АСЛО, ANA, ANCA, IgG/IgM/IgA/IgE, ВИЧ, гепатит B (HBsAg/Anti-HBs/HBeAg), гепатит C (Anti-HCV), сифилис (RW/RPR), хламидии, микоплазма
• Витамины и микроэлементы: витамин D (25-OH), B12, фолиевая кислота, витамин A, E, B9, кальций, фосфор, магний, калий, натрий, хлор, цинк, медь, селен, йод
• Аллергология: общий IgE, специфические IgE, базофильная активация
• Чек-ап / Check-up: комплексный анализ — раздели на составные группы выше

ФОРМАТЫ РЕФЕРЕНСНЫХ ЗНАЧЕНИЙ — распознавай все:
• Диапазон: "3.5-5.0", "3,5 - 5,0", "3.5–5.0", "от 3.5 до 5.0"
• Только максимум: "<5.0", "< 5,0", "до 5.0", "не более 5.0", "менее 5.0"
• Только минимум: ">1.0", "> 1,0", "более 1.0", "не менее 1.0"
• Без нормы: "—", "-", "н/у", "не определяется" → normalMin: null, normalMax: null

ФОРМАТЫ ЗНАЧЕНИЙ — извлекай только число:
• Числа с запятой: "4,5" → 4.5
• С маркером отклонения: "4.5*", "4.5 H", "4.5 L", "4.5↑", "4.5↓", "↑4.5" → 4.5
• Меньше предела: "<0.1" → 0.05 (половина предела)
• Текстовые для ОАМ: "отрицательный"/"отриц"/"neg" → 0.0; "положительный"/"pos" → 1.0; "следы" → 0.1

ПРАВИЛА:
1. НЕ ПРОПУСКАЙ ни один числовой показатель — лучше включить лишнее, чем пропустить
2. Группируй показатели в логические блоки по категориям выше
3. Если блок называется по-клинически (напр. "Липидный профиль") — используй это название
4. Если в документе несколько дат — у каждой группы своя дата
5. Если дата одна на весь документ — используй её для всех групп
6. Если дата не найдена — "${today}"
7. ВОЗВРАЩАЙ ТОЛЬКО JSON — никаких пояснений, никакого markdown`,
        },
        {
          role: 'user',
          content: `Текст медицинского документа:

${pdfText}

Верни JSON строго в этом формате (массив results может содержать много элементов):
{
  "results": [
    {
      "testName": "Общий анализ крови",
      "testDate": "2026-02-28",
      "parameters": [
        {"name": "Гемоглобин", "value": 135.0, "unit": "г/л", "normalMin": 120.0, "normalMax": 160.0},
        {"name": "Лейкоциты", "value": 6.2, "unit": "10⁹/л", "normalMin": 4.0, "normalMax": 9.0}
      ]
    },
    {
      "testName": "Биохимия крови",
      "testDate": "2026-02-28",
      "parameters": [
        {"name": "Глюкоза", "value": 5.1, "unit": "ммоль/л", "normalMin": 3.9, "normalMax": 6.1}
      ]
    }
  ]
}`,
        },
      ],
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch {
      return res.status(500).json({ error: 'ИИ вернул некорректный ответ. Попробуйте ещё раз.' });
    }

    const resultsData = parsed.results || parsed.labResults || [];
    if (!resultsData.length) {
      return res.status(422).json({ error: 'Анализы в документе не обнаружены. Проверьте формат PDF.' });
    }

    const safeParseFloat = (val) => {
      if (typeof val === 'number') return isNaN(val) ? null : val;
      if (typeof val === 'string') {
        const cleaned = val.replace(',', '.').replace(/[<>≤≥*!↑↓HLhl\s]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      }
      return null;
    };

    const created = [];
    for (const r of resultsData) {
      const params = (r.parameters || [])
        .map((p) => ({ ...p, value: safeParseFloat(p.value) }))
        .filter((p) => p.value !== null);

      if (!params.length) continue; // skip groups with no valid numbers

      const labResult = await prisma.labResult.create({
        data: {
          patientId: profile.id,
          testName: r.testName || 'Анализ из PDF',
          testDate: new Date(r.testDate || Date.now()),
          fileUrl,
          status: 'processing',
          parameters: {
            create: params.map((p) => {
              const min = safeParseFloat(p.normalMin);
              const max = safeParseFloat(p.normalMax);
              return {
                name: p.name,
                value: p.value,
                unit: p.unit || '',
                normalMin: min,
                normalMax: max,
                status: getParameterStatus(p.value, min, max),
              };
            }),
          },
        },
        include: { parameters: true },
      });
      created.push(labResult);
      interpretLabResultAI(labResult, profile).catch(console.error);
    }

    if (!created.length) {
      return res.status(422).json({ error: 'Не удалось извлечь числовые показатели из документа.' });
    }

    res.status(201).json({ count: created.length, results: created });
  } catch (err) {
    console.error('Parse PDF error:', err);
    res.status(500).json({ error: 'Ошибка автоматической обработки PDF' });
  }
};

const deleteLabResult = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const result = await prisma.labResult.findFirst({
      where: { id: req.params.id, patientId: profile.id },
    });
    if (!result) return res.status(404).json({ error: 'Анализ не найден' });

    if (result.fileUrl) {
      const filePath = path.join(process.cwd(), result.fileUrl.startsWith('/') ? result.fileUrl.slice(1) : result.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.labResult.delete({ where: { id: result.id } });
    res.json({ message: 'Анализ удалён' });
  } catch (err) {
    console.error('Delete lab error:', err);
    res.status(500).json({ error: 'Ошибка удаления анализа' });
  }
};

module.exports = { uploadLabResult, getLabResults, getLabResult, deleteLabResult, parsePdfLabResults };
