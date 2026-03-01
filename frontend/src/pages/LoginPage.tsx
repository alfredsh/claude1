import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      const { token, role } = res.data

      localStorage.setItem('token', token)
      const meRes = await authAPI.getMe()
      setAuth(token, { ...meRes.data })

      navigate(role === 'DOCTOR' ? '/doctor' : '/patient')
      toast({ title: 'Добро пожаловать!', variant: 'default' })
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.response?.data?.error || 'Неверные данные', variant: 'destructive' })
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
          <h1 className="text-2xl font-bold text-slate-900">Войти в аккаунт</h1>
          <p className="text-slate-500 mt-2">Введите ваши данные для входа</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="gradient" className="w-full" size="lg" loading={loading}>
              Войти
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Зарегистрироваться</Link>
          </p>
          <p className="text-center mt-3">
            <Link to="/guide" className="text-xs text-slate-400 hover:text-slate-600 hover:underline inline-flex items-center gap-1">
              📖 Руководство пользователя
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
