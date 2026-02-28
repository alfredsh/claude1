import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { doctorAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, Pill, Star, Brain, Loader2, ChevronDown, ChevronUp, User } from 'lucide-react'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [expandedLab, setExpandedLab] = useState<string | null>(null)
  const [showPrescForm, setShowPrescForm] = useState(false)
  const [prescForm, setPrescForm] = useState({ name: '', dosage: '', frequency: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const { data: patient, refetch } = useQuery({ queryKey: ['doctor-patient', id], queryFn: () => doctorAPI.getPatient(id!).then(r => r.data) })

  const analyzePatient = async () => {
    setAnalyzing(true)
    try {
      const res = await doctorAPI.analyzePatient(id!)
      setAnalysis(res.data.analysis)
    } catch {
      toast({ title: 'Ошибка анализа', variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  const savePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await doctorAPI.addPrescription({ ...prescForm, patientId: patient?.id })
      refetch()
      setShowPrescForm(false)
      setPrescForm({ name: '', dosage: '', frequency: '', reason: '' })
      toast({ title: 'Назначение добавлено!' })
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  if (!patient) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>

  const bmi = patient.height && patient.weight ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1) : null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
            {patient.firstName?.[0]}{patient.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{patient.firstName} {patient.lastName}</h1>
            <p className="text-slate-500">{patient.user?.email}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {patient.gender && <Badge variant="outline">{patient.gender}</Badge>}
              {bmi && <Badge variant="outline">ИМТ: {bmi}</Badge>}
              {patient.bloodType && <Badge variant="info">{patient.bloodType}</Badge>}
            </div>
          </div>
        </div>
        <Button variant="gradient" className="gap-2" onClick={analyzePatient} loading={analyzing}>
          <Brain className="w-4 h-4" /> ИИ-анализ пациента
        </Button>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <CardHeader><CardTitle className="flex items-center gap-2 text-indigo-800"><Brain className="w-5 h-5" /> Клиническое заключение ИИ</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" /> Данные пациента</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ['Рост', patient.height ? `${patient.height} см` : '—'],
              ['Вес', patient.weight ? `${patient.weight} кг` : '—'],
              ['Активность', patient.activityLevel || '—'],
              ['Тип питания', patient.dietType || '—'],
              ['Сон', patient.sleepHours ? `${patient.sleepHours} ч/сут` : '—'],
              ['Уровень стресса', patient.stressLevel ? `${patient.stressLevel}/10` : '—'],
              ['Курение', patient.smokingStatus || '—'],
              ['Алкоголь', patient.alcoholUsage || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-900">{value}</span>
              </div>
            ))}

            {patient.chronicDiseases?.length > 0 && (
              <div className="pt-2">
                <p className="text-slate-500 mb-2">Хронические заболевания:</p>
                <div className="flex flex-wrap gap-1">
                  {patient.chronicDiseases.map((d: string) => <Badge key={d} variant="warning" className="text-xs">{d}</Badge>)}
                </div>
              </div>
            )}
            {patient.allergies?.length > 0 && (
              <div>
                <p className="text-slate-500 mb-2">Аллергии:</p>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((a: string) => <Badge key={a} variant="danger" className="text-xs">{a}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5 text-blue-600" /> Назначения</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowPrescForm(!showPrescForm)}>Добавить</Button>
          </CardHeader>
          <CardContent>
            {showPrescForm && (
              <form onSubmit={savePrescription} className="mb-4 space-y-3 p-4 bg-slate-50 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Омега-3" value={prescForm.name} onChange={e => setPrescForm(f => ({ ...f, name: e.target.value }))} required />
                  <Input placeholder="1000 мг" value={prescForm.dosage} onChange={e => setPrescForm(f => ({ ...f, dosage: e.target.value }))} required />
                </div>
                <Input placeholder="2 раза в день" value={prescForm.frequency} onChange={e => setPrescForm(f => ({ ...f, frequency: e.target.value }))} required />
                <Input placeholder="Причина назначения" value={prescForm.reason} onChange={e => setPrescForm(f => ({ ...f, reason: e.target.value }))} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" variant="gradient" loading={saving}>Сохранить</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowPrescForm(false)}>Отмена</Button>
                </div>
              </form>
            )}
            <div className="space-y-2">
              {patient.supplements?.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.dosage} · {s.frequency}</p>
                  </div>
                  <Badge variant={s.isActive ? 'success' : 'outline'} className="text-xs">{s.isActive ? 'Активно' : 'Завершено'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab results */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5 text-teal-600" /> Анализы</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patient.labResults?.map((lr: any) => {
              const isExpanded = expandedLab === lr.id
              const abnormal = lr.parameters?.filter((p: any) => p.status !== 'NORMAL') || []
              return (
                <div key={lr.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between" onClick={() => setExpandedLab(isExpanded ? null : lr.id)}>
                    <div>
                      <p className="font-medium">{lr.testName}</p>
                      <p className="text-sm text-slate-500">{formatDate(lr.testDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {abnormal.length > 0 && <Badge variant="danger" className="text-xs">⚠️ {abnormal.length}</Badge>}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {isExpanded && lr.parameters?.length > 0 && (
                    <div className="border-t border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lr.parameters.map((p: any) => (
                        <div key={p.id} className={`flex justify-between items-center p-2 rounded-lg border ${getStatusColor(p.status)}`}>
                          <span className="text-sm">{p.name}</span>
                          <div className="text-right">
                            <span className="font-bold text-sm">{p.value} {p.unit}</span>
                            <p className="text-xs">{getStatusLabel(p.status)}</p>
                          </div>
                        </div>
                      ))}
                      {lr.aiInterpretation && (
                        <div className="col-span-2 bg-blue-50 rounded-xl p-3 mt-2">
                          <p className="text-xs font-semibold text-blue-800 mb-1">🤖 ИИ-интерпретация</p>
                          <p className="text-xs text-slate-700">{lr.aiInterpretation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {patient.recommendations?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-purple-600" /> Рекомендации</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patient.recommendations.map((rec: any) => (
                <div key={rec.id} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'success'} className="text-xs">{rec.priority}</Badge>
                    <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                  </div>
                  <p className="font-medium text-sm">{rec.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
