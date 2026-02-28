import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { doctorAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowRight, AlertTriangle, Activity } from 'lucide-react'

export default function DoctorDashboard() {
  const { user } = useAuthStore()
  const { data: patients = [] } = useQuery({ queryKey: ['doctor-patients'], queryFn: () => doctorAPI.getPatients().then(r => r.data) })

  const profile = user?.doctorProfile
  const patientsWithAlerts = patients.filter((p: any) => {
    const latestLab = p.labResults?.[0]
    return latestLab?.parameters?.some((param: any) => param?.status === 'CRITICAL')
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Добрый день, {profile?.firstName}! 👨‍⚕️</h1>
        <p className="text-slate-500">{profile?.specialization}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{patients.length}</p>
                <p className="text-sm text-slate-500">Всего пациентов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{patientsWithAlerts.length}</p>
                <p className="text-sm text-slate-500">Требуют внимания</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{patients.length - patientsWithAlerts.length}</p>
                <p className="text-sm text-slate-500">В норме</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {patientsWithAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader><CardTitle className="text-red-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Критические показатели</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patientsWithAlerts.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-red-600">Критические показатели в последних анализах</p>
                  </div>
                  <Link to={`/doctor/patients/${p.id}`}>
                    <Button size="sm" variant="destructive" className="gap-1">
                      Просмотр <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Последние пациенты</CardTitle>
          <Link to="/doctor/patients">
            <Button variant="outline" size="sm" className="gap-1">Все пациенты <ArrowRight className="w-3 h-3" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patients.slice(0, 8).map((p: any) => (
              <Link key={p.id} to={`/doctor/patients/${p.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {p.firstName?.[0]}{p.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-500">{p.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.labResults?.[0]?.parameters?.some((param: any) => param?.status === 'CRITICAL') && (
                    <Badge variant="danger" className="text-xs">⚠️ Критично</Badge>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
