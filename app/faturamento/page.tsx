'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, Search, ChevronDown, Calendar, CheckCircle2, 
  XCircle, Info, LayoutGrid, ClipboardList, CircleDollarSign, 
  Settings, Hash, Receipt, AlertCircle
} from 'lucide-react'

// ... Tipos permanecem os mesmos ...

export default function FaturamentoPage() {
  const router = useRouter()
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [ordens, setOrdens] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  
  // Estados para o Modal de Faturamento
  const [modalAberto, setModalAberto] = useState(false)
  const [osSelecionada, setOsSelecionada] = useState<any>(null)
  const [numPedido, setNumPedido] = useState('')
  const [numSistema, setNumSistema] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarPagina()
  }, [])

  async function carregarPagina() {
    setCarregando(true)
    const usuarioSalvo = localStorage.getItem('usuario')
    if (!usuarioSalvo) { router.push('/'); return }

    const { data: dadosUsuario } = await supabase
      .from('usuarios').select('*').eq('usuario', usuarioSalvo).single()
    
    if (!dadosUsuario) { router.push('/'); return }
    setUsuarioLogado(dadosUsuario)

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('status', 'Finalizado')
      .order('created_at', { ascending: false })

    if (!error) setOrdens(data || [])
    setCarregando(false)
  }

  const podeEditar = usuarioLogado?.perfil === 'Faturamento' || usuarioLogado?.perfil === 'Admin'
  const clean = tema === 'clean'

  const ordensFiltradas = ordens.filter((o) => 
    `${o.cliente} ${o.maquina} ${o.numero_os}`.toLowerCase().includes(busca.toLowerCase())
  )

  const pendentesFaturar = ordens.filter(o => !o.faturado).length

  // Função para abrir modal de faturamento
  const prepararFaturamento = (ordem: any) => {
    if (!podeEditar) return
    setOsSelecionada(ordem)
    setNumPedido(ordem.numero_pedido_faturamento || '')
    setNumSistema(ordem.numero_os_faturamento || '')
    setModalAberto(true)
  }

  // SALVAR NO SUPABASE
  async function confirmarFaturamento() {
    if (!osSelecionada) return
    setSalvando(true)

    const { error } = await supabase
      .from('ordens_servico')
      .update({ 
        faturado: true,
        numero_pedido_faturamento: numPedido,
        numero_os_faturamento: numSistema,
        data_faturamento: new Date().toISOString()
      })
      .eq('id', osSelecionada.id)

    if (!error) {
      setOrdens(lista => lista.map(o => o.id === osSelecionada.id ? 
        { ...o, faturado: true, numero_pedido_faturamento: numPedido, numero_os_faturamento: numSistema } : o))
      setModalAberto(false)
      setOsSelecionada(null)
    }
    setSalvando(false)
  }

  async function estornarFaturamento(id: number) {
    if (!podeEditar || !confirm("Deseja marcar esta OS como não faturada?")) return
    
    const { error } = await supabase
      .from('ordens_servico')
      .update({ faturado: false, numero_pedido_faturamento: null, numero_os_faturamento: null })
      .eq('id', id)

    if (!error) {
      setOrdens(lista => lista.map(o => o.id === id ? { ...o, faturado: false } : o))
    }
  }

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${
      clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
    }`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER PROFISSIONAL */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className={`p-2.5 rounded-xl border ${clean ? 'bg-white' : 'bg-[#0d1a2d] border-slate-800'}`}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Faturamento</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold opacity-50 uppercase">{pendentesFaturar} pendentes</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg">
                {usuarioLogado?.nome?.charAt(0)}
             </div>
          </div>
        </header>

        {/* BARRA DE PESQUISA ESTILIZADA */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-800'}`}>
          <Search size={18} className="text-blue-500" />
          <input 
            placeholder="Buscar cliente ou OS..." 
            className="bg-transparent outline-none text-sm w-full font-medium"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* LISTAGEM */}
        <div className="space-y-4">
          {carregando ? (
            <div className="py-20 text-center opacity-50 italic">Carregando dados...</div>
          ) : ordensFiltradas.map((ordem) => (
            <div key={ordem.id} className={`rounded-3xl border p-5 transition-all ${
              ordem.faturado ? 'border-emerald-500/30' : clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0b1628] border-slate-800'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                  ordem.faturado ? 'bg-emerald-500 text-white' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {ordem.faturado ? 'Faturado' : `OS #${ordem.numero_os}`}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-bold opacity-40">
                  <Calendar size={12} />
                  {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <h3 className="font-black text-sm uppercase mb-1 truncate">{ordem.cliente}</h3>
              <p className="text-xs opacity-60 mb-4 truncate">{ordem.maquina}</p>

              {/* BOTÕES DE AÇÃO */}
              {!ordem.faturado ? (
                <button 
                  onClick={() => prepararFaturamento(ordem)}
                  disabled={!podeEditar}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  Concluir Faturamento
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className={`p-3 rounded-xl border flex justify-between items-center ${clean ? 'bg-slate-50' : 'bg-white/5 border-white/10'}`}>
                    <div>
                      <p className="text-[9px] uppercase font-bold opacity-50">Docs Vinculados</p>
                      <p className="text-[11px] font-bold text-emerald-500">Ped: {ordem.numero_pedido_faturamento} | OS: {ordem.numero_os_faturamento}</p>
                    </div>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <button 
                    onClick={() => estornarFaturamento(ordem.id)}
                    className="text-[10px] font-bold text-rose-500 uppercase text-center hover:underline"
                  >
                    Estornar Faturamento
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DE FATURAMENTO PROFISSIONAL */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-lg uppercase tracking-tight">Vincular Dados</h2>
              <button onClick={() => setModalAberto(false)} className="opacity-50"><XCircle /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase opacity-50 ml-1">Nº Pedido (Venda)</label>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border mt-1 ${clean ? 'bg-slate-50' : 'bg-black/20 border-slate-800'}`}>
                  <Receipt size={18} className="text-blue-500" />
                  <input 
                    type="text" 
                    value={numPedido} 
                    onChange={e => setNumPedido(e.target.value)}
                    placeholder="000000" 
                    className="bg-transparent outline-none w-full font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase opacity-50 ml-1">Nº OS do Sistema Principal</label>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border mt-1 ${clean ? 'bg-slate-50' : 'bg-black/20 border-slate-800'}`}>
                  <Hash size={18} className="text-blue-500" />
                  <input 
                    type="text" 
                    value={numSistema} 
                    onChange={e => setNumSistema(e.target.value)}
                    placeholder="Ex: 5020" 
                    className="bg-transparent outline-none w-full font-bold"
                  />
                </div>
              </div>

              <button 
                onClick={confirmarFaturamento}
                disabled={salvando || !numPedido}
                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-tighter shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 mt-4"
              >
                {salvando ? 'Processando...' : 'Confirmar e Faturar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU INFERIOR FIXO ... (Mantém o mesmo do seu código) */}
    </div>
  )
}