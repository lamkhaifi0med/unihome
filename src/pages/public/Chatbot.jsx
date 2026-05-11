import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, RotateCcw } from 'lucide-react'
import { chatbotFaq } from '../../data/mockData'

const initialMessages = [
  {
    id: 1,
    role: 'bot',
    text: 'Bonjour ! Je suis l\'assistant UniHome 🏠 Je peux vous aider à trouver un logement, comprendre le score de confiance, ou répondre à vos questions sur la plateforme. Comment puis-je vous aider ?',
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  }
]

const quickReplies = [
  'Comment fonctionne le score de confiance ?',
  'Comment signaler une annonce ?',
  'Comment publier une annonce ?',
  'Le service est-il gratuit ?',
]

export default function Chatbot() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getBotResponse = (text) => {
    const lower = text.toLowerCase()
    const match = chatbotFaq.find(f =>
      lower.includes('score') && f.question.includes('score') ||
      lower.includes('signaler') && f.question.includes('signaler') ||
      lower.includes('publier') && f.question.includes('publier') ||
      lower.includes('gratuit') && f.question.includes('gratuit')
    )
    if (match) return match.answer
    if (lower.includes('bonjour') || lower.includes('salut')) return 'Bonjour ! Ravi de vous accueillir sur UniHome. Comment puis-je vous aider aujourd\'hui ?'
    if (lower.includes('merci')) return 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions 😊'
    if (lower.includes('logement') || lower.includes('appartement') || lower.includes('studio')) return 'Pour trouver un logement, utilisez la barre de recherche en haut de la page. Vous pouvez filtrer par ville, université, budget et type de logement. Nos annonces sont triées par score de confiance !'
    return 'Je n\'ai pas bien compris votre question. Vous pouvez me demander des infos sur le score de confiance, comment signaler une annonce, ou comment publier votre logement. Posez une question précise !'
  }

  const sendMessage = (text) => {
    const msg = text || input.trim()
    if (!msg) return
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg, time }])
    setInput('')
    setLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: getBotResponse(msg), time }])
      setLoading(false)
    }, 900)
  }

  const reset = () => setMessages(initialMessages)

  return (
    <div className="page-container py-8 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Assistant UniHome</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Propulsé par Gemini · Disponible 24h/24</p>
          </div>
        </div>
      </div>

      <div className="glass-light rounded-3xl overflow-hidden shadow-xl flex flex-col" style={{ height: '65vh' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'bot' ? 'bg-gradient-to-br from-primary-500 to-accent-600' : 'bg-gray-200 dark:bg-white/10'}`}>
                {msg.role === 'bot' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
              </div>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'bot'
                  ? 'bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-tl-sm'
                  : 'bg-gradient-to-br from-primary-600 to-accent-600 text-white rounded-tr-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400">{msg.time}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {messages.length === 1 && (
          <div className="px-6 pb-2 flex flex-wrap gap-2">
            {quickReplies.map(q => (
              <button key={q} onClick={() => sendMessage(q)} className="text-xs px-3 py-1.5 rounded-xl border border-primary-200 dark:border-primary-900/50 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-white/10 p-4 flex gap-3 items-center">
          <button onClick={reset} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex-shrink-0">
            <RotateCcw className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Posez votre question..."
            className="flex-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white hover:from-primary-500 hover:to-accent-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
