const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, specialization, licenseNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

    if (userRole === 'PATIENT') {
      await prisma.patientProfile.create({
        data: { userId: user.id, firstName, lastName },
      });
    } else {
      if (!specialization || !licenseNumber) {
        await prisma.user.delete({ where: { id: user.id } });
        return res.status(400).json({ error: 'Специализация и номер лицензии обязательны для врача' });
      }
      await prisma.doctorProfile.create({
        data: { userId: user.id, firstName, lastName, specialization, licenseNumber },
      });
    }

    const token = generateToken(user.id);
    res.status(201).json({ token, role: userRole, message: 'Регистрация успешна' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = generateToken(user.id);
    res.json({ token, role: user.role, userId: user.id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка входа' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
};

module.exports = { register, login, getMe };
