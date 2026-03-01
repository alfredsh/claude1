import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, FlaskConical, Activity, Users, Shield, ArrowRight, CheckCircle, Zap, Star, Smartphone, Download, Share2, Plus, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppLogo } from '@/components/AppLogo'

const features = [
  { icon: Brain, title: 'ИИ-коуч здоровья', desc: 'Персональный ИИ-ассистент анализирует ваши данные и даёт рекомендации 24/7', color: 'bg-blue-50 text-blue-600' },
  { icon: FlaskConical, title: 'Анализ лабораторий', desc: 'Загружайте анализы и получайте понятную интерпретацию с рекомендациями', color: 'bg-teal-50 text-teal-600' },
  { icon: Activity, title: 'Мониторинг здоровья', desc: 'Отслеживайте показатели: давление, вес, ЧСС и другие метрики в реальном времени', color: 'bg-green-50 text-green-600' },
  { icon: Users, title: 'Консультации врачей', desc: 'Связь с врачами-нутрициологами и терапевтами через защищённый чат', color: 'bg-purple-50 text-purple-600' },
  { icon: Shield, title: 'Персонализация', desc: 'Индивидуальные схемы нутриентов и добавок на основе ваших анализов', color: 'bg-orange-50 text-orange-600' },
  { icon: Star, title: 'Цифровой двойник', desc: 'Полный профиль здоровья: геном, питание, образ жизни, динамика показателей', color: 'bg-pink-50 text-pink-600' },
]

