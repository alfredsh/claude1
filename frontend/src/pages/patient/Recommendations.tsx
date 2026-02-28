import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { patientAPI, aiAPI } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Sparkles, Filter } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

const CATEGORIES = ['Все', 'питание', 'активность', 'сон', 'стресс', 'нутриенты', 'врач', 'общее']

export default function PatientRecommendations() {
  const [filter, setFilter] = useState('Все')
  const [generating, setGenerating] = useState(false)

  const { data: recs = [], refetch } = useQuery({ queryKey: ['recommendations'], queryFn: () => patientAPI.getRecommendations().then(r => r.data) })

  const filtered = filter === 'Все' ? recs : recs.filter((r: any) => r.category === filter)

  const generate = async () => {
    setGenerating(true)
    try {
      await aiAPI.generateRecommendations()
      refetch()
      toast({ title: 'Рекомендации обновлены!', description: 'ИИ проанализировал ваши данные' })
    } catch {
      toast({ title: 'Ошибка', description: 'Проверьте настройки ИИ', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const priorityConfig = {
    high: { label: 'Высокий', variant: 'danger' as const, emoji: '🔴' },
    medium: { label: 'Средний', variant: 'warning' as const, emoji: '🟡' },
    low: { label: 'Низкий', variant: 'success' as const, emoji: '🟢' },
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Рекомендации</h1>
          <p className="text-slate-500">Персонализированные рекомендации от ИИ и врачей</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={generate} loading={generating}>
          <Sparkles className="w-4 h-4" /> Обновить ИИ-рекомендации
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Filter className="w-4 h-4 text-slate-400 self-center" />
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filter === cat ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Нет рекомендаций</h3>
          <Button variant="gradient" onClick={generate} loading={generating} className="gap-2 mt-4">
            <Sparkles className="w-4 h-4" /> Сгенерировать рекомендации
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rec: any) => {
            const pc = priorityConfig[rec.priority as keyof typeof priorityConfig] || priorityConfig.medium
            return (
              <Card key={rec.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{pc.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                        <div className="flex gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-xs capitalize">{rec.category}</Badge>
                          <Badge variant={pc.variant} className="text-xs">{pc.label}</Badge>
                          <Badge variant={rec.source === 'doctor' ? 'info' : 'secondary'} className="text-xs">
                            {rec.source === 'doctor' ? '👨‍⚕️ Врач' : '🤖 ИИ'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{rec.description}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatDate(rec.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
