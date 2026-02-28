import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { doctorAPI } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Users, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function PatientsList() {
  const [search, setSearch] = useState('')

  const { data: patients = [] } = useQuery({
    queryKey: ['doctor-patients', search],
    queryFn: () => doctorAPI.getPatients(search ? { search } : {}).then(r => r.data),
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Пациенты</h1>
        <p className="text-slate-500">{patients.length} пациентов в системе</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input className="pl-10" placeholder="Поиск по имени или email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Пациенты не найдены</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((p: any) => {
            const hasAlerts = p.labResults?.[0]?.parameters?.some((param: any) => param?.status === 'CRITICAL')
            const bmi = p.height && p.weight ? (p.weight / Math.pow(p.height / 100, 2)).toFixed(1) : null

            return (
              <Link key={p.id} to={`/doctor/patients/${p.id}`}>
                <Card className="card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                            {hasAlerts && <Badge variant="danger" className="text-xs">⚠️ Критично</Badge>}
                          </div>
                          <p className="text-sm text-slate-500">{p.user?.email}</p>
                          <div className="flex gap-3 mt-1 flex-wrap">
                            {p.gender && <span className="text-xs text-slate-400">{p.gender}</span>}
                            {bmi && <span className="text-xs text-slate-400">ИМТ: {bmi}</span>}
                            {p.bloodType && <span className="text-xs text-slate-400">{p.bloodType}</span>}
                            {p.chronicDiseases?.length > 0 && (
                              <span className="text-xs text-orange-500">{p.chronicDiseases.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-500">Анализов: {p.labResults?.length || 0}</p>
                          {p.labResults?.[0] && <p className="text-xs text-slate-400">{formatDate(p.labResults[0].testDate)}</p>}
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
