import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Brain, FlaskConical, Activity, Users, Shield, ArrowRight, CheckCircle, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
            <div className="w-9 h-9 rounded-xl gradient-health flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">HealthTwin</span>
          </div>
          <div className="flex items-center gap-3">
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
          <div className="w-7 h-7 rounded-lg gradient-health flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">HealthTwin</span>
        </div>
        <p>© 2025 HealthTwin — Цифровой Двойник Здоровья. Платформа не заменяет медицинскую консультацию.</p>
      </footer>
    </div>
  )
}
