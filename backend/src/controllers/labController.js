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
  if (min === null || min === undefined || max === null || max === undefined) return 'NORMAL';
  if (value < min * 0.8 || value > max * 1.2) return 'CRITICAL';
  if (value < min) return 'LOW';
  if (value > max) return 'HIGH';
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

module.exports = { uploadLabResult, getLabResults, getLabResult, deleteLabResult };
