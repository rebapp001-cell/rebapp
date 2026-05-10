'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, 
  Plus, 
  RotateCw, 
  ClipboardList, 
  LayoutGrid, 
  CircleDollarSign, 
  Settings,
  ChevronRight,
  FileText,
  Search,
  Filter
} from 'lucide-react'

type OrdemServico = {
  id: number
  numero_os: number | null
  cliente: string
  solicitante: string | null
  maquina: string
  status: string
  created_at: string
}

export default function OrdensPage() {
  const router = useRouter()
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  
  // ESTADOS DE FILTRO
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarOrdens()
  }, [])

  async function carregarOrdens() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .order('id', { ascending: false })

    if (!error) setOrdens(data || [])
    setCarregando(false)
  }

  // LÓGICA DE FILTRO COMBINADA (BUSCA + STATUS)
  const ordensFiltradas = useMemo(() => {
    return ordens.filter(ordem => {
      const termo = busca.toLowerCase()
      const bateBusca = (
        ordem.cliente?.toLowerCase().includes(termo) ||
        ordem.solicitante?.toLowerCase().includes(termo) ||
        ordem.maquina?.toLowerCase().includes(termo) ||
        ordem.numero_os?.toString().includes(termo)
      )

      const bateStatus = filtroStatus === 'todos' || ordem.status === filtroStatus

      return bateBusca && bateStatus
    })
  }, [ordens, busca, filtroStatus])

  const clean = tema === 'clean'

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${
      clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
    }`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* CABEÇALHO */}
        <div className="flex items-start gap-3 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
              clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1a2d] border-slate-800 text-white'
            }`}
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold leading-tight">Ordens de Serviço</h1>
            <p className={`text-sm ${clean ? 'text-slate-500' : 'text-slate-400'}`}>
              Gerencie seus atendimentos
            </p>
          </div>

          <button
            onClick={() => router.push('/nova-os')}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl shadow-lg shadow-red-600/20 flex items-center gap-2 shrink-0 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="text-sm font-bold pr-1">Nova</span>
          </button>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="mb-4 relative">
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${clean ? 'text-slate-400' : 'text-slate-500'}`}>
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`w-full py-4 pl-12 pr-4 rounded-2xl border outline-none transition-all font-medium text-sm ${
              clean 
                ? 'bg-white border-slate-200 focus:border-red-500 shadow-sm' 
                : 'bg-[#0d1726] border-slate-800 focus:border-red-500 text-white'
            }`}
          />
        </div>

        {/* FILTROS POR STATUS */}
        <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
          <BotaoFiltro label="Todos" ativo={filtroStatus === 'todos'} onClick={() => setFiltroStatus('todos')} clean={clean} />
          <BotaoFiltro label="Em andamento" ativo={filtroStatus === 'Em andamento'} onClick={() => setFiltroStatus('Em andamento')} clean={clean} />
          <BotaoFiltro label="Parado" ativo={filtroStatus === 'Parado'} onClick={() => setFiltroStatus('Parado')} clean={clean} />
          <BotaoFiltro label="Finalizado" ativo={filtroStatus === 'Finalizado'} onClick={() => setFiltroStatus('Finalizado')} clean={clean} />
          <BotaoFiltro label="Cancelado" ativo={filtroStatus === 'Cancelado'} onClick={() => setFiltroStatus('Cancelado')} clean={clean} />
        </div>

        {/* CONTAINER PRINCIPAL */}
        <section className={`rounded-3xl border shadow-sm overflow-hidden ${
          clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800/50'
        }`}>
          <div className={`p-5 border-b flex items-center justify-between ${
            clean ? 'border-slate-100' : 'border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500">
                <ClipboardList size={22} />
              </div>
              <h2 className="font-bold">Resultados</h2>
            </div>

            <button
              onClick={carregarOrdens}
              className={`p-2.5 rounded-xl border transition-all active:rotate-180 ${
                clean ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#111c2e] border-slate-700 text-slate-400'
              }`}
            >
              <RotateCw size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {carregando ? (
              <div className="py-10 text-center animate-pulse text-slate-500">Carregando...</div>
            ) : ordensFiltradas.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm italic">
                Nenhuma OS encontrada.
              </div>
            ) : (
              ordensFiltradas.map((ordem) => (
                <button
                  key={ordem.id}
                  onClick={() => router.push(`/ordens/${ordem.id}`)}
                  className={`w-full border rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                    clean ? 'bg-slate-50 border-slate-100 hover:border-red-200' : 'bg-[#111c2e] border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-red-600/20">
                        {ordem.numero_os ?? ordem.id}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm leading-tight truncate">{ordem.cliente}</p>
                        <p className="text-[10px] opacity-50 uppercase font-bold mt-1 tracking-tighter">
                          OS #{ordem.numero_os ?? ordem.id}
                        </p>
                      </div>
                    </div>
                    <span className={badgeStatus(ordem.status)}>
                      {ordem.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <InfoLinha clean={clean} titulo="Solicitante" texto={ordem.solicitante || '-'} />
                    <InfoLinha clean={clean} titulo="Máquina" texto={ordem.maquina} />
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-500/10 flex items-center justify-between text-red-500 font-bold text-xs uppercase tracking-wider">
                    <span>Abrir Relatório</span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))
            )}
          </div>

          <div className={`p-4 border-t text-center flex items-center justify-center gap-2 text-xs font-medium ${
            clean ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-[#111c2e]/30 border-slate-800 text-slate-400'
          }`}>
            <FileText size={14} />
            Mostrando {ordensFiltradas.length} de {ordens.length}
          </div>
        </section>
      </main>

      {/* MENU INFERIOR PADRONIZADO (5 COLUNAS) */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 ${
        clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'
      }`}>
        <div className="max-w-md mx-auto grid grid-cols-5 px-2">
          <MenuItem clean={clean} titulo="Início" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
          <MenuItem clean={clean} ativo titulo="Ordens" Icone={ClipboardList} onClick={() => {}} />
          <MenuItem clean={clean} titulo="Orçam." Icone={FileText} onClick={() => router.push('/orcamento')} />
          <MenuItem clean={clean} titulo="Faturam." Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
          <MenuItem clean={clean} titulo="Config." Icone={Settings} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

// COMPONENTES AUXILIARES
function BotaoFiltro({ label, ativo, onClick, clean }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
        ativo 
          ? 'bg-red-600 border-red-500 text-white shadow-lg' 
          : clean 
            ? 'bg-white border-slate-200 text-slate-400' 
            : 'bg-[#0d1726] border-slate-800 text-slate-500'
      }`}
    >
      {label}
    </button>
  )
}

function InfoLinha({ titulo, texto, clean }: any) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase font-bold opacity-40">{titulo}</span>
      <span className={`text-xs font-semibold truncate max-w-37.5 ${clean ? 'text-slate-600' : 'text-slate-300'}`}>
        {texto}
      </span>
    </div>
  )
}

function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center py-2 transition-all active:scale-90 ${
        ativo ? 'text-red-500' : clean ? 'text-slate-400' : 'text-slate-500'
      }`}
    >
      <Icone size={22} strokeWidth={ativo ? 2.5 : 2} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

function badgeStatus(status: string) {
  const base = "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 "
  switch (status) {
    case 'Em andamento': return base + "bg-blue-500/10 text-blue-500"
    case 'Finalizado': return base + "bg-emerald-500/10 text-emerald-500"
    case 'Cancelado': return base + "bg-rose-500/10 text-rose-500"
    case 'Parado':
    case 'Aguardando material': return base + "bg-amber-500/10 text-amber-500"
    default: return base + "bg-slate-500/10 text-slate-500"
  }
}