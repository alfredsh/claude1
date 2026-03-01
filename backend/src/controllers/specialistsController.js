const prisma = require('../config/database');

/** GET /api/specialists — список всех врачей (доступен пациентам) */
const getDoctors = async (req, res) => {
  try {
    const { search, specialization } = req.query;

    const doctors = await prisma.doctorProfile.findMany({
      where: {
        isAcceptingPatients: true,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { specialization: { contains: search, mode: 'insensitive' } },
            { clinic: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(specialization && {
          specialization: { contains: specialization, mode: 'insensitive' },
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        bio: true,
        experience: true,
        avatarUrl: true,
        city: true,
        clinic: true,
        languages: true,
        consultationPrice: true,
        isAcceptingPatients: true,
        education: true,
        achievements: true,
        certifications: true,
        userId: true,
      },
      orderBy: { lastName: 'asc' },
    });

    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения списка специалистов' });
  }
};

/** GET /api/specialists/:id — профиль конкретного врача */
const getDoctor = async (req, res) => {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        bio: true,
        experience: true,
        avatarUrl: true,
        city: true,
        clinic: true,
        languages: true,
        consultationPrice: true,
        isAcceptingPatients: true,
        education: true,
        achievements: true,
        certifications: true,
        userId: true,
      },
    });
    if (!doctor) return res.status(404).json({ error: 'Врач не найден' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения профиля врача' });
  }
};

/** POST /api/specialists/:id/select — пациент выбирает врача */
const selectDoctor = async (req, res) => {
  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!patientProfile) return res.status(404).json({ error: 'Профиль пациента не найден' });

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
    });
    if (!doctor) return res.status(404).json({ error: 'Врач не найден' });

    const relation = await prisma.patientDoctor.upsert({
      where: { patientId_doctorId: { patientId: patientProfile.id, doctorId: doctor.id } },
      update: {},
      create: { patientId: patientProfile.id, doctorId: doctor.id },
    });

    res.json({ success: true, relation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка выбора врача' });
  }
};

/** DELETE /api/specialists/:id/select — пациент удаляет врача из своих */
const unselectDoctor = async (req, res) => {
  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!patientProfile) return res.status(404).json({ error: 'Профиль пациента не найден' });

    await prisma.patientDoctor.deleteMany({
      where: { patientId: patientProfile.id, doctorId: req.params.id },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления врача' });
  }
};

/** GET /api/specialists/my — врачи текущего пациента */
const getMyDoctors = async (req, res) => {
  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        doctors: {
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialization: true,
                bio: true,
                experience: true,
                avatarUrl: true,
                city: true,
                clinic: true,
                consultationPrice: true,
                isAcceptingPatients: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patientProfile) return res.status(404).json({ error: 'Профиль пациента не найден' });
    res.json(patientProfile.doctors.map((r) => ({ ...r.doctor, relationId: r.id, since: r.createdAt })));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения ваших врачей' });
  }
};

module.exports = { getDoctors, getDoctor, selectDoctor, unselectDoctor, getMyDoctors };
