import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLogo } from '@/components/AppLogo'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', specialization: '', licenseNumber: '' })
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.register({ ...form, role })
      const { token } = res.data
      const meRes = await authAPI.getMe()
      setAuth(token, meRes.data)
      navigate(role === 'DOCTOR' ? '/doctor' : '/patient')
      toast({ title: 'Аккаунт создан!', description: 'Добро пожаловать в HealthTwin' })
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.response?.data?.error || 'Ошибка регистрации', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <AppLogo size={48} className="rounded-2xl shadow-lg" />
            <span className="text-2xl font-bold text-slate-900">HealthTwin</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Создать аккаунт</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['PATIENT', 'DOCTOR'] as const).map((r) => (
              <button key={r} onClick={() => setRole(r)} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${role === r ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {r === 'PATIENT' ? '👤 Пациент' : '👨‍⚕️ Врач'}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя</label>
                <Input placeholder="Иван" value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Фамилия</label>
                <Input placeholder="Иванов" value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
              <Input type="password" placeholder="Минимум 8 символов" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            {role === 'DOCTOR' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Специализация</label>
                  <Input placeholder="Терапевт-нутрициолог" value={form.specialization} onChange={set('specialization')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Номер лицензии</label>
                  <Input placeholder="МЛ-2024-001" value={form.licenseNumber} onChange={set('licenseNumber')} required />
                </div>
              </>
            )}
            <Button type="submit" variant="gradient" className="w-full mt-2" size="lg" loading={loading}>
              Создать аккаунт
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
