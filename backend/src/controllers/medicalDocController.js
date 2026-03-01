const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const { getAIClient } = require('../config/ai');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MIME_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

const DOC_TYPE_LABELS = {
  ECG:         'ЭКГ',
  ULTRASOUND:  'УЗИ',
  CT:          'КТ',
  MRI:         'МРТ',
  SPIROMETRY:  'Спирометрия',
  XRAY:        'Рентген',
  OTHER:       'Другое исследование',
};

// Per-type extraction instructions injected into the unified prompt
const TYPE_INSTRUCTIONS = {
  ECG: `Это ЭКГ (электрокардиограмма). Извлеки:
- heartRate: частота сердечных сокращений (уд/мин)
- rhythm: описание ритма (синусовый, фибрилляция и т.д.)
- pqInterval: интервал PQ (с)
- qrsComplex: комплекс QRS (с)
- qtInterval: интервал QT/QTc (с)
- electricAxis: электрическая ось сердца
- conclusion: заключение из документа`,

  ULTRASOUND: `Это заключение УЗИ. Извлеки:
- organ: орган или область исследования
- findings: массив строк — основные находки (размеры, эхогенность, структура)
- conclusion: заключение из документа`,

  CT: `Это заключение КТ (компьютерной томографии). Извлеки:
- area: область исследования
- contrast: с контрастированием или без
- findings: массив строк — основные находки
- conclusion: заключение из документа`,

  MRI: `Это заключение МРТ (магнитно-резонансной томографии). Извлеки:
- area: область исследования
- sequences: режимы (T1, T2, FLAIR и т.д., если указаны)
- findings: массив строк — основные находки
- conclusion: заключение из документа`,

  SPIROMETRY: `Это результаты спирометрии. Извлеки:
- fvc: ФЖЕЛ / FVC (л или % от должного)
- fev1: ОФВ1 / FEV1 (л или % от должного)
- fev1fvc: соотношение ОФВ1/ФЖЕЛ (%)
- pef: ПСВ / PEF (л/с, если есть)
- conclusion: заключение / тип нарушения вентиляции`,

  XRAY: `Это рентгенограмма. Извлеки:
- area: область исследования (органы грудной клетки, кости и т.д.)
- projection: проекция (прямая, боковая, если указана)
- findings: массив строк — основные находки
- conclusion: заключение из документа`,

  OTHER: `Это медицинский документ. Извлеки все ключевые данные:
- type: тип исследования как указано в документе
- findings: массив строк — основные данные и показатели
- conclusion: заключение из документа`,
};

const buildSystemPrompt = (docType, today) => `Ты — опытный медицинский эксперт. Анализируй медицинские документы и возвращай ТОЛЬКО валидный JSON без пояснений.

${TYPE_INSTRUCTIONS[docType] || TYPE_INSTRUCTIONS.OTHER}

ПРАВИЛА:
1. title: конкретное название исследования (напр. "УЗИ органов брюшной полости", "ЭКГ в покое 12 отведений")
2. docDate: дата из документа в формате YYYY-MM-DD; если не найдена — "${today}"
3. summary: понятное объяснение для пациента — что показало исследование, что в норме, что требует внимания (3-6 предложений на русском)
4. measurements: объект с ключевыми данными согласно инструкции выше; если данные не найдены — пустой объект {}
5. ТОЛЬКО JSON — без markdown, без пояснений вне JSON`;

const extractTextFromPdf = async (filePath) => {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return (data.text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .substring(0, 50000);
};

const runAIExtraction = async (docId, filePath, ext, docType, today) => {
  try {
    const ai = getAIClient();
    const systemPrompt = buildSystemPrompt(docType, today);
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    let completion;

    if (isImage) {
      const mimeType = MIME_TYPES[ext] || 'image/jpeg';
      const base64 = fs.readFileSync(filePath).toString('base64');
      completion = await ai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
              { type: 'text', text: 'Проанализируй этот медицинский документ и верни JSON с полями: title, docDate, summary, measurements.' },
            ],
          },
        ],
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });
    } else {
      const text = await extractTextFromPdf(filePath);
      if (!text) throw new Error('empty_pdf');
      completion = await ai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Проанализируй медицинский документ и верни JSON с полями: title, docDate, summary, measurements.\n\nТекст документа:\n${text}` },
        ],
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });
    }

    const parsed = JSON.parse(completion.choices[0].message.content);
    await prisma.medicalDocument.update({
      where: { id: docId },
      data: {
        title:        parsed.title        || DOC_TYPE_LABELS[docType],
        docDate:      parsed.docDate      ? new Date(parsed.docDate) : new Date(),
        aiSummary:    parsed.summary      || null,
        measurements: parsed.measurements || null,
        status:       'completed',
      },
    });
  } catch (err) {
    console.error('Medical doc AI error:', err.message);
    await prisma.medicalDocument.update({
      where: { id: docId },
      data: { status: 'error' },
    });
  }
};

// POST /api/medical/upload
const uploadMedicalDoc = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });
    if (!req.file)  return res.status(400).json({ error: 'Файл не загружен' });

    const { docType = 'OTHER', title, docDate } = req.body;
    if (!DOC_TYPE_LABELS[docType]) return res.status(400).json({ error: 'Неверный тип документа' });

    const fileUrl  = `/uploads/${req.user.id}/${req.file.filename}`;
    const filePath = path.join(process.cwd(), fileUrl.slice(1));
    const ext      = path.extname(req.file.originalname || req.file.filename).toLowerCase();
    const today    = new Date().toISOString().slice(0, 10);

    const doc = await prisma.medicalDocument.create({
      data: {
        patientId: profile.id,
        docType,
        title:    title   || DOC_TYPE_LABELS[docType],
        docDate:  docDate ? new Date(docDate) : new Date(),
        fileUrl,
        status:   'processing',
      },
    });

    // Run AI asynchronously — don't block the response
    runAIExtraction(doc.id, filePath, ext, docType, today).catch(console.error);

    res.status(201).json(doc);
  } catch (err) {
    console.error('Upload medical doc error:', err);
    res.status(500).json({ error: 'Ошибка загрузки документа' });
  }
};

// GET /api/medical
const getMedicalDocs = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });
    const docs = await prisma.medicalDocument.findMany({
      where: { patientId: profile.id },
      orderBy: { docDate: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения документов' });
  }
};

// DELETE /api/medical/:id
const deleteMedicalDoc = async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const doc = await prisma.medicalDocument.findFirst({
      where: { id: req.params.id, patientId: profile.id },
    });
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });

    if (doc.fileUrl) {
      const fp = path.join(process.cwd(), doc.fileUrl.startsWith('/') ? doc.fileUrl.slice(1) : doc.fileUrl);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    await prisma.medicalDocument.delete({ where: { id: doc.id } });
    res.json({ message: 'Документ удалён' });
  } catch (err) {
    console.error('Delete medical doc error:', err);
    res.status(500).json({ error: 'Ошибка удаления документа' });
  }
};

module.exports = { uploadMedicalDoc, getMedicalDocs, deleteMedicalDoc, DOC_TYPE_LABELS };
