import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { aiAPI } from '@/lib/api'
import { Brain, Send, Plus, MessageSquare, Loader2, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface Message { role: 'user' | 'assistant'; content: string; timestamp?: string }

const QUICK_QUESTIONS = [
  'Как улучшить мои показатели холестерина?',
  'Какие добавки мне нужны на основе анализов?',
  'Как наладить сон и снизить стресс?',
  'Составь план питания на неделю для меня',
  'Что означают мои последние анализы?',
  'Как повысить уровень энергии?',
]

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => aiAPI.getSessions().then(r => r.data),
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toISOString() }])
    setLoading(true)

    try {
      const res = await aiAPI.chat({ message: msg, sessionId })
      setSessionId(res.data.sessionId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response, timestamp: new Date().toISOString() }])
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Ошибка связи с ИИ-сервером'
      toast({ title: 'Ошибка', description: errMsg, variant: 'destructive' })
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}`, timestamp: new Date().toISOString() }])
    } finally {
      setLoading(false)
    }
  }

  const loadSession = async (id: string) => {
    try {
      const res = await aiAPI.getSession(id)
      setSessionId(id)
      setMessages(res.data.messages || [])
    } catch {
      toast({ title: 'Ошибка загрузки сессии', variant: 'destructive' })
    }
  }

  const newChat = () => { setMessages([]); setSessionId(undefined) }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] max-w-6xl">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 hidden lg:flex">
        <Button variant="gradient" className="gap-2 w-full" onClick={newChat}>
          <Plus className="w-4 h-4" /> Новый чат
        </Button>
        <div className="flex-1 overflow-y-auto space-y-2">
          <p className="text-xs text-slate-500 font-medium px-2">История чатов</p>
          {sessions.map((s: any) => (
            <button key={s.id} onClick={() => loadSession(s.id)}
              className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${sessionId === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-700'}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{s.title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 ml-6">{formatDateTime(s.updatedAt)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-health flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">ИИ-коуч здоровья</p>
            <p className="text-xs text-slate-500">Анализирует ваши данные и даёт персонализированные рекомендации</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl gradient-health flex items-center justify-center mb-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">ИИ-коуч готов к работе</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm">
                Задайте вопрос о вашем здоровье, питании или анализах. ИИ учитывает ваши персональные данные.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="text-left text-sm p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl border border-slate-200 hover:border-blue-200 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'gradient-health' : 'bg-slate-100'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-slate-600" />}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-slate-100 text-slate-900 rounded-tl-sm'}`}>
                  {msg.content}
                </div>
                {msg.timestamp && (
                  <span className="text-xs text-slate-400 mt-1 px-1">{formatDateTime(msg.timestamp)}</span>
                )}
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите ИИ-коуча о вашем здоровье..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" variant="gradient" size="icon" disabled={!input.trim() || loading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-2 text-center">
            ИИ-коуч не заменяет консультацию врача. При серьёзных симптомах обратитесь к специалисту.
          </p>
        </div>
      </Card>
    </div>
  )
}
