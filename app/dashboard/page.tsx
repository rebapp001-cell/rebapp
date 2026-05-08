'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  LogOut, Plus, ClipboardList, CircleDollarSign, Settings,
  Play, Pause, CheckCircle2, XCircle,
  LayoutGrid, User, ArrowUpRight, Wifi, WifiOff,
  Receipt, FileText
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [ordens, setOrdens] = useState<any[]>([])
  const [contadores, setContadores] = useState({ andamento: 0, parado: 0, finalizado: 0, cancelado: 0 })
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('todas')
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)

    carregarDashboard()

    const handleOnline = () => {
      setIsOnline(true)
      sincronizarDadosOffline()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function sincronizarDadosOffline() {
    const pendentes = JSON.parse(localStorage.getItem('os_pendentes') || '[]')
    if (pendentes.length > 0 && navigator.onLine) {
      const dadosParaEnviar = pendentes.map(({ numero_os, id, ...resto }: any) => resto)
      const { error } = await supabase.from('ordens_servico').insert(dadosParaEnviar)
      if (!error) {
        localStorage.removeItem('os_pendentes')
        alert(`✅ ${pendentes.length} ordens sincronizadas com sucesso!`)
        carregarDashboard()
      }
    }
  }

  async function carregarDashboard() {
    setCarregando(true)
    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) {
      router.push('/')
      return
    }

    const { data: dadosUsuario } = await supabase
      .from('usuarios')
      .select('nome, perfil, usuario')
      .eq('usuario', usuarioSalvo)
      .single()

    if (dadosUsuario) setUsuarioLogado(dadosUsuario)

    // Adicionado o campo 'status_faturamento' explicitamente na busca
    const { data: dadosOrdens } = await supabase
      .from('ordens_servico')
      .select('*, numero_pedido_faturamento, numero_os_faturamento, status_faturamento')
      .order('created_at', { ascending: false })

    const lista = dadosOrdens || []
    setOrdens(lista)

    setContadores({
      andamento: lista.filter(o => o.status === 'Em andamento').length,
      parado: lista.filter(o => o.status === 'Parado').length,
      finalizado: lista.filter(o => o.status === 'Finalizado').length,
      cancelado: lista.filter(o => o.status === 'Cancelado' || o.cancelada === true).length
    })
    setCarregando(false)
  }

  const clean = tema === 'clean'

  const ordensFiltradas = useMemo(() => {
    if (filtroStatus === 'em_andamento') return ordens.filter(o => o.status === 'Em andamento')
    if (filtroStatus === 'parado') return ordens.filter(o => o.status === 'Parado')
    if (filtroStatus === 'finalizado') return ordens.filter(o => o.status === 'Finalizado')
    if (filtroStatus === 'cancelado') return ordens.filter(o => o.status === 'Cancelado' || o.cancelada === true)
    return ordens
  }, [ordens, filtroStatus])

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
      }`}>
      <main className="max-w-md mx-auto px-5 pt-6">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className={`text-3xl font-black tracking-tight italic ${clean ? 'text-slate-800' : 'text-white'}`}>SISTEMA OS</h1>
              {isOnline ? (
                <Wifi size={18} className="text-emerald-500" />
              ) : (
                <WifiOff size={18} className="text-rose-500 animate-pulse" />
              )}
            </div>
            <p className={`text-sm font-bold uppercase tracking-widest ${clean ? 'text-slate-400' : 'text-blue-400/60'}`}>
              {isOnline ? 'Online' : 'Offline - Dados Locais'}
            </p>
          </div>

          <button
            onClick={() => { localStorage.removeItem('usuario'); router.push('/') }}
            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${clean ? 'bg-white border-slate-200 text-rose-500' : 'bg-[#0d1a2d] border-rose-500/30 text-rose-400'
              }`}
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* PERFIL E ATALHOS */}
        <div className={`rounded-3xl p-6 mb-6 shadow-2xl border ${clean ? 'bg-white border-slate-100' : 'bg-linear-to-br from-[#111d31] to-[#0a1220] border-blue-500/20'
          }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="min-w-0">
              <p className={`text-sm font-medium ${clean ? 'text-slate-500' : 'text-blue-300'}`}>Bem-vindo,</p>
              <p className="text-2xl font-black truncate">{usuarioLogado?.nome || 'Usuário'}</p>
              <p className="text-xs font-bold uppercase opacity-60">{usuarioLogado?.perfil || 'Acessando...'}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <User size={28} strokeWidth={2.5} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Atalho clean={clean} destaque titulo="Nova OS" Icone={Plus} onClick={() => router.push('/nova-os')} />
            <Atalho clean={clean} titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
            <Atalho clean={clean} titulo="Faturam." Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
            <Atalho clean={clean} titulo="Config." Icone={Settings} onClick={() => router.push('/configuracao')} />
          </div>
        </div>

        {/* INDICADORES */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <CardMini clean={clean} titulo="Em Execução" valor={contadores.andamento} Icone={Play} cor="blue" onClick={() => setFiltroStatus('em_andamento')} />
          <CardMini clean={clean} titulo="Paradas" valor={contadores.parado} Icone={Pause} cor="amber" onClick={() => setFiltroStatus('parado')} />
          <CardMini clean={clean} titulo="Finalizadas" valor={contadores.finalizado} Icone={CheckCircle2} cor="emerald" onClick={() => setFiltroStatus('finalizado')} />
          <CardMini clean={clean} titulo="Canceladas" valor={contadores.cancelado} Icone={XCircle} cor="rose" onClick={() => setFiltroStatus('cancelado')} />
        </div>

        {/* LISTAGEM RECENTE */}
        <section className={`rounded-3xl border shadow-xl overflow-hidden ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'
          }`}>
          <div className="p-5 flex items-center justify-between border-b border-white/5">
            <h2 className="font-black text-lg uppercase tracking-tight">
              {filtroStatus === 'todas' ? 'Recentes' :
                filtroStatus === 'parado' ? 'OS Paradas' :
                  filtroStatus === 'cancelado' ? 'OS Canceladas' : 'Resultado'}
            </h2>
            {filtroStatus !== 'todas' && (
              <button onClick={() => setFiltroStatus('todas')} className="text-[10px] font-black text-blue-500 uppercase bg-blue-500/10 px-2 py-1 rounded-lg">
                Limpar Filtro
              </button>
            )}
            {filtroStatus === 'todas' && (
              <button onClick={() => router.push('/ordens')} className="text-blue-500 text-xs font-bold uppercase flex items-center gap-1">
                Ver tudo <ArrowUpRight size={14} />
              </button>
            )}
          </div>

          <div className="p-4 space-y-3">
            {carregando ? (
              <div className="py-10 text-center animate-pulse text-slate-500 italic">Buscando ordens...</div>
            ) : ordensFiltradas.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm italic">Nenhum registro encontrado.</div>
            ) : (
              (filtroStatus === 'todas' ? ordensFiltradas.slice(0, 5) : ordensFiltradas).map((ordem) => {

                // --- LÓGICA DE FATURAMENTO COM 3 ESTADOS ---
                const statusFat = ordem.status_faturamento; // Esperado: 'Faturado', 'Parcialmente Faturado' ou null/vazio
                const temNumeros = !!(ordem.numero_pedido_faturamento || ordem.numero_os_faturamento);

                let fatLabel = "Pendente";
                let fatStyles = "bg-slate-500/20 text-slate-400 border border-slate-500/30";

                if (statusFat === 'Faturado') {
                  fatLabel = "Faturado";
                  fatStyles = "bg-emerald-500 text-white shadow-sm";
                } else if (statusFat === 'Parcialmente Faturado' || statusFat === 'Parcial') {
                  fatLabel = "Parcial";
                  fatStyles = "bg-amber-500 text-white shadow-sm";
                } else if (temNumeros && !statusFat) {
                  // Fallback para manter compatibilidade se o status_faturamento não foi preenchido
                  fatLabel = "Faturado";
                  fatStyles = "bg-emerald-500 text-white shadow-sm";
                }

                return (
                  <div
                    key={ordem.id}
                    onClick={() => router.push(`/ordens/${ordem.id}`)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] hover:border-blue-500/50 ${clean ? 'bg-slate-50 border-slate-100' : 'bg-[#111c2e] border-slate-700/50'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-blue-500">#{ordem.numero_os ?? ordem.id}</span>

                        {/* INDICADOR DE FATURAMENTO PARA FINALIZADAS */}
                        {ordem.status === 'Finalizado' && (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${fatStyles}`}>
                            <Receipt size={10} />
                            {fatLabel}
                          </div>
                        )}
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${ordem.status === 'Finalizado'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : (ordem.status === 'Cancelado' || ordem.cancelada)
                          ? 'bg-rose-500/10 text-rose-500'
                          : ordem.status === 'Parado'
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                        {ordem.status}
                      </span>
                    </div>

                    <p className="text-sm font-bold truncate uppercase">{ordem.cliente}</p>
                    <p className="text-xs opacity-50 truncate uppercase mb-1">
                      {ordem.maquina || 'MAQUINA NÃO INF.'}
                    </p>

                    {/* EXIBIÇÃO DOS DADOS DE FATURAMENTO SE EXISTIREM */}
                    {temNumeros && (
                      <div className="mt-2 text-[10px] font-bold text-emerald-500/80 flex flex-wrap gap-3">
                        {ordem.numero_pedido_faturamento && <span>PED: {ordem.numero_pedido_faturamento}</span>}
                        {ordem.numero_os_faturamento && <span>OS: {ordem.numero_os_faturamento}</span>}
                      </div>
                    )}

                    {/* EXIBIÇÃO DO TÉCNICO EM ANDAMENTO */}
                    {ordem.status === 'Em andamento' && ordem.usuario_responsavel && (
                      <div className="mt-2 p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-[10px] font-black uppercase text-blue-500">
                          Executando: <span className="opacity-80 font-bold">{ordem.usuario_responsavel}</span>
                        </p>
                      </div>
                    )}

                    {/* EXIBIÇÃO DO MOTIVO SE PARADO */}
                    {ordem.status === 'Parado' && ordem.motivo_parada && (
                      <div className="mt-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                        <p className="text-[9px] font-black uppercase text-amber-500">Motivo da Parada:</p>
                        <p className="text-[11px] font-bold italic opacity-80">"{ordem.motivo_parada}"</p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

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

function Atalho({ titulo, Icone, onClick, destaque, clean }: any) {
  return (
    <button onClick={onClick} className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-90 border ${destaque ? 'bg-blue-600 border-blue-400 text-white' : clean ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-[#121c2c] border-slate-700 text-slate-300'
      }`}>
      <Icone size={22} strokeWidth={destaque ? 3 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

function CardMini({ titulo, valor, Icone, cor, clean, onClick }: any) {
  const cores: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  }
  return (
    <button onClick={onClick} className={`p-4 rounded-3xl border text-left transition-all active:scale-95 ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'
      }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 border ${cores[cor] || cores.blue}`}>
        <Icone size={16} strokeWidth={2.5} />
      </div>
      <p className="text-2xl font-black">{valor}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{titulo}</p>
    </button>
  )
}

function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 transition-colors ${ativo ? 'text-blue-500' : clean ? 'text-slate-400' : 'text-slate-500'
      }`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className={`mt-1 text-[10px] font-bold uppercase tracking-tighter ${ativo ? 'opacity-100' : 'opacity-60'}`}>
        {titulo}
      </span>
    </button>
  )
}