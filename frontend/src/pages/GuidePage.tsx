import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { ChevronRight, Smartphone, Monitor, Apple, Chrome } from 'lucide-react'

// ─── Типографические компоненты ───────────────────────────────────────────────
const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="text-2xl font-bold text-slate-900 mt-12 mb-4 pb-3 border-b-2 border-slate-100 scroll-mt-20">
    {children}
  </h2>
)
const H3 = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h3 id={id} className="text-lg font-semibold text-slate-800 mt-7 mb-3 scroll-mt-20">
    {children}
  </h3>
)
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-slate-600 leading-relaxed mb-3">{children}</p>
)
const Ol = ({ children }: { children: React.ReactNode }) => (
  <ol className="space-y-2 mb-4 ml-1 counter-reset-list">{children}</ol>
)
const Ul = ({ children }: { children: React.ReactNode }) => (
  <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>
)
const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2 text-slate-600 leading-relaxed">
    <span className="text-slate-400 mt-1 flex-shrink-0">•</span>
    <span>{children}</span>
  </li>
)
const StepItem = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3 items-start">
    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold mt-0.5">
      {n}
    </span>
    <span className="text-slate-600 leading-relaxed">{children}</span>
  </li>
)
const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-4 text-sm text-blue-800 leading-relaxed">
    💡 {children}
  </div>
)
const Warn = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 my-4 text-sm text-yellow-800 leading-relaxed">
    ⚠️ {children}
  </div>
)
const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-sm font-mono">{children}</code>
)
const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-50">
          {headers.map((h, i) => (
            <th key={i} className="text-left px-4 py-2.5 font-semibold text-slate-700 border border-slate-200">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-2.5 text-slate-600 border border-slate-200">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
const PlatformCard = ({
  icon, title, badge, badgeColor, children,
}: {
  icon: React.ReactNode; title: string; badge: string; badgeColor: string; children: React.ReactNode
}) => (
  <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>
      </div>
    </div>
    {children}
  </div>
)

// ─── TOC ──────────────────────────────────────────────────────────────────────
const sections = [
  { id: 'install',      label: '0. Установка на телефон' },
  { id: 'login',        label: '1. Вход и навигация' },
  { id: 'dashboard',    label: '2. Дашборд' },
  { id: 'profile',      label: '3. Мой профиль' },
  { id: 'lab',          label: '4. Анализы' },
  { id: 'metrics',      label: '5. Показатели здоровья' },
  { id: 'ai',           label: '6. ИИ-коуч' },
  { id: 'nutrition',    label: '7. Дневник питания' },
  { id: 'supplements',  label: '8. Добавки и нутриенты' },
  { id: 'recs',         label: '9. Рекомендации' },
  { id: 'docs',         label: '10. Медицинские документы' },
  { id: 'specialists',  label: '11. Специалисты' },
  { id: 'tips',         label: 'Советы по использованию' },
]

function TOC({ active }: { active: string }) {
  return (
    <nav className="space-y-0.5">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            active === s.id
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {active === s.id && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          <span>{s.label}</span>
        </a>
      ))}
    </nav>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('install')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <AppLogo size={32} />
            <span className="font-bold text-slate-900">HealthTwin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">Руководство пользователя</span>
            <Link to="/login" className="text-sm font-medium text-blue-600 hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
        {/* Sidebar TOC — desktop only */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
              Содержание
            </p>
            <TOC active={activeSection} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-3xl">
            {/* Title */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <AppLogo size={48} />
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">HealthTwin</h1>
                  <p className="text-slate-500">Руководство пользователя — кабинет пациента</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">
                HealthTwin — персональная платформа управления здоровьем. Система объединяет ваши медицинские данные,
                анализы, показатели и привычки, а встроенный ИИ помогает расшифровать результаты,
                подобрать нутриенты и дать персональные рекомендации.
              </p>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="install">0. Установка приложения на мобильный телефон</H2>
            <P>
              HealthTwin работает как <strong>Progressive Web App (PWA)</strong> — приложение устанавливается
              прямо из браузера без App Store и Google Play. После установки оно выглядит и ведёт себя
              как обычное мобильное приложение: появляется на рабочем столе, открывается без адресной строки,
              работает быстро.
            </P>

            <H3>iPhone и iPad (iOS 16.4 и новее)</H3>
            <Note>
              На iOS установка PWA поддерживается <strong>только через браузер Safari</strong>.
              Chrome, Firefox и другие браузеры на iPhone не поддерживают установку на экран «Домой».
            </Note>
            <div className="grid gap-4 my-4">
              <PlatformCard
                icon={<Apple className="w-5 h-5" />}
                title="Safari на iPhone"
                badge="iOS 16.4+"
                badgeColor="bg-gray-100 text-gray-700"
              >
                <ol className="space-y-3">
                  <StepItem n={1}>Откройте <strong>Safari</strong> и перейдите на сайт HealthTwin.</StepItem>
                  <StepItem n={2}>Дождитесь полной загрузки страницы.</StepItem>
                  <StepItem n={3}>
                    Нажмите кнопку <strong>«Поделиться»</strong> — квадрат со стрелкой вверх{' '}
                    <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-xs">⎙</span>{' '}
                    в нижней панели Safari (на iPad — в верхней).
                  </StepItem>
                  <StepItem n={4}>
                    Прокрутите список действий вниз и нажмите{' '}
                    <strong>«На экран «Домой»»</strong>{' '}
                    <span className="text-slate-400 text-sm">(На экран «Домой» / Add to Home Screen)</span>.
                  </StepItem>
                  <StepItem n={5}>
                    При необходимости измените название приложения — по умолчанию будет <em>HealthTwin</em>.
                  </StepItem>
                  <StepItem n={6}>
                    Нажмите <strong>«Добавить»</strong> в правом верхнем углу.
                  </StepItem>
                  <StepItem n={7}>
                    Значок HealthTwin появится на рабочем столе. Нажмите его — приложение
                    откроется в полноэкранном режиме без адресной строки.
                  </StepItem>
                </ol>
              </PlatformCard>
            </div>

            <H3>Android — Google Chrome</H3>
            <div className="grid gap-4 my-4">
              <PlatformCard
                icon={<Chrome className="w-5 h-5" />}
                title="Google Chrome"
                badge="Android 8+"
                badgeColor="bg-green-100 text-green-700"
              >
                <ol className="space-y-3">
                  <StepItem n={1}>Откройте <strong>Chrome</strong> и перейдите на сайт HealthTwin.</StepItem>
                  <StepItem n={2}>
                    Через несколько секунд внизу экрана может появиться баннер{' '}
                    <strong>«Добавить HealthTwin на главный экран»</strong> — нажмите <strong>«Установить»</strong>.
                    Если баннер не появился — перейдите к шагу 3.
                  </StepItem>
                  <StepItem n={3}>
                    Нажмите <strong>меню Chrome</strong> — три точки{' '}
                    <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-xs">⋮</span>{' '}
                    в правом верхнем углу.
                  </StepItem>
                  <StepItem n={4}>
                    Выберите <strong>«Добавить на главный экран»</strong>{' '}
                    <span className="text-slate-400 text-sm">(Add to Home screen)</span>.
                  </StepItem>
                  <StepItem n={5}>Нажмите <strong>«Добавить»</strong> в появившемся диалоге.</StepItem>
                  <StepItem n={6}>
                    Значок появится на рабочем столе или в ящике приложений.
                  </StepItem>
                </ol>
              </PlatformCard>
            </div>

            <H3>Android — Samsung Internet</H3>
            <div className="grid gap-4 my-4">
              <PlatformCard
                icon={<Smartphone className="w-5 h-5" />}
                title="Samsung Internet"
                badge="Samsung Galaxy"
                badgeColor="bg-blue-100 text-blue-700"
              >
                <ol className="space-y-3">
                  <StepItem n={1}>Откройте <strong>Samsung Internet</strong> и перейдите на сайт HealthTwin.</StepItem>
                  <StepItem n={2}>
                    Нажмите кнопку меню — три горизонтальные линии{' '}
                    <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-xs">≡</span>{' '}
                    в нижней правой части экрана.
                  </StepItem>
                  <StepItem n={3}>
                    Выберите <strong>«Добавить страницу в»</strong>, затем — <strong>«На главный экран»</strong>.
                  </StepItem>
                  <StepItem n={4}>Нажмите <strong>«Добавить»</strong>.</StepItem>
                  <StepItem n={5}>Значок появится на рабочем столе.</StepItem>
                </ol>
              </PlatformCard>
            </div>

            <H3>Компьютер — Chrome, Edge или Яндекс Браузер</H3>
            <div className="grid gap-4 my-4">
              <PlatformCard
                icon={<Monitor className="w-5 h-5" />}
                title="Десктоп"
                badge="Windows / macOS"
                badgeColor="bg-purple-100 text-purple-700"
              >
                <ol className="space-y-3">
                  <StepItem n={1}>Откройте сайт HealthTwin в Chrome, Edge или Яндекс Браузере.</StepItem>
                  <StepItem n={2}>
                    В правой части адресной строки найдите иконку установки —{' '}
                    <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-xs font-mono">⊕</span>{' '}
                    или значок компьютера со стрелкой. Нажмите её.
                  </StepItem>
                  <StepItem n={3}>
                    Если иконки нет — откройте меню браузера (три точки) и выберите{' '}
                    <strong>«Установить HealthTwin»</strong> или <strong>«Добавить на рабочий стол»</strong>.
                  </StepItem>
                  <StepItem n={4}>
                    Нажмите <strong>«Установить»</strong> в диалоговом окне.
                  </StepItem>
                  <StepItem n={5}>
                    Приложение откроется в отдельном окне без адресной строки и появится
                    в списке установленных приложений.
                  </StepItem>
                </ol>
              </PlatformCard>
            </div>

            <Note>
              После установки приложение работает как обычное — открывается с рабочего стола,
              помнит ваш вход, загружается быстро. При необходимости удалить: зажмите значок
              и выберите «Удалить» (Android) или переместите в корзину (iOS/macOS).
            </Note>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="login">1. Вход и навигация</H2>
            <H3>Как войти</H3>
            <Ol>
              <StepItem n={1}>На странице входа введите <strong>Email</strong> и <strong>Пароль</strong>.</StepItem>
              <StepItem n={2}>Нажмите кнопку <strong>«Войти»</strong>.</StepItem>
              <StepItem n={3}>
                Нет аккаунта — нажмите <strong>«Зарегистрироваться»</strong> внизу формы.
              </StepItem>
            </Ol>
            <H3>Навигация по кабинету</H3>
            <P>После входа слева (десктоп) или через иконку меню (мобильный) отображается боковая панель:</P>
            <Table
              headers={['Раздел', 'Назначение']}
              rows={[
                ['🏠 Дашборд', 'Общий обзор состояния здоровья'],
                ['👤 Мой профиль', 'Личные и медицинские данные'],
                ['🧪 Анализы', 'Загрузка и интерпретация анализов'],
                ['📊 Показатели', 'Измерения (давление, вес, пульс…)'],
                ['🤖 ИИ-коуч', 'Чат с персональным ИИ-советником'],
                ['🥗 Питание', 'Дневник питания и подбор из меню'],
                ['💊 Добавки', 'БАД, нутриенты, назначения врача'],
                ['⭐ Рекомендации', 'Советы от ИИ и врача'],
                ['📄 Документы', 'ЭКГ, УЗИ, МРТ и другие документы'],
                ['🩺 Специалисты', 'Поиск и выбор врача для наблюдения'],
              ]}
            />

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="dashboard">2. Дашборд</H2>
            <P>Дашборд — персональный обзор здоровья в одном месте.</P>
            <Ul>
              <Li><strong>4 карточки статистики</strong> — количество добавок, рекомендаций, анализов и показателей. Нажмите, чтобы перейти в раздел.</Li>
              <Li><strong>Предупреждение об отклонениях</strong> — жёлтая плашка, если в анализах есть параметры вне нормы.</Li>
              <Li><strong>Карточка здоровья</strong> — ИМТ, группа крови, активность, сон, цели. Кнопка «Редактировать профиль».</Li>
              <Li><strong>Последние анализы</strong> — название, дата, ключевые параметры. Кнопка «Все анализы».</Li>
              <Li><strong>Рекомендации ИИ</strong> — три актуальных совета. Кнопка «Обновить рекомендации».</Li>
              <Li><strong>ИИ-коуч</strong> — кнопка «Начать чат» для быстрого перехода к советнику.</Li>
            </Ul>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="profile">3. Мой профиль</H2>
            <P>Чем точнее заполнен профиль — тем персональнее рекомендации ИИ.</P>
            <H3>Основные данные</H3>
            <Ol>
              <StepItem n={1}>Перейдите в <strong>«Мой профиль»</strong>.</StepItem>
              <StepItem n={2}>Заполните: имя, фамилию, дату рождения, пол, рост и вес (ИМТ рассчитается автоматически), группу крови, телефон.</StepItem>
              <StepItem n={3}>Нажмите <strong>«Сохранить»</strong>.</StepItem>
            </Ol>
            <H3>Образ жизни</H3>
            <Table
              headers={['Поле', 'Варианты']}
              rows={[
                ['Уровень активности', 'Сидячий, Умеренный, Активный, Очень активный'],
                ['Тип питания', 'Без ограничений, Вегетарианская, Веганская, Кето…'],
                ['Часов сна', 'Число (например: 7.5)'],
                ['Уровень стресса', 'Шкала 1–10'],
                ['Курение', 'Не курю, Бросил, Курю'],
                ['Алкоголь', 'Не употребляю, Редко, Умеренно, Часто'],
              ]}
            />
            <H3>Теги: аллергии, заболевания, цели</H3>
            <Ol>
              <StepItem n={1}>Введите значение в поле (например: «Орехи», «Диабет 2 типа», «Снизить вес»).</StepItem>
              <StepItem n={2}>Нажмите <strong>«+»</strong> или <strong>Enter</strong> — тег добавится.</StepItem>
              <StepItem n={3}>Чтобы удалить тег — нажмите <strong>«×»</strong> рядом с ним.</StepItem>
            </Ol>
            <Warn>Аллергии используются ИИ как абсолютные противопоказания при подборе питания и нутриентов.</Warn>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="lab">4. Анализы</H2>
            <H3>Загрузка — умный разбор (PDF или фото)</H3>
            <Ol>
              <StepItem n={1}>Нажмите <strong>«Добавить анализ»</strong>.</StepItem>
              <StepItem n={2}>Выберите вкладку <strong>«Умный разбор»</strong>.</StepItem>
              <StepItem n={3}>Загрузите файл анализа (PDF, JPG или PNG).</StepItem>
              <StepItem n={4}>ИИ автоматически распознает параметры, значения и единицы.</StepItem>
              <StepItem n={5}>Нажмите <strong>«Загрузить»</strong>.</StepItem>
            </Ol>
            <H3>Загрузка — ручной ввод</H3>
            <Ol>
              <StepItem n={1}>Выберите вкладку <strong>«Ввод вручную»</strong>.</StepItem>
              <StepItem n={2}>Введите название теста и дату.</StepItem>
              <StepItem n={3}>Заполните параметры или нажмите <strong>«Пример»</strong> для образца.</StepItem>
              <StepItem n={4}>Нажмите <strong>«Загрузить»</strong>.</StepItem>
            </Ol>
            <H3>Просмотр результатов</H3>
            <P>Нажмите стрелку <strong>«▼»</strong> на карточке анализа. Откроется таблица параметров:</P>
            <Ul>
              <Li><span className="text-green-600 font-medium">Зелёный</span> — норма</Li>
              <Li><span className="text-yellow-600 font-medium">Жёлтый</span> — пониженный (LOW)</Li>
              <Li><span className="text-red-600 font-medium">Красный</span> — повышенный (HIGH / CRITICAL)</Li>
            </Ul>
            <P>Ниже таблицы — <strong>интерпретация от ИИ</strong>: объяснение отклонений, возможные причины, рекомендации.</P>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="metrics">5. Показатели здоровья</H2>
            <P>Раздел для регулярного отслеживания жизненно важных измерений с графиком динамики.</P>
            <H3>Добавить измерение</H3>
            <Ol>
              <StepItem n={1}>Нажмите <strong>«Добавить показатель»</strong>.</StepItem>
              <StepItem n={2}>Выберите тип: Вес, Систолическое АД, Диастолическое АД, Пульс, Глюкоза, Температура, SpO₂.</StepItem>
              <StepItem n={3}>Введите значение и единицу измерения (заполняется автоматически).</StepItem>
              <StepItem n={4}>Нажмите <strong>«Сохранить»</strong>.</StepItem>
            </Ol>
            <H3>Просмотр динамики</H3>
            <P>Нажмите кнопку нужного типа показателя вверху страницы. Отобразится:</P>
            <Ul>
              <Li>График за последние 30 дней</Li>
              <Li>Последнее значение с единицей</Li>
              <Li>Тренд ↑ / ↓ в процентах относительно предыдущего измерения</Li>
              <Li>Количество измерений за период</Li>
            </Ul>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="ai">6. ИИ-коуч</H2>
            <P>Персональный ИИ, осведомлённый о вашем состоянии здоровья. Отвечает на медицинские вопросы с учётом ваших данных.</P>
            <H3>Начало работы</H3>
            <Ol>
              <StepItem n={1}>Перейдите в <strong>«ИИ-коуч»</strong>.</StepItem>
              <StepItem n={2}>Нажмите <strong>«Новый чат»</strong> или выберите один из быстрых вопросов на стартовом экране.</StepItem>
              <StepItem n={3}>Введите вопрос и нажмите <strong>Enter</strong> или кнопку отправки.</StepItem>
            </Ol>
            <H3>Примеры вопросов</H3>
            <Ul>
              <Li>«У меня повышен холестерин — что посоветуешь?»</Li>
              <Li>«Как откорректировать питание при моей диете и уровне активности?»</Li>
              <Li>«Расшифруй мои последние анализы крови»</Li>
              <Li>«Какие упражнения подойдут при моём ИМТ?»</Li>
            </Ul>
            <P>В левой панели хранится <strong>история всех чатов</strong> — нажмите на любой, чтобы продолжить разговор.</P>
            <Warn>ИИ-коуч не заменяет врача. При серьёзных симптомах обратитесь к специалисту.</Warn>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="nutrition">7. Дневник питания и подбор из меню</H2>
            <H3>Добавить приём пищи — через фото (ИИ-распознавание)</H3>
            <Ol>
              <StepItem n={1}>Нажмите <strong>«Добавить приём пищи»</strong>.</StepItem>
              <StepItem n={2}>Нажмите иконку камеры, сделайте фото блюда или загрузите из галереи.</StepItem>
              <StepItem n={3}>ИИ определит название и КБЖУ — поля заполнятся автоматически.</StepItem>
              <StepItem n={4}>Выберите тип приёма (Завтрак / Обед / Ужин / Перекус) и нажмите <strong>«Сохранить»</strong>.</StepItem>
            </Ol>
            <H3>Добавить приём пищи — вручную</H3>
            <Ol>
              <StepItem n={1}>Выберите тип приёма пищи.</StepItem>
              <StepItem n={2}>Введите название блюда.</StepItem>
              <StepItem n={3}>Укажите: калории, белки, углеводы, жиры, клетчатку.</StepItem>
              <StepItem n={4}>Нажмите <strong>«Сохранить»</strong>.</StepItem>
            </Ol>
            <H3>Подбор блюд из меню ресторана</H3>
            <P>Нажмите кнопку <strong>«Подбор из меню»</strong> в правом верхнем углу раздела «Питание».</P>
            <H3 id="menu-photo">Вкладка «Фото меню»</H3>
            <Ol>
              <StepItem n={1}>
                Выберите способ добавления фото:
                <Ul>
                  <Li><strong>Сфотографировать меню</strong> — открывает камеру.</Li>
                  <Li><strong>Загрузить из галереи</strong> — выбрать готовые снимки (можно несколько сразу).</Li>
                </Ul>
              </StepItem>
              <StepItem n={2}>
                Если меню многостраничное — добавляйте по одному фото. После первого снимка появятся кнопки <strong>«Камера»</strong> и <strong>«Галерея»</strong> для дополнительных страниц. Кнопка <strong>«Ещё +»</strong> в сетке также добавит страницу.
              </StepItem>
              <StepItem n={3}>Лишнее фото удалите, нажав <strong>«×»</strong> на миниатюре.</StepItem>
              <StepItem n={4}>Нажмите <strong>«Анализировать N фото»</strong>.</StepItem>
            </Ol>
            <H3>Вкладка «Ссылка на меню»</H3>
            <Ol>
              <StepItem n={1}>Перейдите на вкладку <strong>«Ссылка на меню»</strong>.</StepItem>
              <StepItem n={2}>Вставьте ссылку на страницу с меню (например: <Code>https://restaurant.ru/menu</Code>).</StepItem>
              <StepItem n={3}>Нажмите <strong>«Анализировать»</strong>.</StepItem>
            </Ol>
            <H3>Результаты анализа</H3>
            <Ul>
              <Li><strong>Персональный совет</strong> — с учётом рациона за день и вашего состояния.</Li>
              <Li><strong>Бюджет калорий</strong> — примерный остаток на этот приём.</Li>
              <Li><strong>Лучший выбор</strong> — 2–4 наиболее подходящих блюда.</Li>
              <Li>Список всех блюд: <span className="text-green-600">✅ Рекомендую</span> / <span className="text-yellow-600">⚠️ Умеренно</span> / <span className="text-red-600">🚫 Избегать</span>.</Li>
            </Ul>
            <P>
              Используйте фильтры над списком для просмотра нужной категории.
              Кнопка <strong>«Другой вариант»</strong> (🔄) запросит у ИИ альтернативную комбинацию из того же меню.
            </P>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="supplements">8. Добавки и нутриенты</H2>
            <H3>Назначения врача</H3>
            <P>Если ваш врач назначил добавки через систему HealthTwin, они отображаются в блоке <strong>«Назначения врача»</strong>: название, дозировка, частота, сроки, причина, имя врача, статус «Активное / Завершено».</P>
            <H3>ИИ-рекомендации по нутриентам</H3>
            <Ol>
              <StepItem n={1}>Нажмите <strong>«Получить рекомендации ИИ»</strong>.</StepItem>
              <StepItem n={2}>Дождитесь анализа (несколько секунд).</StepItem>
              <StepItem n={3}>Изучите карточки нутриентов: название, дозировка, категория, приоритет (🔴 высокий / 🟡 средний / 🟢 низкий), обоснование.</StepItem>
              <StepItem n={4}>После добавления новых анализов нажмите <strong>«Обновить анализ»</strong>.</StepItem>
            </Ol>
            <Warn>Рекомендации носят информационный характер. Перед приёмом добавок проконсультируйтесь с врачом.</Warn>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="recs">9. Рекомендации</H2>
            <P>Централизованный список советов от ИИ и вашего врача.</P>
            <Ul>
              <Li>Используйте фильтры-кнопки: <strong>питание / активность / сон / стресс / нутриенты / врач / общее</strong>.</Li>
              <Li>У каждой рекомендации указан источник (🤖 ИИ или 👨‍⚕️ Врач) и приоритет.</Li>
              <Li>Нажмите <strong>«Обновить ИИ-рекомендации»</strong> после загрузки новых анализов — система сформирует актуальный набор советов.</Li>
            </Ul>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="docs">10. Медицинские документы</H2>
            <H3>Загрузка документа</H3>
            <Ol>
              <StepItem n={1}>Нажмите <strong>«Добавить документ»</strong>.</StepItem>
              <StepItem n={2}>
                Выберите тип:
                <Table
                  headers={['Тип', 'Пример']}
                  rows={[
                    ['ЭКГ', 'Электрокардиограмма'],
                    ['УЗИ', 'Ультразвуковое исследование'],
                    ['КТ / МРТ', 'Компьютерная / магнитно-резонансная томография'],
                    ['Спирометрия', 'Функция внешнего дыхания'],
                    ['Рентген', 'Рентгеновский снимок'],
                    ['Другое', 'Прочие медицинские документы'],
                  ]}
                />
              </StepItem>
              <StepItem n={3}>Укажите дату (необязательно — ИИ попытается извлечь её из файла).</StepItem>
              <StepItem n={4}>Загрузите файл (PDF, JPG или PNG) и нажмите <strong>«Загрузить»</strong>.</StepItem>
            </Ol>
            <H3>Просмотр результатов анализа</H3>
            <P>После обработки нажмите <strong>«▼»</strong> на карточке документа:</P>
            <Ul>
              <Li><strong>ЭКГ</strong>: таблица с ЧСС, ритмом, интервалами PQ / QRS / QT, электрической осью сердца.</Li>
              <Li><strong>Спирометрия</strong>: показатели ФЖЕЛ, ОФВ1, ОФВ1/ФЖЕЛ, ПСВ.</Li>
              <Li><strong>УЗИ / КТ / МРТ</strong>: список находок и заключение.</Li>
              <Li><strong>Все типы</strong>: блок «Интерпретация ИИ» с объяснением простым языком.</Li>
            </Ul>
            <P>Для изображений — нажмите на миниатюру, чтобы открыть полноэкранный просмотр.</P>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="specialists">11. Специалисты</H2>
            <H3>Поиск врача</H3>
            <Ol>
              <StepItem n={1}>Перейдите в раздел <strong>«Специалисты»</strong>.</StepItem>
              <StepItem n={2}>Введите в строку поиска имя, специализацию, город или клинику.</StepItem>
              <StepItem n={3}>Список автоматически отфильтруется.</StepItem>
            </Ol>
            <H3>Просмотр профиля и выбор врача</H3>
            <Ol>
              <StepItem n={1}>Нажмите <strong>«Подробнее»</strong> на карточке врача — откроется полный профиль с образованием, достижениями, сертификатами, языками приёма.</StepItem>
              <StepItem n={2}>Нажмите <strong>«Наблюдаться»</strong> (или в профиле — «Выбрать для наблюдения»).</StepItem>
              <StepItem n={3}>Выбранный врач отмечается зелёным значком <strong>«Мой врач»</strong>.</StepItem>
              <StepItem n={4}>Чтобы прекратить наблюдение — нажмите <strong>«Отписаться»</strong>.</StepItem>
            </Ol>

            {/* ══════════════════════════════════════════════════════════════ */}
            <H2 id="tips">Советы по использованию</H2>
            <Ul>
              <Li><strong>Заполните профиль полностью</strong> — особенно аллергии, заболевания и цели. Это основа всех персональных рекомендаций ИИ.</Li>
              <Li><strong>Загружайте анализы сразу</strong> — умный разбор PDF занимает несколько секунд. Чем актуальнее данные, тем точнее советы.</Li>
              <Li><strong>Измеряйте показатели регулярно</strong> — запись давления или веса раз в несколько дней позволит увидеть тренды на графике.</Li>
              <Li><strong>Фотографируйте блюда</strong> — ИИ заполнит КБЖУ автоматически, ведение дневника займёт несколько секунд.</Li>
              <Li><strong>Используйте подбор из меню</strong> — особенно полезно при хронических заболеваниях или аллергиях. Если меню многостраничное — добавляйте каждую страницу отдельным фото.</Li>
              <Li><strong>Обновляйте рекомендации ИИ</strong> после каждого нового анализа.</Li>
              <Li><strong>Спрашивайте ИИ-коуча конкретно</strong> — «У меня повышен ТТГ, как питаться?» даст точнее результат, чем «Что делать со щитовидкой».</Li>
              <Li><strong>Установите приложение на телефон</strong> (раздел 0 выше) — так удобнее фотографировать блюда и меню прямо за столом.</Li>
            </Ul>

            <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
              HealthTwin — система поддержки здоровья. Все рекомендации носят информационный характер
              и не заменяют консультацию врача.
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
