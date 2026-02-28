import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { patientAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Activity, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const METRIC_TYPES = [
  { value: 'Вес', unit: 'кг', color: '#3B82F6' },
  { value: 'Давление систолическое', unit: 'мм рт.ст.', color: '#EF4444' },
  { value: 'Давление диастолическое', unit: 'мм рт.ст.', color: '#F97316' },
  { value: 'ЧСС', unit: 'уд/мин', color: '#EC4899' },
  { value: 'Глюкоза', unit: 'ммоль/л', color: '#10B981' },
  { value: 'Температура', unit: '°C', color: '#8B5CF6' },
  { value: 'SpO2', unit: '%', color: '#14B8A6' },
]

export default function HealthMetrics() {
  const qc = useQueryClient()
  const [selectedType, setSelectedType] = useState('Вес')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'Вес', value: '', unit: 'кг', note: '' })
  const [loading, setLoading] = useState(false)

  const { data: metrics = [] } = useQuery({
    queryKey: ['health-metrics', selectedType],
    queryFn: () => patientAPI.getMetrics({ type: selectedType, days: 30 }).then(r => r.data),
  })

  const chartData = metrics.map((m: any) => ({
    date: formatDate(m.recordedAt, { day: '2-digit', month: '2-digit' }),
    value: m.value,
  }))

  const latest = metrics[metrics.length - 1]
  const previous = metrics[metrics.length - 2]
  const trend = latest && previous ? (latest.value - previous.value) / previous.value * 100 : 0

  const addMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await patientAPI.addMetric(form)
      qc.invalidateQueries({ queryKey: ['health-metrics'] })
      setShowForm(false)
      setForm({ type: 'Вес', value: '', unit: 'кг', note: '' })
      toast({ title: 'Показатель добавлен!' })
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Показатели здоровья</h1>
          <p className="text-slate-500">Отслеживайте динамику ваших показателей</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Добавить показатель
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Добавить показатель</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addMetric} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Тип</label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.type}
                  onChange={(e) => {
                    const mt = METRIC_TYPES.find(m => m.value === e.target.value)
                    setForm(f => ({ ...f, type: e.target.value, unit: mt?.unit || '' }))
                  }}>
                  {METRIC_TYPES.map(m => <option key={m.value}>{m.value}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Значение</label>
                <Input type="number" step="0.01" placeholder="0.0" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Единица</label>
                <Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Примечание</label>
                <Input placeholder="Необязательно" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-3">
                <Button type="submit" variant="gradient" loading={loading}>Сохранить</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {METRIC_TYPES.map(({ value, color }) => (
          <button key={value} onClick={() => setSelectedType(value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedType === value ? 'text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            style={selectedType === value ? { backgroundColor: color } : {}}>
            {value}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Последнее значение</p>
              <p className="text-3xl font-bold text-slate-900">{latest.value.toFixed(1)}</p>
              <p className="text-sm text-slate-500">{latest.unit}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Изменение</p>
              <div className="flex items-center gap-2">
                {trend > 0 ? <TrendingUp className="w-5 h-5 text-red-500" /> : <TrendingDown className="w-5 h-5 text-green-500" />}
                <p className={`text-2xl font-bold ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-slate-500">vs предыдущий</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Записей за 30 дней</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.length}</p>
              <p className="text-sm text-slate-500">измерений</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Динамика: {selectedType}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="value" name={selectedType} stroke={METRIC_TYPES.find(m => m.value === selectedType)?.color || '#3B82F6'} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Нет данных для отображения</p>
              <p className="text-sm text-slate-400 mt-1">Добавьте первое измерение</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
