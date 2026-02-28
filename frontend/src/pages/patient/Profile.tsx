import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { patientAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Save, Plus, X } from 'lucide-react'
import { calculateBMI, getBMICategory } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function PatientProfile() {
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [allergyInput, setAllergyInput] = useState('')
  const [diseaseInput, setDiseaseInput] = useState('')
  const [goalInput, setGoalInput] = useState('')

  const { data: profile } = useQuery({ queryKey: ['patient-profile'], queryFn: () => patientAPI.getProfile().then(r => r.data) })

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        height: profile.height || '',
        weight: profile.weight || '',
        bloodType: profile.bloodType || '',
        phone: profile.phone || '',
        activityLevel: profile.activityLevel || '',
        dietType: profile.dietType || '',
        smokingStatus: profile.smokingStatus || '',
        alcoholUsage: profile.alcoholUsage || '',
        sleepHours: profile.sleepHours || '',
        stressLevel: profile.stressLevel || '',
        allergies: profile.allergies || [],
        chronicDiseases: profile.chronicDiseases || [],
        goals: profile.goals || [],
      })
    }
  }, [profile])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f: any) => ({ ...f, [k]: e.target.value }))

  const addTag = (field: string, value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return
    setForm((f: any) => ({ ...f, [field]: [...(f[field] || []), value.trim()] }))
    setValue('')
  }

  const removeTag = (field: string, index: number) => {
    setForm((f: any) => ({ ...f, [field]: f[field].filter((_: any, i: number) => i !== index) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await patientAPI.updateProfile(form)
      qc.invalidateQueries({ queryKey: ['patient-profile'] })
      toast({ title: 'Профиль сохранён!', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const bmi = form.height && form.weight ? calculateBMI(Number(form.weight), Number(form.height)) : null
  const bmiCategory = bmi ? getBMICategory(Number(bmi)) : null

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Мой профиль</h1>
          <p className="text-slate-500">Заполните данные для персонализации рекомендаций</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" /> Сохранить
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Основные данные</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя</label>
                <Input value={form.firstName || ''} onChange={set('firstName')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Фамилия</label>
                <Input value={form.lastName || ''} onChange={set('lastName')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Дата рождения</label>
                <Input type="date" value={form.dateOfBirth || ''} onChange={set('dateOfBirth')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Пол</label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.gender || ''} onChange={set('gender')}>
                  <option value="">Не указан</option>
                  <option value="Мужской">Мужской</option>
                  <option value="Женский">Женский</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Рост (см)</label>
                <Input type="number" value={form.height || ''} onChange={set('height')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Вес (кг)</label>
                <Input type="number" step="0.1" value={form.weight || ''} onChange={set('weight')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ИМТ</label>
                <div className="h-10 flex items-center">
                  {bmi ? <span className={`text-sm font-bold ${bmiCategory?.color}`}>{bmi} — {bmiCategory?.label}</span> : <span className="text-sm text-slate-400">—</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Группа крови</label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.bloodType || ''} onChange={set('bloodType')}>
                  {['', 'O(I)+', 'O(I)-', 'A(II)+', 'A(II)-', 'B(III)+', 'B(III)-', 'AB(IV)+', 'AB(IV)-'].map(b => <option key={b} value={b}>{b || 'Не указана'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон</label>
                <Input placeholder="+7 900 000 0000" value={form.phone || ''} onChange={set('phone')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card>
          <CardHeader><CardTitle>Образ жизни</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Уровень активности</label>
              <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.activityLevel || ''} onChange={set('activityLevel')}>
                {['', 'Сидячий', 'Низкая', 'Умеренная', 'Высокая', 'Очень высокая'].map(v => <option key={v} value={v}>{v || 'Не указан'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Тип питания</label>
              <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.dietType || ''} onChange={set('dietType')}>
                {['', 'Смешанная', 'Вегетарианская', 'Веганская', 'Кето', 'Палео', 'Средиземноморская'].map(v => <option key={v} value={v}>{v || 'Не указан'}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Сон (ч/сут)</label>
                <Input type="number" step="0.5" min="3" max="12" value={form.sleepHours || ''} onChange={set('sleepHours')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Стресс (1-10)</label>
                <Input type="number" min="1" max="10" value={form.stressLevel || ''} onChange={set('stressLevel')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Курение</label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.smokingStatus || ''} onChange={set('smokingStatus')}>
                  {['', 'Нет', 'Бросил(а)', 'Иногда', 'Регулярно'].map(v => <option key={v} value={v}>{v || 'Не указано'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Алкоголь</label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.alcoholUsage || ''} onChange={set('alcoholUsage')}>
                  {['', 'Нет', 'Редко', 'Умеренно', 'Регулярно'].map(v => <option key={v} value={v}>{v || 'Не указано'}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags: allergies, diseases, goals */}
        {[
          { field: 'allergies', label: 'Аллергии', input: allergyInput, setInput: setAllergyInput, placeholder: 'Добавить аллергию...' },
          { field: 'chronicDiseases', label: 'Хронические заболевания', input: diseaseInput, setInput: setDiseaseInput, placeholder: 'Добавить заболевание...' },
          { field: 'goals', label: 'Цели здоровья', input: goalInput, setInput: setGoalInput, placeholder: 'Добавить цель...' },
        ].map(({ field, label, input, setInput, placeholder }) => (
          <Card key={field}>
            <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(field, input, setInput) } }} />
                <Button type="button" variant="outline" size="icon" onClick={() => addTag(field, input, setInput)}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form[field] || []).map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button onClick={() => removeTag(field, i)} className="ml-1 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
