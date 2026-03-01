import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { specialistsAPI } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import {
  Search, MapPin, Briefcase, Languages, DollarSign, X,
  GraduationCap, Award, BadgeCheck, CheckCircle, UserPlus, UserMinus,
  Star, Clock, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
  bio?: string
  experience?: number
  avatarUrl?: string
  city?: string
  clinic?: string
  languages?: string[]
  consultationPrice?: number
  isAcceptingPatients: boolean
  education?: { degree: string; institution: string; year: string; specialty: string }[]
  achievements?: { title: string; year: string; issuer: string }[]
  certifications?: { name: string; issuer: string; year: string }[]
}

export default function Specialists() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [myDoctorIds, setMyDoctorIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Doctor | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      specialistsAPI.getAll(),
      specialistsAPI.getMyDoctors(),
    ]).then(([allRes, myRes]) => {
      setDoctors(allRes.data)
      setMyDoctorIds(new Set(myRes.data.map((d: any) => d.id)))
    }).catch(() => {
      toast({ title: 'Ошибка загрузки специалистов', variant: 'destructive' })
    }).finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.city?.toLowerCase().includes(q) ||
      d.clinic?.toLowerCase().includes(q)
    )
  })

  const handleSelect = async (doctor: Doctor) => {
    setActionLoading(doctor.id)
    try {
      if (myDoctorIds.has(doctor.id)) {
        await specialistsAPI.unselectDoctor(doctor.id)
        setMyDoctorIds((prev) => { const s = new Set(prev); s.delete(doctor.id); return s })
        toast({ title: `${doctor.firstName} ${doctor.lastName} удалён из ваших врачей` })
      } else {
        await specialistsAPI.selectDoctor(doctor.id)
        setMyDoctorIds((prev) => new Set([...prev, doctor.id]))
        toast({ title: `${doctor.firstName} ${doctor.lastName} добавлен в ваших врачей` })
      }
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Специалисты</h1>
        <p className="text-slate-500 text-sm mt-1">Выберите врача для консультации и наблюдения</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, специальности, городу..."
          className="pl-10"
        />
      </div>

      {/* My doctors bar */}
      {myDoctorIds.size > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-sm text-green-700 font-medium">
            Вы наблюдаетесь у {myDoctorIds.size} {myDoctorIds.size === 1 ? 'специалиста' : 'специалистов'}
          </span>
        </div>
      )}

      {/* Doctors grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Специалисты не найдены</p>
          <p className="text-sm mt-1">Попробуйте изменить поисковый запрос</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doctor, i) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                myDoctorIds.has(doctor.id) ? 'border-green-200 ring-1 ring-green-200' : 'border-slate-100'
              }`}
              onClick={() => setSelected(doctor)}
            >
              <div className="p-5">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm">
                    {doctor.avatarUrl
                      ? <img src={doctor.avatarUrl} className="w-full h-full object-cover rounded-2xl" alt="" />
                      : `${doctor.firstName[0]}${doctor.lastName[0]}`}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                          {doctor.lastName} {doctor.firstName}
                        </h3>
                        <p className="text-blue-600 text-xs font-medium mt-0.5">{doctor.specialization}</p>
                      </div>
                      {myDoctorIds.has(doctor.id) && (
                        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3" /> Мой врач
                        </span>
                      )}
                    </div>

                    {/* Info chips */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doctor.experience && (
                        <Chip icon={Clock} text={`${doctor.experience} лет`} />
                      )}
                      {doctor.city && (
                        <Chip icon={MapPin} text={doctor.city} />
                      )}
                      {doctor.consultationPrice && (
                        <Chip icon={DollarSign} text={`${doctor.consultationPrice.toLocaleString()} ₽`} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {doctor.bio && (
                  <p className="text-slate-500 text-xs mt-3 line-clamp-2 leading-relaxed">{doctor.bio}</p>
                )}

                {/* Clinic */}
                {doctor.clinic && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{doctor.clinic}</span>
                  </div>
                )}

                {/* Action */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => { e.stopPropagation(); setSelected(doctor) }}
                  >
                    Подробнее
                  </Button>
                  <Button
                    variant={myDoctorIds.has(doctor.id) ? 'outline' : 'gradient'}
                    size="sm"
                    className="flex-1 text-xs gap-1"
                    disabled={actionLoading === doctor.id}
                    onClick={(e) => { e.stopPropagation(); handleSelect(doctor) }}
                  >
                    {actionLoading === doctor.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : myDoctorIds.has(doctor.id) ? (
                      <><UserMinus className="w-3.5 h-3.5" /> Отписаться</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" /> Наблюдаться</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Doctor detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="p-6 border-b border-slate-100 flex items-start gap-4 sticky top-0 bg-white rounded-t-3xl">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md">
                  {selected.avatarUrl
                    ? <img src={selected.avatarUrl} className="w-full h-full object-cover rounded-2xl" alt="" />
                    : `${selected.firstName[0]}${selected.lastName[0]}`}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    {selected.lastName} {selected.firstName}
                  </h2>
                  <p className="text-blue-600 font-medium text-sm">{selected.specialization}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {selected.experience && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" /> Стаж {selected.experience} лет
                      </span>
                    )}
                    {selected.city && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" /> {selected.city}
                      </span>
                    )}
                    {selected.isAcceptingPatients ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="w-3 h-3" /> Принимает пациентов
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Запись закрыта</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Clinic + price */}
                {(selected.clinic || selected.consultationPrice) && (
                  <div className="flex flex-wrap gap-3">
                    {selected.clinic && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-sm text-slate-600">
                        <Building2 className="w-4 h-4 text-slate-400" /> {selected.clinic}
                      </div>
                    )}
                    {selected.consultationPrice && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl text-sm text-blue-700 font-medium">
                        <DollarSign className="w-4 h-4" /> {selected.consultationPrice.toLocaleString()} ₽ / консультация
                      </div>
                    )}
                  </div>
                )}

                {/* Bio */}
                {selected.bio && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">О враче</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">{selected.bio}</p>
                  </div>
                )}

                {/* Languages */}
                {selected.languages?.length ? (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" /> Языки приёма
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.languages.map((l) => (
                        <span key={l} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">{l}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Education */}
                {selected.education?.length ? (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> Образование
                    </h3>
                    <div className="space-y-3">
                      {selected.education.map((e, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{e.degree}{e.specialty ? ` · ${e.specialty}` : ''}</p>
                            <p className="text-xs text-slate-500">{e.institution}{e.year ? ` — ${e.year}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Achievements */}
                {selected.achievements?.length ? (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Достижения
                    </h3>
                    <div className="space-y-2">
                      {selected.achievements.map((a, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{a.title}</p>
                            <p className="text-xs text-slate-500">{[a.issuer, a.year].filter(Boolean).join(' · ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Certifications */}
                {selected.certifications?.length ? (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Сертификаты
                    </h3>
                    <div className="space-y-2">
                      {selected.certifications.map((c, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <BadgeCheck className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-500">{[c.issuer, c.year].filter(Boolean).join(' · ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* CTA */}
                <div className="pt-2">
                  <Button
                    variant={myDoctorIds.has(selected.id) ? 'outline' : 'gradient'}
                    size="lg"
                    className="w-full gap-2"
                    disabled={actionLoading === selected.id || !selected.isAcceptingPatients}
                    onClick={() => handleSelect(selected)}
                  >
                    {actionLoading === selected.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : myDoctorIds.has(selected.id) ? (
                      <><UserMinus className="w-4 h-4" /> Отказаться от наблюдения</>
                    ) : !selected.isAcceptingPatients ? (
                      'Запись закрыта'
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Выбрать для наблюдения</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-xs">
      <Icon className="w-3 h-3" /> {text}
    </span>
  )
}
