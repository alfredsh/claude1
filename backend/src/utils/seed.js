const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

async function seed() {
  console.log('🌱 Seeding database...');

  // Demo patient
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patient = await prisma.user.upsert({
    where: { email: 'patient@demo.ru' },
    update: {},
    create: {
      email: 'patient@demo.ru',
      password: patientPassword,
      role: 'PATIENT',
      patientProfile: {
        create: {
          firstName: 'Александр',
          lastName: 'Демидов',
          gender: 'Мужской',
          dateOfBirth: new Date('1990-05-15'),
          height: 178,
          weight: 82,
          bloodType: 'A(II)+',
          activityLevel: 'Умеренная',
          dietType: 'Смешанная',
          sleepHours: 7,
          stressLevel: 5,
          chronicDiseases: ['Гипертония I степени'],
          goals: ['Снизить вес', 'Нормализовать давление', 'Улучшить энергию'],
        },
      },
    },
  });

  // Demo doctor
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  await prisma.user.upsert({
    where: { email: 'doctor@demo.ru' },
    update: {},
    create: {
      email: 'doctor@demo.ru',
      password: doctorPassword,
      role: 'DOCTOR',
      doctorProfile: {
        create: {
          firstName: 'Елена',
          lastName: 'Смирнова',
          specialization: 'Терапевт-нутрициолог',
          licenseNumber: 'МЛ-2024-001',
          experience: 12,
          bio: 'Специализируюсь на персонализированной медицине и нутрициологии. 12 лет клинической практики.',
        },
      },
    },
  });

  // Sample lab results for patient
  const patientProfile = await prisma.patientProfile.findUnique({ where: { userId: patient.id } });
  if (patientProfile) {
    await prisma.labResult.upsert({
      where: { id: 'seed-lab-1' },
      update: {},
      create: {
        id: 'seed-lab-1',
        patientId: patientProfile.id,
        testName: 'Общий анализ крови',
        testDate: new Date('2024-01-15'),
        status: 'completed',
        aiInterpretation: 'Результаты анализа крови в целом удовлетворительные. Отмечается незначительное повышение холестерина, что требует внимания к рациону питания.',
        parameters: {
          create: [
            { name: 'Гемоглобин', value: 138, unit: 'г/л', normalMin: 130, normalMax: 160, status: 'NORMAL' },
            { name: 'Эритроциты', value: 4.5, unit: '10^12/л', normalMin: 4.0, normalMax: 5.0, status: 'NORMAL' },
            { name: 'Холестерин общий', value: 6.2, unit: 'ммоль/л', normalMin: 0, normalMax: 5.2, status: 'HIGH' },
            { name: 'Глюкоза', value: 5.1, unit: 'ммоль/л', normalMin: 3.9, normalMax: 6.1, status: 'NORMAL' },
            { name: 'АЛТ', value: 28, unit: 'Ед/л', normalMin: 0, normalMax: 41, status: 'NORMAL' },
          ],
        },
      },
    });

    // Sample health metrics
    const now = Date.now();
    const metricsData = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      metricsData.push(
        { patientId: patientProfile.id, type: 'Вес', value: 82 + (Math.random() - 0.5) * 2, unit: 'кг', recordedAt: date },
        { patientId: patientProfile.id, type: 'Давление систолическое', value: 128 + (Math.random() - 0.5) * 10, unit: 'мм рт.ст.', recordedAt: date },
        { patientId: patientProfile.id, type: 'ЧСС', value: 72 + (Math.random() - 0.5) * 8, unit: 'уд/мин', recordedAt: date }
      );
    }

    await prisma.healthMetric.createMany({ data: metricsData, skipDuplicates: true });

    // Sample recommendations
    await prisma.recommendation.createMany({
      data: [
        { patientId: patientProfile.id, category: 'питание', title: 'Снизить потребление насыщенных жиров', description: 'Уровень холестерина повышен. Рекомендуется ограничить красное мясо, жирные молочные продукты. Увеличить потребление омега-3.', priority: 'high', source: 'ai' },
        { patientId: patientProfile.id, category: 'активность', title: 'Кардионагрузки 3 раза в неделю', description: 'Для нормализации давления и веса рекомендуется ходьба или плавание по 30-45 минут.', priority: 'high', source: 'ai' },
        { patientId: patientProfile.id, category: 'нутриенты', title: 'Магний и витамин D', description: 'Добавьте магний (400мг/день) для нормализации давления и витамин D (2000 МЕ/день).', priority: 'medium', source: 'ai' },
      ],
      skipDuplicates: true,
    });

    await prisma.supplement.createMany({
      data: [
        { patientId: patientProfile.id, name: 'Омега-3', dosage: '1000 мг', frequency: '2 раза в день', reason: 'Снижение холестерина', isActive: true },
        { patientId: patientProfile.id, name: 'Витамин D3', dosage: '2000 МЕ', frequency: '1 раз в день', reason: 'Профилактика дефицита', isActive: true },
        { patientId: patientProfile.id, name: 'Магний B6', dosage: '400 мг', frequency: '1 раз вечером', reason: 'Нормализация давления', isActive: true },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Seed completed!');
  console.log('👤 Patient: patient@demo.ru / patient123');
  console.log('👨‍⚕️ Doctor:  doctor@demo.ru  / doctor123');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
