import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { patientAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Utensils, Plus, TrendingUp } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const MEAL_TYPES = ['Завтрак', 'Обед', 'Ужин', 'Перекус']
const MACRO_COLORS = { Белки: '#3B82F6', Углеводы: '#10B981', Жиры: '#F59E0B', Клетчатка: '#8B5CF6' }

export default function Nutrition() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ mealType: 'Завтрак', foodName: '', calories: '', protein: '', carbs: '', fats: '', fiber: '' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data: logs = [] } = useQuery({ queryKey: ['nutrition'], queryFn: () => patientAPI.getNutrition({ days: 7 }).then(r => r.data) })

  const totals = logs.reduce((acc: any, log: any) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fats: acc.fats + (log.fats || 0),
    fiber: acc.fiber + (log.fiber || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 })

  const macroData = [
    { name: 'Белки', value: Math.round(totals.protein) },
    { name: 'Углеводы', value: Math.round(totals.carbs) },
    { name: 'Жиры', value: Math.round(totals.fats) },
    { name: 'Клетчатка', value: Math.round(totals.fiber) },
  ].filter(d => d.value > 0)

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await patientAPI.addNutrition(form)
      qc.invalidateQueries({ queryKey: ['nutrition'] })
      setShowForm(false)
      setForm({ mealType: 'Завтрак', foodName: '', calories: '', protein: '', carbs: '', fats: '', fiber: '' })
      toast({ title: 'Приём пищи записан!' })
    } catch { toast({ title: 'Ошибка', variant: 'destructive' }) }
    finally { setLoading(false) }
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
          <CardHeader><CardTitle>Записать приём пищи</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Тип приёма</label>
                  <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.mealType} onChange={set('mealType')}>
                    {MEAL_TYPES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Блюдо / продукт *</label>
                  <Input placeholder="Куриная грудка с рисом" value={form.foodName} onChange={set('foodName')} required />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[['calories', 'Калории (ккал)'], ['protein', 'Белки (г)'], ['carbs', 'Углеводы (г)'], ['fats', 'Жиры (г)'], ['fiber', 'Клетчатка (г)']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1.5">{label}</label>
                    <Input type="number" step="0.1" min="0" value={(form as any)[key]} onChange={set(key)} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="gradient" loading={loading}>Сохранить</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Totals */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> За 7 дней</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Калории', value: Math.round(totals.calories), unit: 'ккал', color: 'text-orange-600' },
              { label: 'Белки', value: Math.round(totals.protein), unit: 'г', color: 'text-blue-600' },
              { label: 'Углеводы', value: Math.round(totals.carbs), unit: 'г', color: 'text-green-600' },
              { label: 'Жиры', value: Math.round(totals.fats), unit: 'г', color: 'text-yellow-600' },
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
                  <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}г`}>
                    {macroData.map((entry) => (
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
        <CardHeader><CardTitle className="flex items-center gap-2"><Utensils className="w-5 h-5" /> История питания</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>Записей нет. Начните отслеживать питание!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{log.mealType}</span>
                      <span className="font-medium text-slate-900">{log.foodName}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(log.loggedAt)}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    {log.calories && <p className="font-bold text-orange-600">{log.calories} ккал</p>}
                    <p className="text-xs text-slate-400">Б:{log.protein || 0}г У:{log.carbs || 0}г Ж:{log.fats || 0}г</p>
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
