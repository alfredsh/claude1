import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { doctorAPI } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  User, Building2, MapPin, Phone, BookOpen, Award, Languages,
  Plus, Trash2, Save, BadgeCheck, DollarSign, ToggleLeft, ToggleRight,
} from 'lucide-react'

interface EducationItem { degree: string; institution: string; year: string; specialty: string }
interface AchievementItem { title: string; year: string; issuer: string }
interface CertItem { name: string; issuer: string; year: string }

export default function DoctorProfilePage() {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    experience: '',
    city: '',
    clinic: '',
    consultationPrice: '',
    isAcceptingPatients: true,
    languages: [] as string[],
    education: [] as EducationItem[],
    achievements: [] as AchievementItem[],
    certifications: [] as CertItem[],
  })

  const [newLang, setNewLang] = useState('')

  useEffect(() => {
    doctorAPI.getProfile().then((res) => {
      const p = res.data
      setForm({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        phone: p.phone || '',
        bio: p.bio || '',
        experience: p.experience?.toString() || '',
        city: p.city || '',
        clinic: p.clinic || '',
        consultationPrice: p.consultationPrice?.toString() || '',
        isAcceptingPatients: p.isAcceptingPatients ?? true,
        languages: p.languages || [],
        education: p.education || [],
        achievements: p.achievements || [],
        certifications: p.certifications || [],
      })
    }).catch(() => {
      toast({ title: 'Ошибка загрузки профиля', variant: 'destructive' })
    }).finally(() => setLoading(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await doctorAPI.updateProfile({
        ...form,
        experience: form.experience ? Number(form.experience) : null,
        consultationPrice: form.consultationPrice ? Number(form.consultationPrice) : null,
      })
      setUser({ ...user!, doctorProfile: res.data })
      toast({ title: 'Профиль сохранён' })
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Education helpers
  const addEducation = () =>
    setForm((f) => ({ ...f, education: [...f.education, { degree: '', institution: '', year: '', specialty: '' }] }))
  const removeEducation = (i: number) =>
    setForm((f) => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }))
  const setEdu = (i: number, k: keyof EducationItem, v: string) =>
    setForm((f) => ({ ...f, education: f.education.map((e, idx) => idx === i ? { ...e, [k]: v } : e) }))

  // Achievements helpers
  const addAchievement = () =>
    setForm((f) => ({ ...f, achievements: [...f.achievements, { title: '', year: '', issuer: '' }] }))
  const removeAchievement = (i: number) =>
    setForm((f) => ({ ...f, achievements: f.achievements.filter((_, idx) => idx !== i) }))
  const setAch = (i: number, k: keyof AchievementItem, v: string) =>
    setForm((f) => ({ ...f, achievements: f.achievements.map((a, idx) => idx === i ? { ...a, [k]: v } : a) }))

  // Certifications helpers
  const addCert = () =>
    setForm((f) => ({ ...f, certifications: [...f.certifications, { name: '', issuer: '', year: '' }] }))
  const removeCert = (i: number) =>
    setForm((f) => ({ ...f, certifications: f.certifications.filter((_, idx) => idx !== i) }))
  const setCert = (i: number, k: keyof CertItem, v: string) =>
    setForm((f) => ({ ...f, certifications: f.certifications.map((c, idx) => idx === i ? { ...c, [k]: v } : c) }))

  // Languages
  const addLang = () => {
    const l = newLang.trim()
    if (l && !form.languages.includes(l)) {
      setForm((f) => ({ ...f, languages: [...f.languages, l] }))
      setNewLang('')
    }
  }
  const removeLang = (l: string) =>
    setForm((f) => ({ ...f, languages: f.languages.filter((x) => x !== l) }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">Мой профиль врача</h1>
        <p className="text-slate-500 text-sm mt-1">
          Заполните профиль — пациенты увидят эту информацию при выборе специалиста
        </p>
      </motion.div>

      {/* Основная информация */}
      <Section icon={User} title="Основная информация">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Имя">
            <Input value={form.firstName} onChange={set('firstName')} placeholder="Имя" />
          </Field>
          <Field label="Фамилия">
            <Input value={form.lastName} onChange={set('lastName')} placeholder="Фамилия" />
          </Field>
          <Field label="Телефон">
            <Input value={form.phone} onChange={set('phone')} placeholder="+7 (900) 000-00-00" />
          </Field>
          <Field label="Стаж (лет)">
            <Input type="number" min={0} value={form.experience} onChange={set('experience')} placeholder="10" />
          </Field>
        </div>
        <Field label="О себе">
          <textarea
            value={form.bio}
            onChange={set('bio')}
            rows={4}
            placeholder="Расскажите пациентам о своём подходе, специализации и опыте..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </Field>
      </Section>

      {/* Место работы */}
      <Section icon={Building2} title="Место работы">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Клиника / больница">
            <Input value={form.clinic} onChange={set('clinic')} placeholder="Клиника «Здоровье»" />
          </Field>
          <Field label="Город">
            <Input value={form.city} onChange={set('city')} placeholder="Москва" />
          </Field>
        </div>
      </Section>

      {/* Консультации */}
      <Section icon={DollarSign} title="Консультации">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Field label="Стоимость консультации (₽)" className="flex-1">
            <Input type="number" min={0} value={form.consultationPrice} onChange={set('consultationPrice')} placeholder="2000" />
          </Field>
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-xs font-medium text-slate-700">Принимаю новых пациентов</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isAcceptingPatients: !f.isAcceptingPatients }))}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {form.isAcceptingPatients ? (
                <><ToggleRight className="w-8 h-8 text-green-500" /><span className="text-green-600">Да</span></>
              ) : (
                <><ToggleLeft className="w-8 h-8 text-slate-400" /><span className="text-slate-500">Нет</span></>
              )}
            </button>
          </div>
        </div>
      </Section>

      {/* Языки */}
      <Section icon={Languages} title="Языки приёма">
        <div className="flex flex-wrap gap-2 mb-3">
          {form.languages.map((l) => (
            <span key={l} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
              {l}
              <button onClick={() => removeLang(l)} className="hover:text-blue-900"><Trash2 className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={newLang} onChange={(e) => setNewLang(e.target.value)} placeholder="Русский, English..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLang())} />
          <Button variant="outline" size="sm" onClick={addLang}><Plus className="w-4 h-4" /></Button>
        </div>
      </Section>

      {/* Образование */}
      <Section icon={BookOpen} title="Образование">
        <div className="space-y-4">
          {form.education.map((e, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 relative">
              <button onClick={() => removeEducation(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Степень / квалификация">
                  <Input value={e.degree} onChange={(ev) => setEdu(i, 'degree', ev.target.value)} placeholder="Кандидат мед. наук" />
                </Field>
                <Field label="Специальность">
                  <Input value={e.specialty} onChange={(ev) => setEdu(i, 'specialty', ev.target.value)} placeholder="Терапия" />
                </Field>
                <Field label="Учреждение">
                  <Input value={e.institution} onChange={(ev) => setEdu(i, 'institution', ev.target.value)} placeholder="Первый МГМУ им. Сеченова" />
                </Field>
                <Field label="Год окончания">
                  <Input value={e.year} onChange={(ev) => setEdu(i, 'year', ev.target.value)} placeholder="2010" />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addEducation} className="mt-3 gap-2">
          <Plus className="w-4 h-4" /> Добавить образование
        </Button>
      </Section>

      {/* Достижения */}
      <Section icon={Award} title="Награды и достижения">
        <div className="space-y-3">
          {form.achievements.map((a, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 relative">
              <button onClick={() => removeAchievement(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Название" className="sm:col-span-2">
                  <Input value={a.title} onChange={(ev) => setAch(i, 'title', ev.target.value)} placeholder="Лучший врач года" />
                </Field>
                <Field label="Год">
                  <Input value={a.year} onChange={(ev) => setAch(i, 'year', ev.target.value)} placeholder="2022" />
                </Field>
                <Field label="Организация" className="sm:col-span-3">
                  <Input value={a.issuer} onChange={(ev) => setAch(i, 'issuer', ev.target.value)} placeholder="Министерство здравоохранения" />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addAchievement} className="mt-3 gap-2">
          <Plus className="w-4 h-4" /> Добавить достижение
        </Button>
      </Section>

      {/* Сертификаты */}
      <Section icon={BadgeCheck} title="Сертификаты и курсы повышения квалификации">
        <div className="space-y-3">
          {form.certifications.map((c, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 relative">
              <button onClick={() => removeCert(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Название" className="sm:col-span-2">
                  <Input value={c.name} onChange={(ev) => setCert(i, 'name', ev.target.value)} placeholder="Сертификат по нутрициологии" />
                </Field>
                <Field label="Год">
                  <Input value={c.year} onChange={(ev) => setCert(i, 'year', ev.target.value)} placeholder="2023" />
                </Field>
                <Field label="Выдан" className="sm:col-span-3">
                  <Input value={c.issuer} onChange={(ev) => setCert(i, 'issuer', ev.target.value)} placeholder="Российская медицинская академия" />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addCert} className="mt-3 gap-2">
          <Plus className="w-4 h-4" /> Добавить сертификат
        </Button>
      </Section>

      {/* Кнопка сохранения */}
      <div className="flex justify-end pb-8">
        <Button variant="gradient" size="lg" onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Сохранение...' : 'Сохранить профиль'}
        </Button>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}
