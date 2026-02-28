import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { patientAPI, aiAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, Brain, FlaskConical, Pill, Star, TrendingUp, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react'
import { calculateBMI, getBMICategory, getStatusColor, getStatusLabel, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useState } from 'react'

export default function PatientDashboard() {
  const { user } = useAuthStore()
  const [generating, setGenerating] = useState(false)

  const { data: profile } = useQuery({ queryKey: ['patient-profile'], queryFn: () => patientAPI.getProfile().then(r => r.data) })
  const { data: recommendations = [] } = useQuery({ queryKey: ['recommendations'], queryFn: () => patientAPI.getRecommendations().then(r => r.data) })

  const bmi = profile?.height && profile?.weight ? calculateBMI(profile.weight, profile.height) : null
  const bmiCategory = bmi ? getBMICategory(Number(bmi)) : null

  const latestLab = profile?.labResults?.[0]
  const abnormalParams = latestLab?.parameters?.filter((p: any) => p.status !== 'NORMAL') || []

  const generateRecs = async () => {
    setGenerating(true)
    try {
      await aiAPI.generateRecommendations()
      toast({ title: 'Рекомендации обновлены!', description: 'ИИ сгенерировал новые рекомендации на основе ваших данных' })
      window.location.reload()
    } catch {
      toast({ title: 'Ошибка', description: 'Проверьте настройки ИИ-сервера', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const stats = [
    { label: 'Активных добавок', value: profile?.supplements?.length || 0, icon: Pill, color: 'text-blue-600 bg-blue-50', link: '/patient/supplements' },
    { label: 'Рекомендаций', value: recommendations.length, icon: Star, color: 'text-purple-600 bg-purple-50', link: '/patient/recommendations' },
    { label: 'Анализов', value: profile?.labResults?.length || 0, icon: FlaskConical, color: 'text-teal-600 bg-teal-50', link: '/patient/lab' },
    { label: 'Метрик', value: profile?.healthMetrics?.length || 0, icon: Activity, color: 'text-green-600 bg-green-50', link: '/patient/metrics' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Добрый день, {profile?.firstName || user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Вот сводка вашего цифрового двойника здоровья</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={generateRecs} loading={generating}>
          <Sparkles className="w-4 h-4" />
          Обновить рекомендации ИИ
        </Button>
      </div>

      {/* Alert if abnormal params */}
      {abnormalParams.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800">Требуют внимания</p>
            <p className="text-sm text-orange-600 mt-1">
              В последних анализах ({latestLab?.testName}) выявлено {abnormalParams.length} отклонений.{' '}
              <Link to="/patient/lab" className="underline">Посмотреть детали</Link>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link}>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Профиль здоровья
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bmi && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">ИМТ</span>
                <span className={`text-sm font-semibold ${bmiCategory?.color}`}>{bmi} — {bmiCategory?.label}</span>
              </div>
            )}
            {profile?.bloodType && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Группа крови</span>
                <Badge variant="info">{profile.bloodType}</Badge>
              </div>
            )}
            {profile?.activityLevel && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Активность</span>
                <span className="text-sm font-medium">{profile.activityLevel}</span>
              </div>
            )}
            {profile?.sleepHours && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Сон</span>
                <span className="text-sm font-medium">{profile.sleepHours} ч/сут</span>
              </div>
            )}
            {profile?.goals?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Цели:</p>
                <div className="flex flex-wrap gap-1">
                  {profile.goals.map((g: string) => <Badge key={g} variant="outline" className="text-xs">{g}</Badge>)}
                </div>
              </div>
            )}
            <Link to="/patient/profile">
              <Button variant="outline" size="sm" className="w-full mt-2 gap-1">
                Редактировать <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Latest Lab */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-teal-600" />
              Последние анализы
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestLab ? (
              <div>
                <p className="font-medium text-slate-900 mb-1">{latestLab.testName}</p>
                <p className="text-xs text-slate-500 mb-3">{formatDate(latestLab.testDate)}</p>
                <div className="space-y-2">
                  {latestLab.parameters?.slice(0, 4).map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 truncate flex-1">{p.name}</span>
                      <span className={`text-xs font-medium ml-2 px-2 py-0.5 rounded-full border ${getStatusColor(p.status)}`}>
                        {p.value} {p.unit}
                      </span>
                    </div>
                  ))}
                </div>
                <Link to="/patient/lab">
                  <Button variant="outline" size="sm" className="w-full mt-3 gap-1">
                    Все анализы <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Нет анализов</p>
                <Link to="/patient/lab">
                  <Button variant="outline" size="sm" className="mt-3">Загрузить анализы</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Рекомендации ИИ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec: any) => (
                  <div key={rec.id} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'success'} className="text-xs flex-shrink-0 mt-0.5">
                        {rec.priority === 'high' ? 'Важно' : rec.priority === 'medium' ? 'Средне' : 'Инфо'}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{rec.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/patient/recommendations">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    Все рекомендации <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Нет рекомендаций</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={generateRecs} disabled={generating}>
                  Сгенерировать
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick AI chat */}
      <Card className="bg-gradient-to-r from-blue-500 to-teal-500 text-white border-0">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg">ИИ-коуч здоровья</p>
              <p className="text-blue-100 text-sm">Задайте вопрос о вашем здоровье, питании или анализах</p>
            </div>
          </div>
          <Link to="/patient/ai-coach">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 gap-2 font-semibold">
              Начать чат <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
