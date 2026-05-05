'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, Search, Calendar, CheckCircle2, 
  XCircle, LayoutGrid, ClipboardList, CircleDollarSign, 
  Settings, Hash, Receipt, Store, DollarSign, Clock
} from 'lucide-react'

export default function FaturamentoPage() {
  const router = useRouter()

  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [ordens, setOrdens] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  
  // Estados do Modal de Faturamento
  const [modalAberto, setModalAberto] = useState(false)
  const [osSelecionada, setOsSelecionada] = useState<any>(null)
  const [unidade, setUnidade] = useState('')
  const [numPedido, setNumPedido] = useState('')
  const [numSistema, setNumSistema] = useState('')
  const [valor, setValor] = useState('')
  const [statusFaturamento, setStatusFaturamento] = useState('Não faturado')
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

    const { data: dadosUsuario } = await supabase.from('usuarios').select('*').eq('usuario', usuarioSalvo).single()
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

  // Lógica de Permissão
  const ehFaturamento = usuarioLogado?.perfil === 'Faturamento' || usuarioLogado?.perfil === 'Admin'
  const clean = tema === 'clean'

  const prepararFaturamento = (e: React.MouseEvent, ordem: any) => {
    e.stopPropagation()
    setOsSelecionada(ordem)
    setUnidade(ordem.unidade_faturamento || 'TORNEARIA DIVISA')
    setNumPedido(ordem.numero_pedido_faturamento || '')
    setNumSistema(ordem.numero_os_faturamento || '')
    setValor(ordem.valor_faturamento || '')
    setStatusFaturamento(ordem.status_faturamento || 'Não faturado')
    setModalAberto(true)
  }

  async function salvarFaturamento(e: React.MouseEvent) {
    e.preventDefault()
    if (!osSelecionada) return
    setSalvando(true)

    try {
      const updates: any = {
        numero_pedido_faturamento: numPedido,
        numero_os_faturamento: numSistema,
        unidade_faturamento: unidade,
        valor_faturamento: valor ? parseFloat(valor) : 0,
      }

      // APENAS o perfil faturamento/admin pode alterar o status real e marcar como faturado
      if (ehFaturamento) {
        updates.status_faturamento = statusFaturamento
        updates.faturado = statusFaturamento === 'Faturado'
        updates.data_faturamento = new Date().toISOString()
      }

      const { error } = await supabase
        .from('ordens_servico')
        .update(updates)
        .eq('id', osSelecionada.id)

      if (error) throw error

      setOrdens(lista => lista.map(o => o.id === osSelecionada.id ? { ...o, ...updates } : o))
      setModalAberto(false)
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message)
    } finally {
      setSalvando(false)
    }
  }

  const ordensFiltradas = ordens.filter((o) => 
    `${o.cliente} ${o.maquina} ${o.numero_os}`.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className={`min-h-screen pb-32 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className={`p-2.5 rounded-xl border ${clean ? 'bg-white' : 'bg-[#0d1a2d] border-slate-800'}`}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tight">Faturamento Profissional</h1>
          </div>
        </header>

        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-800'}`}>
          <Search size={18} className="text-blue-500" />
          <input 
            placeholder="Buscar por cliente ou OS..." 
            className="bg-transparent outline-none text-sm w-full font-medium"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {ordensFiltradas.map((ordem) => (
            <div key={ordem.id} className={`rounded-[2rem] border p-6 ${clean ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0b1628] border-slate-800'}`}>
              <div className="flex justify-between mb-4">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase ${
                  ordem.status_faturamento === 'Faturado' ? 'bg-emerald-500 text-white' : 
                  ordem.status_faturamento === 'Parcialmente faturado' ? 'bg-amber-500 text-white' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {ordem.status_faturamento || 'Não faturado'}
                </span>
                <span className="text-[10px] font-bold opacity-40 uppercase">OS #{ordem.numero_os}</span>
              </div>

              <h3 className="font-black text-base uppercase mb-1">{ordem.cliente}</h3>
              <p className="text-xs font-bold opacity-50 mb-4">{ordem.maquina}</p>

              <button 
                onClick={(e) => prepararFaturamento(e, ordem)}
                className="w-full py-3 rounded-xl bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
              >
                {ehFaturamento ? 'Gerenciar Faturamento' : 'Informar Dados de Venda'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL PROFISSIONAL */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-lg uppercase tracking-tight">Faturamento</h2>
              <button onClick={() => setModalAberto(false)}><XCircle size={24} className="opacity-30" /></button>
            </div>

            <div className="space-y-4">
              {/* Unidade de Venda */}
              <div>
                <label className="text-[9px] font-black uppercase opacity-40 ml-1">Empresa Faturadora</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {['TORNEARIA DIVISA', 'DIVISA IMPLEMENTOS'].map(u => (
                    <button 
                      key={u}
                      onClick={() => setUnidade(u)}
                      className={`py-3 rounded-xl text-[9px] font-black border transition-all ${unidade === u ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 opacity-40'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status - Apenas para Faturamento */}
              {ehFaturamento && (
                <div>
                  <label className="text-[9px] font-black uppercase opacity-40 ml-1">Status do Processo</label>
                  <select 
                    value={statusFaturamento}
                    onChange={e => setStatusFaturamento(e.target.value)}
                    className={`w-full p-4 rounded-2xl border mt-1.5 font-bold text-xs appearance-none ${clean ? 'bg-slate-50' : 'bg-black/20 border-slate-800'}`}
                  >
                    <option value="Não faturado">Não faturado</option>
                    <option value="Parcialmente faturado">Parcialmente faturado</option>
                    <option value="Faturado">Faturado (Concluir)</option>
                  </select>
                </div>
              )}

              {/* Campos de Input */}
              <InputField label="Nº Pedido de Venda" icon={Receipt} value={numPedido} onChange={setNumPedido} placeholder="Ex: 10550" clean={clean} />
              <InputField label="Nº OS no Sistema" icon={Hash} value={numSistema} onChange={setNumSistema} placeholder="Ex: 5020" clean={clean} />
              <InputField label="Valor Total (R$)" icon={DollarSign} value={valor} onChange={setValor} placeholder="0,00" type="number" clean={clean} />

              <button 
                onClick={salvarFaturamento}
                disabled={salvando}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest mt-4 transition-all active:scale-95 ${
                  ehFaturamento ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-blue-600 text-white'
                }`}
              >
                {salvando ? 'Processando...' : ehFaturamento ? 'Confirmar e Gravar' : 'Atualizar Dados'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAV SIMPLIFICADO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-3 z-50 ${clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'}`}>
        <div className="max-w-md mx-auto grid grid-cols-4 px-4">
          <MenuItem clean={clean} titulo="Início" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
          <MenuItem clean={clean} titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
          <MenuItem clean={clean} ativo titulo="Faturam." Icone={CircleDollarSign} onClick={() => {}} />
          <MenuItem clean={clean} titulo="Config." Icone={Settings} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

function InputField({ label, icon: Icon, value, onChange, placeholder, type = "text", clean }: any) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase opacity-40 ml-1">{label}</label>
      <div className={`flex items-center gap-3 p-4 rounded-2xl border mt-1.5 ${clean ? 'bg-slate-50' : 'bg-black/20 border-slate-800'}`}>
        <Icon size={18} className="text-blue-500" />
        <input 
          type={type}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder} 
          className="bg-transparent outline-none w-full font-bold text-sm" 
        />
      </div>
    </div>
  )
}

function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-1 ${ativo ? 'text-blue-500' : clean ? 'text-slate-400' : 'text-slate-500'}`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}