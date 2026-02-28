# 🏥 HealthTwin — Цифровой Двойник Здоровья

> Персонализированная медицинская платформа на базе ИИ

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20PostgreSQL-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Содержание

1. [Обзор платформы](#обзор)
2. [Технологии](#технологии)
3. [Быстрый старт (локально)](#быстрый-старт)
4. [Развёртывание на Render.com (бесплатно)](#деплой-на-render)
5. [Развёртывание на VPS](#деплой-на-vps)
6. [Настройка ИИ-сервера (OpenClaw/OpenAI)](#настройка-ии)
7. [Использование платформы](#использование)
8. [Структура проекта](#структура)

---

## 🌟 Обзор

HealthTwin — полноценная медицинская платформа с двумя модулями:

### Модуль Пациента
- 📊 **Дашборд** — сводка здоровья и ключевые показатели
- 👤 **Профиль** — персональные данные, образ жизни, аллергии, цели
- 🧪 **Анализы** — загрузка и ИИ-интерпретация лабораторных результатов
- 📈 **Показатели** — мониторинг давления, веса, ЧСС с графиками
- 🤖 **ИИ-коуч** — чат с ИИ-ассистентом, учитывающим ваши данные
- 🥗 **Питание** — дневник рациона с подсчётом КБЖУ
- 💊 **Добавки** — схема нутриентов и БАД
- ⭐ **Рекомендации** — персонализированные советы от ИИ и врачей

### Модуль Врача
- 📋 **Список пациентов** — поиск и управление пациентами
- 🔬 **Карточка пациента** — полные данные, анализы, рекомендации
- 💊 **Назначения** — добавление схем нутриентов и добавок
- 🤖 **ИИ-ассистент** — клиническая поддержка для врача

---

## 🛠 Технологии

| Компонент | Технология |
|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| База данных | PostgreSQL + Prisma ORM |
| ИИ | OpenAI API / OpenClaw / любой OpenAI-совместимый сервер |
| Real-time | Socket.IO |
| Деплой | Docker + Docker Compose / Render.com |

---

## 🚀 Быстрый старт (локально)

### Требования
- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **PostgreSQL** 14+ ([postgresql.org](https://postgresql.org)) **или** Docker

### Шаг 1 — Клонировать репозиторий

```bash
git clone https://github.com/YOUR_USERNAME/health-digital-twin.git
cd health-digital-twin
```

### Шаг 2 — Настроить Backend

```bash
cd backend
cp .env.example .env
```

Отредактировать `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/health_twin_db"
JWT_SECRET="my-super-secret-jwt-key-change-this"
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-your-openai-key"
AI_MODEL="gpt-4o"
FRONTEND_URL="http://localhost:3000"
```

```bash
npm install
npx prisma db push
node src/utils/seed.js
npm run dev
```

### Шаг 3 — Настроить Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Шаг 4 — Открыть приложение

Перейдите по адресу: **http://localhost:3000**

**Демо-аккаунты:**
| Роль | Email | Пароль |
|------|-------|--------|
| Пациент | patient@demo.ru | patient123 |
| Врач | doctor@demo.ru | doctor123 |

---

## ☁️ Деплой на Render.com (бесплатно)

### Шаг 1 — Загрузить код на GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/health-digital-twin.git
git push -u origin main
```

### Шаг 2 — Создать PostgreSQL на Render

1. [render.com](https://render.com) → `New +` → `PostgreSQL`
2. Name: `health-twin-db`, Plan: `Free`, Region: `Frankfurt`
3. Нажмите `Create Database`, сохраните **Internal Database URL**

### Шаг 3 — Создать Backend

1. `New +` → `Web Service` → выберите репозиторий
2. Root Directory: `backend`
3. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start Command: `node src/utils/seed.js 2>/dev/null; node src/app.js`
5. Environment Variables:

| Ключ | Значение |
|------|---------|
| `DATABASE_URL` | Internal URL из шага 2 |
| `JWT_SECRET` | случайная строка 32+ символа |
| `NODE_ENV` | production |
| `PORT` | 5000 |
| `FRONTEND_URL` | https://health-twin-frontend.onrender.com |
| `AI_API_BASE_URL` | https://api.openai.com/v1 |
| `AI_API_KEY` | sk-ваш-ключ |
| `AI_MODEL` | gpt-4o |

### Шаг 4 — Создать Frontend

1. `New +` → `Static Site` → выберите репозиторий
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. ENV: `VITE_API_URL` = `https://health-twin-backend.onrender.com/api`
6. Redirects: `/*` → `/index.html` (Rewrite)

---

## 🖥 Деплой на VPS

### Шаг 1 — Установить Docker

```bash
ssh root@YOUR_SERVER_IP
apt-get update && apt-get upgrade -y
curl -fsSL https://get.docker.com | sh
apt-get install docker-compose-plugin -y
```

### Шаг 2 — Клонировать и настроить

```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/health-digital-twin.git
cd health-digital-twin
cp .env.example .env
nano .env   # Заполните переменные
```

Минимальный `.env`:
```env
POSTGRES_USER=healthuser
POSTGRES_PASSWORD=ВашСтрогийПароль123
JWT_SECRET=случайная-строка-минимум-32-символа
FRONTEND_URL=http://YOUR_SERVER_IP:3000
AI_API_KEY=sk-ваш-ключ-openai
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o
```

### Шаг 3 — Запустить

```bash
docker compose up -d --build
```

### Шаг 4 (опционально) — Домен + HTTPS

```bash
apt-get install nginx certbot python3-certbot-nginx -y
# Создайте /etc/nginx/sites-available/healthtwin с proxy конфигом
certbot --nginx -d your-domain.com
```

### Команды управления

```bash
docker compose logs -f          # Логи
docker compose restart          # Перезапуск
docker compose down             # Остановить
git pull && docker compose up -d --build  # Обновить
```

---

## 🤖 Настройка ИИ

Платформа поддерживает любой OpenAI-совместимый API.

### OpenAI

```env
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-proj-...
AI_MODEL=gpt-4o
```

### OpenClaw / Кастомный сервер

```env
AI_API_BASE_URL=http://your-openclaw-server:8080/v1
AI_API_KEY=your-server-api-key
AI_MODEL=ваша-модель
```

### Ollama (бесплатно, локально)

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2
```

```env
AI_API_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
AI_MODEL=llama3.2
```

### Проверка

```
GET /api/ai/settings → {"isConfigured": true}
```

---

## 📖 Использование

### Пациент

1. **Регистрация** → роль `Пациент` → заполнить профиль
2. **Анализы** → `Добавить анализ` → вставить JSON с параметрами:
```json
[
  {"name": "Холестерин", "value": 6.2, "unit": "ммоль/л", "normalMin": 0, "normalMax": 5.2},
  {"name": "Глюкоза", "value": 5.1, "unit": "ммоль/л", "normalMin": 3.9, "normalMax": 6.1}
]
```
3. **Показатели** → добавляйте ежедневные измерения (вес, давление, ЧСС)
4. **ИИ-коуч** → задавайте вопросы о здоровье (ИИ видит ваши данные)
5. **Рекомендации** → `Обновить ИИ-рекомендации`

### Врач

1. **Регистрация** → роль `Врач` → специализация + номер лицензии
2. **Пациенты** → список с поиском → ⚠️ = критические показатели
3. **Карточка пациента** → все данные + `ИИ-анализ` = клиническое заключение
4. **Назначения** → добавить схему нутриентов/добавок

---

## 📁 Структура проекта

```
health-digital-twin/
├── backend/
│   ├── prisma/schema.prisma     # Схема БД
│   ├── src/
│   │   ├── config/ai.js         # Настройки ИИ
│   │   ├── controllers/         # Бизнес-логика
│   │   ├── routes/              # API маршруты
│   │   └── app.js               # Точка входа
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/patient/       # Страницы пациента
│   │   ├── pages/doctor/        # Страницы врача
│   │   ├── components/          # UI компоненты
│   │   └── lib/api.ts           # HTTP клиент
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── render.yaml
└── .env.example
```

---

*HealthTwin не является медицинским устройством. Платформа не заменяет консультацию врача.*