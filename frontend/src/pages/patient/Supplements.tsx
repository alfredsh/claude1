import { useQuery } from '@tanstack/react-query'
import { patientAPI } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pill, Calendar, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Supplements() {
  const { data: supplements = [] } = useQuery({ queryKey: ['supplements'], queryFn: () => patientAPI.getSupplements().then(r => r.data) })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Нутриенты и добавки</h1>
        <p className="text-slate-500">Ваша персональная схема приёма нутриентов</p>
      </div>

      {supplements.length === 0 ? (
        <div className="text-center py-20">
          <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Нет назначений</h3>
          <p className="text-slate-500">Схема добавок будет назначена врачом или ИИ-коучем</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {supplements.map((s: any) => (
            <Card key={s.id} className={`card-hover ${!s.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-sm text-slate-500">{s.dosage}</p>
                    </div>
                  </div>
                  <Badge variant={s.isActive ? 'success' : 'outline'}>{s.isActive ? 'Активно' : 'Завершено'}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Частота: {s.frequency}</span>
                  </div>
                  {s.reason && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <span className="text-slate-400 mt-0.5">⚡</span>
                      <span>{s.reason}</span>
                    </div>
                  )}
                  {s.prescribedBy && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Назначил: {s.prescribedBy}</span>
                    </div>
                  )}
                  {s.startDate && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <span>С {formatDate(s.startDate)}{s.endDate ? ` по ${formatDate(s.endDate)}` : ''}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
