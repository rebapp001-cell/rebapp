'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, Search, XCircle, LayoutGrid,
  ClipboardList, CircleDollarSign, Settings, Hash,
  Receipt, Store, DollarSign, FileText
} from 'lucide-react'

export default function FaturamentoPage() {
  const router = useRouter()

  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [ordens, setOrdens] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  // Estados do Modal de Gerenciamento
  const [modalAberto, setModalAberto] = useState(false)
  const [osSelecionada, setOsSelecionada] = useState<any>(null)
  const [unidade, setUnidade] = useState('')
  const [numPedido, setNumPedido] = useState('')
  const [numSistema, setNumSistema] = useState('')
  const [valor, setValor] = useState('')
  const [statusFaturamento, setStatusFaturamento] = useState('Pendente')
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

  const ehFaturamento = usuarioLogado?.perfil === 'Faturamento' || usuarioLogado?.perfil === 'Admin'
  const clean = tema === 'clean'

  const prepararFaturamento = (e: React.MouseEvent, ordem: any) => {
    e.stopPropagation()
    setOsSelecionada(ordem)
    setUnidade(ordem.unidade_faturamento || 'TORNEARIA DIVISA')
    setNumPedido(ordem.numero_pedido_faturamento || '')
    setNumSistema(ordem.numero_os_faturamento || '')
    setValor(ordem.valor_faturamento || '')
    setStatusFaturamento(ordem.status_faturamento === 'Faturado' ? 'Faturado' : 'Pendente')
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
        valor_faturamento: valor ? parseFloat(valor.toString().replace(',', '.')) : 0,
        status_faturamento: statusFaturamento,
        faturado: statusFaturamento === 'Faturado'
      }

      if (statusFaturamento === 'Faturado') {
        updates.data_faturamento = new Date().toISOString()
      } else {
        updates.data_faturamento = null
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
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">

        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className={`p-2.5 rounded-xl border ${clean ? 'bg-white' : 'bg-[#0d1a2d] border-slate-800'}`}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Faturamento</h1>
              <p className="text-[10px] font-bold opacity-40 uppercase">Controle de Saída</p>
            </div>
          </div>
        </header>

        {/* BUSCA */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-800'}`}>
          <Search size={18} className="text-blue-500" />
          <input
            placeholder="Buscar por cliente ou OS..."
            className="bg-transparent outline-none text-sm w-full font-medium"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* LISTAGEM */}
        <div className="space-y-4">
          {carregando ? (
            <div className="py-20 text-center opacity-50 italic">Carregando ordens...</div>
          ) : ordensFiltradas.map((ordem) => (
            <div
              key={ordem.id}
              // CORREÇÃO DA ROTA: Agora aponta para /ordens/[id]
              onClick={() => router.push(`/ordens/${ordem.id}`)}
              className={`rounded-4xl border p-6 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${ordem.status_faturamento === 'Faturado'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : clean ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0b1628] border-slate-800'
                }`}
            >
              <div className="flex justify-between mb-4">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase ${ordem.status_faturamento === 'Faturado' ? 'bg-emerald-500 text-white' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                  {ordem.status_faturamento === 'Faturado' ? 'Faturado' : 'Pendente'}
                </span>
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">OS #{ordem.numero_os}</span>
              </div>

              <h3 className="font-black text-base uppercase mb-1 truncate">{ordem.cliente}</h3>
              <p className="text-xs font-bold opacity-50 mb-5 truncate uppercase">{ordem.maquina}</p>

              {(ordem.numero_pedido_faturamento || ordem.numero_os_faturamento || (ordem.valor_faturamento > 0)) && (
                <div className={`mb-5 p-4 rounded-2xl border flex flex-col gap-3 ${clean ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Store size={14} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {ordem.unidade_faturamento || '---'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500">
                      <DollarSign size={14} />
                      <span className="text-xs font-black">
                        {Number(ordem.valor_faturamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 border-t border-white/5 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold opacity-40">Pedido</span>
                      <span className="text-[10px] font-black">{ordem.numero_pedido_faturamento || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold opacity-40">OS Sistema</span>
                      <span className="text-[10px] font-black">{ordem.numero_os_faturamento || '---'}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={(e) => prepararFaturamento(e, ordem)}
                className="w-full py-4 rounded-xl bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95"
              >
                {ehFaturamento ? 'Gerenciar Faturamento' : 'Ver Dados de Venda'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DE GERENCIAMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setModalAberto(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-sm rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-lg uppercase tracking-tight">Gerenciar Faturamento</h2>
              <button onClick={() => setModalAberto(false)}><XCircle size={24} className="opacity-30" /></button>
            </div>

            <div className="space-y-4">
              {/* Unidade Faturadora */}
              <div>
                <label className="text-[9px] font-black uppercase opacity-40 ml-1">Unidade Faturadora</label>
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

              {/* Status */}
              {ehFaturamento && (
                <div>
                  <label className="text-[9px] font-black uppercase opacity-40 ml-1">Status</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {['Pendente', 'Faturado'].map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFaturamento(s)}
                        className={`py-3 rounded-xl text-[9px] font-black border transition-all ${statusFaturamento === s ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-700 opacity-40'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Campos de Input */}
              <InputField label="Nº Pedido de Venda" icon={Receipt} value={numPedido} onChange={setNumPedido} placeholder="00000" clean={clean} />
              <InputField label="Nº OS do Sistema" icon={Hash} value={numSistema} onChange={setNumSistema} placeholder="0000" clean={clean} />
              <InputField label="Valor do Serviço (R$)" icon={DollarSign} value={valor} onChange={setValor} placeholder="0,00" clean={clean} />

              <button
                onClick={salvarFaturamento}
                disabled={salvando}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-widest mt-4 bg-blue-600 text-white shadow-lg active:scale-95 transition-all"
              >
                {salvando ? 'Salvando...' : 'Confirmar Faturamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU INFERIOR */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 ${clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'
        }`}>
        <div className="max-w-md mx-auto grid grid-cols-5 px-2">
          <MenuItem
            titulo="Início"
            Icone={LayoutGrid}
            clean={clean}
            onClick={() => router.push('/dashboard')}
          />
          <MenuItem
            titulo="Ordens"
            Icone={ClipboardList}
            clean={clean}
            onClick={() => router.push('/ordens')}
          />
          <MenuItem
            titulo="Orçam."
            Icone={FileText}
            clean={clean}
            onClick={() => router.push('/orcamento')}
          />
          <MenuItem
            titulo="Faturam."
            Icone={CircleDollarSign}
            clean={clean}
            onClick={() => router.push('/faturamento')}
          />
          <MenuItem
            titulo="Config."
            Icone={Settings}
            clean={clean}
            onClick={() => router.push('/configuracao')}
          />
        </div>
      </nav>
    </div>
  )
}

function InputField({ label, icon: Icon, value, onChange, placeholder, clean }: any) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase opacity-40 ml-1">{label}</label>
      <div className={`flex items-center gap-3 p-4 rounded-2xl border mt-1.5 ${clean ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-slate-800'}`}>
        <Icon size={18} className="text-blue-500" />
        <input
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
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-1 transition-all ${ativo ? 'text-blue-500 scale-110' : clean ? 'text-slate-400' : 'text-slate-500'}`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}