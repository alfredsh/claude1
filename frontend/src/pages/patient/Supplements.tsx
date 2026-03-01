import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { patientAPI, aiAPI } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Pill, Calendar, User, Brain, Sparkles,
  Loader2, RefreshCw, ShieldAlert,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const CATEGORY_COLORS: Record<string, string> = {
  витамин:      'text-yellow-700 bg-yellow-50 border-yellow-200',
  минерал:      'text-blue-700   bg-blue-50   border-blue-200',
  омега:        'text-teal-700   bg-teal-50   border-teal-200',
  аминокислота: 'text-purple-700 bg-purple-50 border-purple-200',
  пробиотик:    'text-green-700  bg-green-50  border-green-200',
  адаптоген:    'text-orange-700 bg-orange-50 border-orange-200',
  другое:       'text-slate-700  bg-slate-50  border-slate-200',
}

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-yellow-500',
  low:    'bg-green-500',
}
const PRIORITY_LABEL: Record<string, string> = {
  high:   'высокий приоритет',
  medium: 'средний приоритет',
  low:    'низкий приоритет',
}

export default function Supplements() {
  const [aiRecs, setAiRecs] = useState<any[]>([])
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => patientAPI.getSupplements().then(r => r.data),
  })

  const doctorSupplements = supplements.filter((s: any) => s.prescribedBy)
  const activeCount = doctorSupplements.filter((s: any) => s.isActive).length

  const handleGenerateAI = async () => {
    setGenerating(true)
    try {
      const res = await aiAPI.recommendSupplements()
      setAiRecs(res.data.recommendations || [])
      setGeneratedAt(res.data.generatedAt)
      toast({
        title: 'Рекомендации сформированы',
        description: `Проанализировано ${res.data.recommendations?.length || 0} нутриентов`,
      })
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.response?.data?.error || 'Не удалось получить рекомендации',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Нутриенты и добавки</h1>
        <p className="text-slate-500">Назначения врача и персональные рекомендации ИИ</p>
      </div>

      {/* ── Section 1: Doctor prescriptions ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Назначения врача</h2>
          {activeCount > 0 && (
            <Badge variant="info" className="text-xs">{activeCount} активных</Badge>
          )}
        </div>

        {doctorSupplements.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Назначений от врача пока нет</p>
            <p className="text-slate-400 text-xs mt-1">Схема добавок появится после консультации со специалистом</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doctorSupplements.map((s: any) => (
              <Card key={s.id} className={`card-hover ${!s.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Pill className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="text-sm font-medium text-blue-700">{s.dosage}</p>
                      </div>
                    </div>
                    <Badge variant={s.isActive ? 'success' : 'outline'}>
                      {s.isActive ? 'Активно' : 'Завершено'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{s.frequency}</span>
                    </div>
                    {s.reason && (
                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="text-slate-400 mt-0.5">⚡</span>
                        <span>{s.reason}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Назначил: {s.prescribedBy}</span>
                    </div>
                    {s.startDate && (
                      <p className="text-xs text-slate-400">
                        С {formatDate(s.startDate)}{s.endDate ? ` по ${formatDate(s.endDate)}` : ''}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: AI nutrient recommendations ── */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Рекомендации ИИ по нутриентам</h2>
              {generatedAt && (
                <p className="text-xs text-slate-400">
                  Сформировано {new Date(generatedAt).toLocaleString('ru-RU')}
                </p>
              )}
            </div>
          </div>

          <Button
            variant={aiRecs.length ? 'outline' : 'gradient'}
            className="gap-2"
            onClick={handleGenerateAI}
            loading={generating}
          >
            {aiRecs.length
              ? <><RefreshCw className="w-4 h-4" /> Обновить анализ</>
              : <><Sparkles className="w-4 h-4" /> Получить рекомендации ИИ</>}
          </Button>
        </div>

        {/* Legal disclaimer — always visible */}
        <div className="flex gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 mb-6">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Информация носит исключительно ознакомительный характер</p>
            <p>
              Представленные рекомендации сформированы автоматически на основе анализа Ваших
              персональных медицинских данных с применением технологий искусственного интеллекта.
              Они <strong>не являются медицинским назначением, предписанием или медицинской
              услугой</strong> и не могут заменить очную консультацию с лечащим врачом,
              врачом-нутрициологом или иным квалифицированным специалистом в области
              здравоохранения.
            </p>
            <p className="mt-1.5">
              Перед началом приёма любых биологически активных добавок (БАД), витаминных
              комплексов или нутрицевтиков необходимо проконсультироваться с врачом с учётом
              индивидуального состояния здоровья, анамнеза, принимаемых лекарственных препаратов
              и возможных противопоказаний.{' '}
              <strong>Самолечение может нанести вред здоровью.</strong>{' '}
              Платформа «Цифровой Двойник Здоровья» не несёт ответственности за последствия
              самостоятельного применения данных рекомендаций без предварительной консультации
              со специалистом.
            </p>
          </div>
        </div>

        {!aiRecs.length && !generating && (
          <div className="text-center py-12 border border-dashed border-violet-200 rounded-2xl bg-violet-50/40">
            <Brain className="w-12 h-12 text-violet-300 mx-auto mb-3" />
            <p className="text-slate-700 text-sm font-medium">ИИ проанализирует все ваши данные</p>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
              Лабораторные анализы, дневник питания, образ жизни, медицинские исследования —
              и подберёт персональные нутриенты с конкретным обоснованием
            </p>
          </div>
        )}

        {generating && (
          <div className="flex flex-col items-center gap-3 py-14">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <p className="text-sm text-slate-600">ИИ анализирует ваши данные…</p>
            <p className="text-xs text-slate-400">Обычно занимает 10–20 секунд</p>
          </div>
        )}

        {aiRecs.length > 0 && !generating && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiRecs.map((rec: any, i: number) => {
              const catKey = (rec.category || 'другое').toLowerCase()
              const catColor = CATEGORY_COLORS[catKey] || CATEGORY_COLORS['другое']

              return (
                <Card key={i} className="card-hover border-violet-100">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{rec.name}</p>
                          <p className="text-sm font-medium text-violet-700">{rec.dosage}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs border ${catColor}`}>{rec.category}</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{rec.frequency}</span>
                      </div>

                      {rec.reason && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed border border-slate-100">
                          {rec.reason}
                        </div>
                      )}

                      {rec.priority && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[rec.priority] || 'bg-slate-400'}`} />
                          <span className="text-xs text-slate-500">{PRIORITY_LABEL[rec.priority] || rec.priority}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
