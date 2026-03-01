import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { patientAPI, BACKEND_URL } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Utensils, Plus, TrendingUp, Camera, Loader2, Sparkles, X, ImageIcon } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const MEAL_TYPES = ['Завтрак', 'Обед', 'Ужин', 'Перекус']
const MACRO_COLORS = { Белки: '#3B82F6', Углеводы: '#10B981', Жиры: '#F59E0B', Клетчатка: '#8B5CF6' }

const CONFIDENCE_LABEL: Record<string, string> = {
  high:   'высокая точность',
  medium: 'средняя точность',
  low:    'низкая точность',
}
const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'text-green-700 bg-green-50 border-green-200',
  medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  low:    'text-red-700 bg-red-50 border-red-200',
}

const EMPTY_FORM = { mealType: 'Завтрак', foodName: '', calories: '', protein: '', carbs: '', fats: '', fiber: '', imageUrl: '' }

export default function Nutrition() {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [aiMeta, setAiMeta] = useState<{ confidence: string; notes: string | null } | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const { data: logs = [] } = useQuery({
    queryKey: ['nutrition'],
    queryFn: () => patientAPI.getNutrition({ days: 7 }).then(r => r.data),
  })

  const totals = logs.reduce((acc: any, log: any) => ({
    calories: acc.calories + (log.calories || 0),
    protein:  acc.protein  + (log.protein  || 0),
    carbs:    acc.carbs    + (log.carbs    || 0),
    fats:     acc.fats     + (log.fats     || 0),
    fiber:    acc.fiber    + (log.fiber    || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 })

  const macroData = [
    { name: 'Белки',     value: Math.round(totals.protein) },
    { name: 'Углеводы',  value: Math.round(totals.carbs) },
    { name: 'Жиры',      value: Math.round(totals.fats) },
    { name: 'Клетчатка', value: Math.round(totals.fiber) },
  ].filter(d => d.value > 0)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoPreview(URL.createObjectURL(file))
    setAiMeta(null)
    setAnalyzing(true)

    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await patientAPI.analyzeNutritionPhoto(fd)
      const data = res.data

      setForm(f => ({
        ...f,
        foodName: data.foodName   || f.foodName,
        calories: data.calories != null ? String(Math.round(data.calories)) : f.calories,
        protein:  data.protein  != null ? String(Math.round(data.protein))  : f.protein,
        carbs:    data.carbs    != null ? String(Math.round(data.carbs))    : f.carbs,
        fats:     data.fats     != null ? String(Math.round(data.fats))     : f.fats,
        fiber:    data.fiber    != null ? String(Math.round(data.fiber))    : f.fiber,
        imageUrl: data.imageUrl || f.imageUrl,
      }))
      setAiMeta({ confidence: data.confidence || 'medium', notes: data.notes || null })
      toast({ title: 'ИИ определил состав блюда', description: 'Проверьте данные и сохраните' })
    } catch (err: any) {
      toast({
        title: 'Не удалось распознать фото',
        description: err.response?.data?.error || 'Попробуйте другое фото или заполните вручную',
        variant: 'destructive',
      })
      setPhotoPreview(null)
    } finally {
      setAnalyzing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearPhoto = () => {
    setPhotoPreview(null)
    setAiMeta(null)
    setForm(f => ({ ...f, imageUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setPhotoPreview(null)
    setAiMeta(null)
  }

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await patientAPI.addNutrition(form)
      qc.invalidateQueries({ queryKey: ['nutrition'] })
      handleClose()
      toast({ title: 'Приём пищи записан!' })
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Дневник питания</h1>
          <p className="text-slate-500">Отслеживайте рацион за последние 7 дней</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Добавить приём пищи
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Записать приём пищи</span>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addLog} className="space-y-5">

              {/* ── Photo analysis block ── */}
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-5 h-5 text-primary" />
                  <span className="font-medium text-slate-800">Фото блюда — ИИ определит КБЖУ</span>
                  <span className="text-xs text-slate-400 ml-auto">JPG, PNG · до 10 МБ</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                {!photoPreview && !analyzing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-sm font-medium">Сфотографировать или загрузить фото</span>
                    <span className="text-xs text-slate-400">Одно блюдо или несколько — ИИ посчитает всё</span>
                  </button>
                )}

                {analyzing && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    {photoPreview && (
                      <img src={photoPreview} alt="preview" className="h-32 rounded-xl object-cover" />
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      GPT-4o анализирует блюдо…
                    </div>
                  </div>
                )}

                {photoPreview && !analyzing && (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img src={photoPreview} alt="preview" className="h-32 rounded-xl object-cover border border-slate-200" />
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {aiMeta && (
                      <div className={`flex flex-wrap items-center gap-2 text-xs px-3 py-2 rounded-lg border ${CONFIDENCE_COLOR[aiMeta.confidence] || CONFIDENCE_COLOR.medium}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="font-semibold">ИИ заполнил данные</span>
                        <span>·</span>
                        <span>{CONFIDENCE_LABEL[aiMeta.confidence] || aiMeta.confidence}</span>
                        {aiMeta.notes && <><span>·</span><span className="italic">{aiMeta.notes}</span></>}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-primary hover:underline"
                    >
                      Загрузить другое фото
                    </button>
                  </div>
                )}
              </div>

              {/* ── Manual fields ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Тип приёма</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={form.mealType}
                    onChange={set('mealType')}
                  >
                    {MEAL_TYPES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Блюдо / продукт *
                    {aiMeta && <span className="ml-1 text-xs text-primary font-normal">← заполнено ИИ</span>}
                  </label>
                  <Input
                    placeholder="Куриная грудка с рисом"
                    value={form.foodName}
                    onChange={set('foodName')}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {([
                  ['calories', 'Калории (ккал)'],
                  ['protein',  'Белки (г)'],
                  ['carbs',    'Углеводы (г)'],
                  ['fats',     'Жиры (г)'],
                  ['fiber',    'Клетчатка (г)'],
                ] as [string, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1.5">{label}</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={(form as any)[key]}
                      onChange={set(key)}
                      className={aiMeta && (form as any)[key] ? 'border-primary/50 bg-primary/5' : ''}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="gradient" loading={saving}>Сохранить</Button>
                <Button type="button" variant="outline" onClick={handleClose}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> За 7 дней
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Калории',  value: Math.round(totals.calories), unit: 'ккал', color: 'text-orange-600' },
              { label: 'Белки',    value: Math.round(totals.protein),  unit: 'г',    color: 'text-blue-600' },
              { label: 'Углеводы', value: Math.round(totals.carbs),    unit: 'г',    color: 'text-green-600' },
              { label: 'Жиры',     value: Math.round(totals.fats),     unit: 'г',    color: 'text-yellow-600' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{label}</span>
                <span className={`font-bold ${color}`}>{value} {unit}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Макронутриенты</CardTitle></CardHeader>
          <CardContent>
            {macroData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={macroData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}г`}
                  >
                    {macroData.map(entry => (
                      <Cell key={entry.name} fill={MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Добавьте записи питания для отображения
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" /> История питания
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>Записей нет. Начните отслеживать питание!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  {/* Thumbnail */}
                  {log.imageUrl ? (
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={BACKEND_URL + log.imageUrl}
                        alt={log.foodName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{log.mealType}</span>
                      <span className="font-medium text-slate-900 truncate">{log.foodName}</span>
                      {log.imageUrl && (
                        <Badge variant="outline" className="text-xs text-slate-400 gap-1">
                          <Camera className="w-3 h-3" /> фото
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(log.loggedAt)}</p>
                  </div>

                  <div className="text-right text-sm text-slate-600 flex-shrink-0">
                    {log.calories && <p className="font-bold text-orange-600">{Math.round(log.calories)} ккал</p>}
                    <p className="text-xs text-slate-400">
                      Б:{Math.round(log.protein || 0)}г У:{Math.round(log.carbs || 0)}г Ж:{Math.round(log.fats || 0)}г
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
