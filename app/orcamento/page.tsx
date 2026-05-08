'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  LayoutGrid, ClipboardList, CircleDollarSign, Settings,
  Plus, Save, User, Phone, Monitor, FileText, Loader2,
  Wifi, WifiOff, LogOut, ArrowUpRight, X
} from 'lucide-react'

export default function OrcamentoPage() {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [isOnline, setIsOnline] = useState(true)
  const [form, setForm] = useState({ cliente: '', contato: '', maquina: '', descricao: '', valor: '' })

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)

    carregarOrcamentos()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function carregarOrcamentos() {
    setCarregando(true)
    const { data } = await supabase.from('orçamentos').select('*').order('created_at', { ascending: false })
    setOrcamentos(data || [])
    setCarregando(false)
  }

  async function salvarOrcamento() {
    if (!form.cliente) return alert('O nome do cliente é obrigatório!')
    const { error } = await supabase.from('orçamentos').insert([{
      cliente: form.cliente,
      contato: form.contato,
      maquina: form.maquina,
      descricao_servico: form.descricao,
      valor_estimado: parseFloat(form.valor) || 0
    }])
    if (!error) {
      setModalAberto(false)
      setForm({ cliente: '', contato: '', maquina: '', descricao: '', valor: '' })
      carregarOrcamentos()
    }
  }

  const clean = tema === 'clean'

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${
      clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
    }`}>
      <main className="max-w-md mx-auto px-5 pt-6">

        {/* HEADER IDÊNTICO AO DASHBOARD */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className={`text-3xl font-black tracking-tight italic ${clean ? 'text-slate-800' : 'text-white'}`}>ORÇAMENTOS</h1>
              {isOnline ? (
                <Wifi size={18} className="text-emerald-500" />
              ) : (
                <WifiOff size={18} className="text-rose-500 animate-pulse" />
              )}
            </div>
            <p className={`text-sm font-bold uppercase tracking-widest ${clean ? 'text-slate-400' : 'text-blue-400/60'}`}>
              Gerenciamento de Propostas
            </p>
          </div>

          <button
            onClick={() => setModalAberto(true)}
            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${
              clean ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-200' : 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>

        {/* CARDS DE RESUMO (ESTILO DASHBOARD) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <CardMini clean={clean} titulo="Total de Propostas" valor={orcamentos.length} Icone={FileText} cor="blue" />
          <CardMini clean={clean} titulo="Aguardando" valor={orcamentos.length} Icone={CircleDollarSign} cor="amber" />
        </div>

        {/* LISTAGEM (ESTILO SECTION DASHBOARD) */}
        <section className={`rounded-3xl border shadow-xl overflow-hidden ${
          clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'
        }`}>
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-black text-lg uppercase tracking-tight">Registros</h2>
            <span className="text-[10px] font-black opacity-40 uppercase">Sincronizado</span>
          </div>

          <div className="p-4 space-y-3">
            {carregando ? (
              <div className="py-10 text-center animate-pulse text-slate-500 italic text-sm">Carregando orçamentos...</div>
            ) : orcamentos.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm italic">Nenhum orçamento encontrado.</div>
            ) : (
              orcamentos.map((orc) => (
                <div
                  key={orc.id}
                  className={`p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    clean ? 'bg-slate-50 border-slate-100' : 'bg-[#111c2e] border-slate-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-blue-500 text-xs uppercase tracking-tighter">Budget #{orc.id.toString().slice(-4)}</span>
                    <span className="text-emerald-500 font-black text-sm">R$ {orc.valor_estimado}</span>
                  </div>
                  
                  <p className="text-sm font-bold truncate uppercase">{orc.cliente}</p>
                  
                  <div className="flex items-center gap-2 mt-1 mb-2 opacity-50">
                    <Monitor size={12} />
                    <p className="text-[10px] font-bold uppercase truncate">{orc.maquina || 'Não informada'}</p>
                  </div>

                  <div className={`p-3 rounded-xl text-[11px] italic leading-relaxed ${
                    clean ? 'bg-white text-slate-600 border border-slate-200/50' : 'bg-black/20 text-slate-400'
                  }`}>
                    "{orc.descricao_servico}"
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* MENU INFERIOR PADRÃO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 ${
        clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'
      }`}>
        <div className="max-w-md mx-auto grid grid-cols-5 px-2">
          <MenuItem titulo="Início" Icone={LayoutGrid} clean={clean} onClick={() => router.push('/dashboard')} />
          <MenuItem titulo="Ordens" Icone={ClipboardList} clean={clean} onClick={() => router.push('/ordens')} />
          <MenuItem ativo titulo="Orçam." Icone={FileText} clean={clean} onClick={() => router.push('/orcamento')} />
          <MenuItem titulo="Faturam." Icone={CircleDollarSign} clean={clean} onClick={() => router.push('/faturamento')} />
          <MenuItem titulo="Config." Icone={Settings} clean={clean} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL NOVO ORÇAMENTO (ESTILO MOBILE DRAWER) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center">
          <div className={`w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 border-t sm:border shadow-2xl animate-in slide-in-from-bottom duration-300 ${
            clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase italic tracking-tight">Novo Orçamento</h2>
              <button onClick={() => setModalAberto(false)} className={`p-2 rounded-full ${clean ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <InputIcon Icone={User} clean={clean} placeholder="Nome do Cliente" value={form.cliente} onChange={(v:any) => setForm({...form, cliente: v})} />
              <InputIcon Icone={Phone} clean={clean} placeholder="WhatsApp / Telefone" value={form.contato} onChange={(v:any) => setForm({...form, contato: v})} />
              <InputIcon Icone={Monitor} clean={clean} placeholder="Máquina / Equipamento" value={form.maquina} onChange={(v:any) => setForm({...form, maquina: v})} />
              
              <textarea 
                placeholder="Descrição resumida do serviço..." 
                className={`w-full border rounded-2xl p-4 text-xs h-28 focus:border-blue-500 outline-none transition-all ${
                  clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                }`}
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
              />
              
              <InputIcon Icone={CircleDollarSign} clean={clean} placeholder="Valor Estimado (Ex: 1500)" value={form.valor} onChange={(v:any) => setForm({...form, valor: v})} />
              
              <button 
                onClick={salvarOrcamento} 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <Save size={20} /> Salvar Orçamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// COMPONENTES AUXILIARES (EXATAMENTE IGUAIS AO DASHBOARD)
function CardMini({ titulo, valor, Icone, cor, clean }: any) {
  const cores: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  }
  return (
    <div className={`p-4 rounded-3xl border text-left ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 border ${cores[cor]}`}>
        <Icone size={16} strokeWidth={2.5} />
      </div>
      <p className="text-2xl font-black">{valor}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{titulo}</p>
    </div>
  )
}

function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 transition-colors ${
      ativo ? 'text-blue-500' : clean ? 'text-slate-400' : 'text-slate-500'
    }`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className={`mt-1 text-[10px] font-bold uppercase tracking-tighter ${ativo ? 'opacity-100' : 'opacity-60'}`}>
        {titulo}
      </span>
    </button>
  )
}

function InputIcon({ Icone, placeholder, value, onChange, clean }: any) {
  return (
    <div className="relative">
      <Icone size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${clean ? 'text-slate-400' : 'text-slate-500'}`} />
      <input 
        className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-xs focus:border-blue-500 outline-none transition-all ${
          clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
        }`} 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  )
}