import { useState, useRef, useEffect } from 'react'
import { aiAPI } from '@/lib/api'
import { Brain, Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_QUERIES = [
  'Как интерпретировать повышенный CRP у пациента?',
  'Схема приёма магния при гипертонии',
  'Взаимодействие омега-3 с антикоагулянтами',
  'Признаки дефицита витамина D в анализах',
  'Нутрициологический протокол при инсулинорезистентности',
]

export default function DoctorAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await aiAPI.chat({ message: msg, sessionId })
      setSessionId(res.data.sessionId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch (err: any) {
      toast({ title: 'Ошибка ИИ', description: err.response?.data?.error, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-4xl flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ИИ-ассистент врача</h1>
        <p className="text-slate-500">Профессиональный медицинский ИИ для поддержки клинических решений</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Медицинский ИИ-ассистент</p>
            <p className="text-xs text-slate-500">Клиническая поддержка, интерпретация данных, нутрициология</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Медицинский ИИ-ассистент</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md">Используйте для клинической поддержки: интерпретации данных, протоколов лечения, нутрициологии, взаимодействия препаратов</p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
                {QUICK_QUERIES.map(q => (
                  <button key={q} onClick={() => sendMessage(q)} className="text-left text-sm p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-slate-600" />}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-900 rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-slate-600" />
              </div>
              <div className="px-4 py-3 bg-slate-100 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-4 border-t">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-3">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Задайте клинический вопрос..." disabled={loading} className="flex-1" />
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" size="icon" disabled={!input.trim() || loading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-2 text-center">ИИ не заменяет клиническое суждение врача</p>
        </div>
      </Card>
    </div>
  )
}