const benefits = [
  'Персонализированные рекомендации на основе ваших данных',
  'Интерпретация анализов понятным языком',
  'Отслеживание прогресса и динамики здоровья',
  'Связь с профессиональными врачами',
  'Индивидуальные схемы нутриентов и БАД',
  'Полная конфиденциальность медицинских данных',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size={36} className="rounded-xl shadow-md" />
            <span className="font-bold text-slate-900 text-lg">HealthTwin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/guide" className="text-sm text-slate-500 hover:text-slate-800 hidden sm:inline">
              📖 Руководство
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Войти</Button>
            </Link>
            <Link to="/register">
              <Button variant="gradient" size="sm">Начать бесплатно</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 -z-10" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              На основе ИИ и персонализированной медицины
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
              Ваш{' '}
              <span className="gradient-text">Цифровой Двойник</span>
              <br />Здоровья
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Персонализированная медицинская платформа, которая анализирует ваши данные,
              интерпретирует анализы и даёт рекомендации с помощью ИИ и врачей-специалистов
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="gradient" size="xl" className="gap-2 w-full sm:w-auto">
                  Создать аккаунт бесплатно
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Войти в аккаунт
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              Демо: patient@demo.ru / patient123 · doctor@demo.ru / doctor123
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Всё для вашего здоровья</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Комплексная платформа, объединяющая данные, ИИ-анализ и экспертизу врачей</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Почему HealthTwin?</h2>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="inline-block mt-8">
                <Button variant="gradient" size="lg" className="gap-2">
                  Начать сейчас <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-3xl p-8 text-white shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Анализов загружено', value: '10k+' },
                    { label: 'Рекомендаций выдано', value: '50k+' },
                    { label: 'Пациентов', value: '2k+' },
                    { label: 'Врачей', value: '100+' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/20 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-blue-100 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-white/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                      <Brain className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">ИИ-коуч</span>
                  </div>
                  <p className="text-sm text-blue-100">«Ваш уровень холестерина немного повышен. Рекомендую ограничить насыщенные жиры и добавить омега-3...»</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PWA / Mobile App */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
              <Smartphone className="w-4 h-4" />
              Мобильное приложение
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Установите HealthTwin на смартфон
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Без App Store и Google Play — работает как нативное приложение прямо из браузера
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Перки */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="space-y-4 lg:pt-6">
              {[
                { icon: Download, title: 'Без магазинов приложений', desc: 'Устанавливается прямо из браузера одним нажатием', color: 'bg-blue-50 text-blue-600' },
                { icon: Wifi, title: 'Работает офлайн', desc: 'Просматривайте данные даже без интернета', color: 'bg-teal-50 text-teal-600' },
                { icon: Zap, title: 'Как нативное приложение', desc: 'Полноэкранный режим, уведомления, иконка на рабочем столе', color: 'bg-purple-50 text-purple-600' },
              ].map(({ icon: Icon, title, desc, color }, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{title}</p>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Телефон-макет */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="flex justify-center">
              <div className="relative">
                {/* Свечение */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-300/30 to-teal-300/30 rounded-[3rem] blur-2xl scale-110" />
                {/* Корпус телефона */}
                <div className="relative w-52 bg-slate-800 rounded-[2.5rem] border-4 border-slate-700 shadow-2xl overflow-hidden">
                  {/* Экран */}
                  <div className="bg-gradient-to-b from-blue-600 to-teal-600 h-96 p-4 flex flex-col">
                    {/* Статусбар */}
                    <div className="flex justify-between items-center text-white/70 text-[10px] mb-3 px-1">
                      <span>9:41</span>
                      <div className="flex gap-1 items-center">
                        <Wifi className="w-3 h-3" />
                        <div className="w-5 h-2.5 border border-white/70 rounded-sm relative">
                          <div className="absolute inset-0.5 right-0.5 bg-white/70 rounded-sm" />
                        </div>
                      </div>
                    </div>
                    {/* Шапка */}
                    <div className="flex items-center gap-2 mb-4">
                      <AppLogo size={28} className="rounded-lg shadow" />
                      <span className="text-white font-bold text-sm">HealthTwin</span>
                    </div>
                    {/* Карточки-заглушки */}
                    <div className="space-y-2 flex-1">
                      <div className="bg-white/20 rounded-xl p-3">
                        <div className="h-2 w-20 bg-white/40 rounded mb-2" />
                        <div className="h-6 w-16 bg-white/60 rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/20 rounded-xl p-3">
                          <div className="h-2 w-12 bg-white/40 rounded mb-2" />
                          <div className="h-4 w-8 bg-white/60 rounded" />
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                          <div className="h-2 w-12 bg-white/40 rounded mb-2" />
                          <div className="h-4 w-8 bg-white/60 rounded" />
                        </div>
                      </div>
                      <div className="bg-white/20 rounded-xl p-3">
                        <div className="h-2 w-24 bg-white/40 rounded mb-2" />
                        <div className="h-2 w-full bg-white/20 rounded" />
                        <div className="h-2 w-3/4 bg-white/20 rounded mt-1" />
                      </div>
                    </div>
                  </div>
                  {/* Нижняя часть телефона */}
                  <div className="bg-slate-800 h-8 flex items-center justify-center">
                    <div className="w-24 h-1 bg-slate-600 rounded-full" />
                  </div>
                </div>
                {/* Значок установки */}
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Инструкции */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4 lg:pt-6">
              {/* Android */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg">🤖</div>
                  <p className="font-semibold text-slate-900">Android / Chrome</p>
                </div>
                <div className="space-y-3">
                  {[
                    { n: '1', text: 'Откройте сайт в Chrome' },
                    { n: '2', text: 'Нажмите меню ⋮ в правом углу' },
                    { n: '3', text: 'Выберите «Добавить на главный экран»' },
                    { n: '4', text: 'Нажмите «Установить» — готово!' },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {n}
                      </div>
                      <p className="text-slate-600 text-sm">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* iOS */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-lg">🍎</div>
                  <p className="font-semibold text-slate-900">iPhone / Safari</p>
                </div>
                <div className="space-y-3">
                  {[
                    { n: '1', text: 'Откройте сайт в Safari' },
                    { n: '2', el: <span>Нажмите <Share2 className="w-3.5 h-3.5 inline text-blue-500" /> «Поделиться»</span> },
                    { n: '3', el: <span>Выберите <Plus className="w-3.5 h-3.5 inline text-blue-500" /> «На экран Домой»</span> },
                    { n: '4', text: 'Нажмите «Добавить» — готово!' },
                  ].map(({ n, text, el }) => (
                    <div key={n} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {n}
                      </div>
                      <p className="text-slate-600 text-sm">{el ?? text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 gradient-health">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Начните сегодня</h2>
          <p className="text-blue-100 mb-8 text-lg">Зарегистрируйтесь бесплатно и получите персонализированный анализ здоровья</p>
          <Link to="/register">
            <Button size="xl" className="bg-white text-blue-600 hover:bg-blue-50 gap-2 font-semibold">
              Создать бесплатный аккаунт <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-slate-400 text-center text-sm">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src="/icon-192x192.png" alt="HealthTwin" className="w-7 h-7 rounded-lg shadow" />
          <span className="text-white font-semibold">HealthTwin</span>
        </div>
        <p>© 2025 HealthTwin — Цифровой Двойник Здоровья. Платформа не заменяет медицинскую консультацию.</p>
        <p className="mt-2">
          <Link to="/guide" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">
            Руководство пользователя
          </Link>
        </p>
      </footer>
    </div>
  )
}
