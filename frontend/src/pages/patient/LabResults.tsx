import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { labAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, Upload, ChevronDown, ChevronUp, Brain, Plus, Loader2, Trash2 } from 'lucide-react'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function LabResults() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ testName: '', testDate: '', parameters: '' })
  const [file, setFile] = useState<File | null>(null)

  const { data: results = [] } = useQuery({
    queryKey: ['lab-results'],
    queryFn: () => labAPI.getAll().then(r => r.data),
    refetchInterval: 5000,
  })

  const SAMPLE_PARAMS = JSON.stringify([
    { name: 'Гемоглобин', value: 135, unit: 'г/л', normalMin: 130, normalMax: 160 },
    { name: 'Холестерин', value: 5.8, unit: 'ммоль/л', normalMin: 0, normalMax: 5.2 },
    { name: 'Глюкоза', value: 5.0, unit: 'ммоль/л', normalMin: 3.9, normalMax: 6.1 },
  ], null, 2)

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Удалить этот анализ?')) return
    setDeleting(id)
    try {
      await labAPI.delete(id)
      qc.invalidateQueries({ queryKey: ['lab-results'] })
      if (expanded === id) setExpanded(null)
      toast({ title: 'Анализ удалён' })
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('testName', form.testName)
      fd.append('testDate', form.testDate)
      fd.append('parameters', form.parameters || '[]')
      if (file) fd.append('file', file)

      await labAPI.upload(fd)
      qc.invalidateQueries({ queryKey: ['lab-results'] })
      setShowForm(false)
      setForm({ testName: '', testDate: '', parameters: '' })
      setFile(null)
      toast({ title: 'Анализ загружен!', description: 'ИИ начал интерпретацию результатов' })
    } catch (err: any) {
      toast({ title: 'Ошибка загрузки', description: err.response?.data?.error, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Лабораторные анализы</h1>
          <p className="text-slate-500">Загружайте и анализируйте результаты с помощью ИИ</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Добавить анализ
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Загрузить анализ</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Название анализа *</label>
                  <Input placeholder="Общий анализ крови" value={form.testName} onChange={(e) => setForm(f => ({ ...f, testName: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Дата анализа *</label>
                  <Input type="date" value={form.testDate} onChange={(e) => setForm(f => ({ ...f, testDate: e.target.value }))} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Параметры (JSON формат)
                  <button type="button" className="ml-2 text-xs text-primary hover:underline" onClick={() => setForm(f => ({ ...f, parameters: SAMPLE_PARAMS }))}>
                    Вставить пример
                  </button>
                </label>
                <textarea className="w-full h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder={`[\n  {"name":"Гемоглобин","value":135,"unit":"г/л","normalMin":130,"normalMax":160}\n]`} value={form.parameters} onChange={(e) => setForm(f => ({ ...f, parameters: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Файл анализа (PDF, JPG)</label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="gradient" loading={uploading} className="gap-2">
                  <Upload className="w-4 h-4" /> Загрузить
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {results.length === 0 ? (
        <div className="text-center py-20">
          <FlaskConical className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Анализов нет</h3>
          <p className="text-slate-500 mb-6">Загрузите первый анализ для ИИ-интерпретации</p>
          <Button variant="gradient" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Загрузить анализ
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result: any) => {
            const isExpanded = expanded === result.id
            const abnormal = result.parameters?.filter((p: any) => p.status !== 'NORMAL') || []

            return (
              <Card key={result.id} className="overflow-hidden">
                <div className="p-5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(isExpanded ? null : result.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <FlaskConical className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{result.testName}</p>
                        <p className="text-sm text-slate-500">{formatDate(result.testDate)}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {abnormal.length > 0 && (
                            <Badge variant="danger" className="text-xs">⚠️ {abnormal.length} отклонений</Badge>
                          )}
                          <Badge variant={result.status === 'completed' ? 'success' : result.status === 'processing' ? 'warning' : 'outline'} className="text-xs">
                            {result.status === 'completed' ? '✓ Обработан' : result.status === 'processing' ? (
                              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Обрабатывается</span>
                            ) : 'Ошибка'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(result.id, e)}
                        disabled={deleting === result.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Удалить анализ"
                      >
                        {deleting === result.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    {result.parameters?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-3">Параметры:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {result.parameters.map((p: any) => (
                            <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${getStatusColor(p.status)}`}>
                              <div>
                                <p className="font-medium text-sm">{p.name}</p>
                                {p.normalMin !== null && <p className="text-xs opacity-70">Норма: {p.normalMin}–{p.normalMax} {p.unit}</p>}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{p.value} {p.unit}</p>
                                <p className="text-xs">{getStatusLabel(p.status)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.aiInterpretation && (
                      <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">ИИ-интерпретация</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.aiInterpretation}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
