import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { medicalDocAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FileHeart, Upload, ChevronDown, ChevronUp, Brain,
  Plus, Loader2, Trash2, Activity, Scan, Microscope, Wind, Radiation, FileText,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const DOC_TYPES = [
  { value: 'ECG',        label: 'ЭКГ',           icon: Activity,   color: 'text-red-500   bg-red-50' },
  { value: 'ULTRASOUND', label: 'УЗИ',           icon: Scan,       color: 'text-blue-500  bg-blue-50' },
  { value: 'CT',         label: 'КТ',            icon: Radiation,  color: 'text-purple-500 bg-purple-50' },
  { value: 'MRI',        label: 'МРТ',           icon: Scan,       color: 'text-indigo-500 bg-indigo-50' },
  { value: 'SPIROMETRY', label: 'Спирометрия',   icon: Wind,       color: 'text-teal-500  bg-teal-50' },
  { value: 'XRAY',       label: 'Рентген',       icon: Microscope, color: 'text-slate-500  bg-slate-100' },
  { value: 'OTHER',      label: 'Другое',        icon: FileText,   color: 'text-orange-500 bg-orange-50' },
]

const getDocMeta = (type: string) => DOC_TYPES.find(d => d.value === type) || DOC_TYPES[DOC_TYPES.length - 1]

const renderMeasurements = (docType: string, data: any) => {
  if (!data || !Object.keys(data).length) return null

  if (docType === 'ECG') {
    const rows = [
      data.heartRate  && { label: 'ЧСС',              value: typeof data.heartRate === 'object' ? `${data.heartRate.value} ${data.heartRate.unit}` : data.heartRate, normal: data.heartRate?.normal },
      data.rhythm     && { label: 'Ритм',              value: data.rhythm },
      data.pqInterval && { label: 'Интервал PQ',       value: typeof data.pqInterval === 'object' ? `${data.pqInterval.value} ${data.pqInterval.unit}` : data.pqInterval, normal: data.pqInterval?.normal },
      data.qrsComplex && { label: 'Комплекс QRS',      value: typeof data.qrsComplex === 'object' ? `${data.qrsComplex.value} ${data.qrsComplex.unit}` : data.qrsComplex, normal: data.qrsComplex?.normal },
      data.qtInterval && { label: 'Интервал QT',       value: typeof data.qtInterval === 'object' ? `${data.qtInterval.value} ${data.qtInterval.unit}` : data.qtInterval, normal: data.qtInterval?.normal },
      data.electricAxis && { label: 'Электрическая ось', value: data.electricAxis },
    ].filter(Boolean) as { label: string; value: any; normal?: string }[]

    if (!rows.length) return null
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2 text-slate-500 font-medium">Показатель</th>
              <th className="text-left px-3 py-2 text-slate-500 font-medium">Значение</th>
              <th className="text-left px-3 py-2 text-slate-500 font-medium hidden sm:table-cell">Норма</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-3 py-2 text-slate-600">{r.label}</td>
                <td className="px-3 py-2 font-medium text-slate-900">{String(r.value)}</td>
                <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">{r.normal || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (docType === 'SPIROMETRY') {
    const rows = [
      data.fvc    && { label: 'ФЖЕЛ / FVC',     value: data.fvc },
      data.fev1   && { label: 'ОФВ1 / FEV1',    value: data.fev1 },
      data.fev1fvc && { label: 'ОФВ1/ФЖЕЛ',     value: data.fev1fvc },
      data.pef    && { label: 'ПСВ / PEF',       value: data.pef },
    ].filter(Boolean) as { label: string; value: any }[]

    if (!rows.length) return null
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2 text-slate-500 font-medium">Показатель</th>
              <th className="text-left px-3 py-2 text-slate-500 font-medium">Значение</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-3 py-2 text-slate-600">{r.label}</td>
                <td className="px-3 py-2 font-medium text-slate-900">{String(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ULTRASOUND | CT | MRI | XRAY | OTHER — show findings list + conclusion
  const findings: string[] = Array.isArray(data.findings) ? data.findings : []
  const conclusion: string = data.conclusion || ''
  if (!findings.length && !conclusion) return null

  return (
    <div className="space-y-2">
      {findings.length > 0 && (
        <ul className="space-y-1">
          {findings.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {conclusion && (
        <p className="text-sm font-medium text-slate-800 border-t border-slate-100 pt-2">
          Заключение: {conclusion}
        </p>
      )}
    </div>
  )
}

export default function MedicalDocuments() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [docType, setDocType] = useState('ECG')
  const [docDate, setDocDate] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const { data: docs = [] } = useQuery({
    queryKey: ['medical-docs'],
    queryFn: () => medicalDocAPI.getAll().then(r => r.data),
    refetchInterval: 5000,
  })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('docType', docType)
      if (docDate) fd.append('docDate', docDate)

      await medicalDocAPI.upload(fd)
      qc.invalidateQueries({ queryKey: ['medical-docs'] })
      setShowForm(false)
      setFile(null)
      setDocDate('')
      toast({ title: 'Документ загружен!', description: 'ИИ анализирует содержимое…' })
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.response?.data?.error, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Удалить этот документ?')) return
    setDeleting(id)
    try {
      await medicalDocAPI.delete(id)
      qc.invalidateQueries({ queryKey: ['medical-docs'] })
      if (expanded === id) setExpanded(null)
      toast({ title: 'Документ удалён' })
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const selectedMeta = getDocMeta(docType)
  const SelectedIcon = selectedMeta.icon

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Медицинские исследования</h1>
          <p className="text-slate-500">ЭКГ, УЗИ, КТ, МРТ, рентген и другие документы</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Загрузить документ
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Загрузить исследование
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-5">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium mb-2">Тип исследования *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DOC_TYPES.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDocType(value)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all ${
                        docType === value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${docType === value ? 'text-primary' : color.split(' ')[0]}`} />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Дата исследования
                    <span className="text-slate-400 font-normal ml-1">(если не будет — ИИ найдёт сам)</span>
                  </label>
                  <Input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Файл (PDF, JPG, PNG) *</label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              </div>

              {file && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-center gap-3 text-sm text-blue-700">
                  <SelectedIcon className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <strong>GPT-4o</strong> прочитает документ, определит дату, ключевые данные
                    {docType === 'ECG' && ' (ЧСС, ритм, интервалы)'} и составит заключение для пациента.
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" variant="gradient" loading={uploading} className="gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Загружаю…' : 'Загрузить и проанализировать'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-20">
          <FileHeart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Исследований нет</h3>
          <p className="text-slate-500 mb-6">Загрузите ЭКГ, УЗИ, КТ, МРТ или другой документ</p>
          <Button variant="gradient" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Загрузить документ
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc: any) => {
            const meta = getDocMeta(doc.docType)
            const DocIcon = meta.icon
            const isExpanded = expanded === doc.id
            const measurements = doc.measurements && typeof doc.measurements === 'object' ? doc.measurements : null

            return (
              <Card key={doc.id} className="overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : doc.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                        <DocIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{doc.title}</p>
                          <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{formatDate(doc.docDate)}</p>
                        <div className="mt-2">
                          <Badge
                            variant={doc.status === 'completed' ? 'success' : doc.status === 'processing' ? 'warning' : 'outline'}
                            className="text-xs"
                          >
                            {doc.status === 'completed' ? '✓ Обработан' : doc.status === 'processing'
                              ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Анализирую…</span>
                              : doc.status === 'error' ? '⚠ Ошибка' : 'Ожидание'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={e => handleDelete(doc.id, e)}
                        disabled={deleting === doc.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Удалить"
                      >
                        {deleting === doc.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    {measurements && renderMeasurements(doc.docType, measurements)}

                    {doc.aiSummary && (
                      <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">ИИ-заключение</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{doc.aiSummary}</p>
                      </div>
                    )}

                    {doc.status === 'processing' && !doc.aiSummary && (
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        ИИ анализирует документ, обычно занимает 10–30 секунд…
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
