'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, ClipboardList, User, Monitor, 
  FileText, Camera, Users, LayoutGrid, 
  CircleDollarSign, Settings, CheckCircle2, XCircle, Loader2, FolderOpen,
  PlayCircle, PauseCircle, Pencil, Ruler
} from 'lucide-react'

// --- INTERFACES ---
type OrdemServico = {
  id: number
  numero_os: number | null
  cliente: string
  solicitante: string | null
  maquina: string
  descricao: string
  status: string
  cancelada: boolean
  motivo_cancelamento: string | null
  motivo_parada: string | null
  usuario_responsavel: string | null
  created_at: string
  numero_pedido_faturamento: string | null
  numero_os_faturamento: string | null
}

type FotoOS = {
  id: string
  url: string
}

type Material = {
  id: string
  tipo: string
  descricao: string
  quantidade: string
  // Campos técnicos adicionados
  espessura?: string
  diametro?: string
  diametro_interno?: string
  comprimento?: string
  largura?: string
}

type Atualizacao = {
  id: number
  created_at: string
  ordem_servico_id: number
  descricao: string
  tecnicos_responsaveis: string | null
  usuario_nome: string | null
}

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()
  const id_os = params.id

  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [fotos, setFotos] = useState<FotoOS[]>([])
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [perfilUsuario, setPerfilUsuario] = useState<string | null>(null)
  
  const [numPedido, setNumPedido] = useState('')
  const [numOSFaturam, setNumOSFaturam] = useState('')
  const [salvandoDadosExtras, setSalvandoDadosExtras] = useState(false)

  const [tecnicoAtuante, setTecnicoAtuante] = useState('')
  const [atividadeExecutada, setAtividadeExecutada] = useState('')
  const [mostrarCampoAndamento, setMostrarCampoAndamento] = useState(false)
  
  const [motivoParada, setMotivoParada] = useState('')
  const [mostrarCampoParada, setMostrarCampoParada] = useState(false)
  const [atualizandoStatusRapido, setAtualizandoStatusRapido] = useState(false)

  const [modalEdicao, setModalEdicao] = useState(false)
  const [editForm, setEditForm] = useState({
    cliente: '',
    solicitante: '',
    maquina: '',
    descricao: ''
  })
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarDados()
  }, [])

  async function carregarDados() {
    const id = Number(id_os)
    const usuarioLogado = localStorage.getItem('usuario')
    
    if (usuarioLogado) {
        const { data: userData } = await supabase
            .from('usuarios')
            .select('perfil')
            .eq('usuario', usuarioLogado)
            .single()
        if (userData) setPerfilUsuario(userData.perfil)
    }

    const { data: osData } = await supabase.from('ordens_servico').select('*').eq('id', id).single()
    if (!osData) return setCarregando(false)
    
    setOrdem(osData)
    setNumPedido(osData.numero_pedido_faturamento || '')
    setNumOSFaturam(osData.numero_os_faturamento || '')
    
    setEditForm({
      cliente: osData.cliente || '',
      solicitante: osData.solicitante || '',
      maquina: osData.maquina || '',
      descricao: osData.descricao || ''
    })

    const { data: fotosData } = await supabase.from('fotos_os').select('id, url').eq('id_os', id)
    setFotos(fotosData || [])

    const { data: upds } = await supabase.from('os_atualizacoes').select('*').eq('ordem_servico_id', id).order('created_at', { ascending: false })
    setAtualizacoes(upds || [])

    // Busca todos os campos da tabela de materiais
    const { data: mats } = await supabase.from('materiais_os').select('*').eq('id_os', id)
    setMateriais(mats || [])

    setCarregando(false)
  }

  // --- FUNÇÕES DE AÇÃO ---
  async function atualizarStatusExecucao(novoStatus: string) {
    if (!ordem) return
    
    if (novoStatus === 'Em andamento') {
        if (!mostrarCampoAndamento) {
            setMostrarCampoAndamento(true)
            setMostrarCampoParada(false)
            return 
        }
        if (!tecnicoAtuante.trim() || !atividadeExecutada.trim()) {
            alert("Por favor, preencha o nome do técnico e a atividade.");
            return
        }
    }

    if (novoStatus === 'Parado') {
        if (!mostrarCampoParada) {
            setMostrarCampoParada(true)
            setMostrarCampoAndamento(false)
            return 
        }
        if (!motivoParada.trim()) {
            alert("Por favor, digite o motivo da parada.");
            return
        }
    }

    setAtualizandoStatusRapido(true)
    const { error } = await supabase
      .from('ordens_servico')
      .update({ 
        status: novoStatus,
        motivo_parada: novoStatus === 'Parado' ? motivoParada : null,
        usuario_responsavel: novoStatus === 'Em andamento' ? tecnicoAtuante : ordem.usuario_responsavel
      })
      .eq('id', ordem.id)

    if (!error) {
      await supabase.from('os_atualizacoes').insert([{
        ordem_servico_id: ordem.id,
        descricao: novoStatus === 'Em andamento' 
          ? `EXECUTANDO: ${atividadeExecutada}` 
          : `PARALISADO: ${motivoParada}`,
        tecnicos_responsaveis: novoStatus === 'Em andamento' ? tecnicoAtuante : null,
        usuario_nome: 'SISTEMA'
      }])
      
      setMostrarCampoParada(false)
      setMostrarCampoAndamento(false)
      setAtividadeExecutada('')
      await carregarDados()
    }
    setAtualizandoStatusRapido(false)
  }

  async function salvarEdicaoOS() {
    if (!ordem) return
    setSalvandoEdicao(true)
    const { error } = await supabase.from('ordens_servico').update({
        cliente: editForm.cliente,
        solicitante: editForm.solicitante,
        maquina: editForm.maquina,
        descricao: editForm.descricao
      }).eq('id', ordem.id)

    if (!error) { 
        setModalEdicao(false)
        carregarDados() 
    }
    setSalvandoEdicao(false)
  }

  async function handleAddFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !ordem) return
    try {
      const uploads = Array.from(files).map(async (file) => {
        const nomeArquivo = `${ordem.id}/${Date.now()}-${file.name}`
        const { error: storageError } = await supabase.storage.from('os-imagens').upload(nomeArquivo, file)
        if (storageError) throw storageError
        const { data: { publicUrl } } = supabase.storage.from('os-imagens').getPublicUrl(nomeArquivo)
        return supabase.from('fotos_os').insert([{ id_os: ordem.id, url: publicUrl }])
      })
      await Promise.all(uploads)
      carregarDados()
    } catch (err) { alert("Erro ao enviar foto") }
  }

  async function alterarStatus(novoStatus: string) {
    if (!ordem) return
    if (!confirm(`Deseja alterar o status para ${novoStatus}?`)) return
    const { error } = await supabase.from('ordens_servico').update({ 
      status: novoStatus, 
      cancelada: novoStatus === 'Cancelado'
    }).eq('id', ordem.id)
    if (!error) carregarDados()
  }

  async function salvarDadosFaturamento() {
    setSalvandoDadosExtras(true)
    const { error } = await supabase.from('ordens_servico').update({
        numero_pedido_faturamento: numPedido,
        numero_os_faturamento: numOSFaturam
      }).eq('id', ordem?.id)

    if (!error) { alert("Faturamento atualizado!"); carregarDados() }
    setSalvandoDadosExtras(false)
  }

  // --- ESTILOS E CONDICIONAIS ---
  const clean = tema === 'clean'
  const encerrada = ordem?.status === 'Finalizado' || ordem?.status === 'Cancelado'
  const exibirFaturamento = ordem && ordem.status !== 'Cancelado' && ordem.status !== 'Nova'
  const podeEditarSempre = perfilUsuario && ['Engenheiro', 'Diretor', 'Encarregado de Produção'].includes(perfilUsuario)

  if (carregando) return (
    <div className={`min-h-screen flex items-center justify-center font-bold ${clean ? 'bg-slate-50 text-slate-400' : 'bg-[#07111f] text-blue-500'}`}>
      Carregando detalhes...
    </div>
  )

  if (!ordem) return <div className="p-10 text-center">OS não encontrada.</div>

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button onClick={() => router.push('/ordens')} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black uppercase italic tracking-tighter">OS #{ordem.numero_os ?? ordem.id}</h1>
            <div className="flex items-center gap-2">
                <span className={badgeEstilo(ordem.status)}>
                    {ordem.status}
                </span>
                {(!encerrada || podeEditarSempre) && (
                    <button onClick={() => setModalEdicao(true)} className="p-1 text-blue-500 active:scale-90 transition-transform">
                        <Pencil size={14} />
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* CONTROLE DE OPERAÇÃO */}
        {!encerrada && (
          <section className={`rounded-3xl p-5 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} className="text-blue-500" />
              <h2 className="text-xs font-black uppercase tracking-tighter">Controle de Operação</h2>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => atualizarStatusExecucao('Em andamento')} 
                className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${(ordem.status === 'Em andamento' || mostrarCampoAndamento) ? 'bg-blue-600 border-blue-400 text-white shadow-md' : clean ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}
              >
                <PlayCircle size={18} />
                <span className="text-[10px] font-black uppercase">Andamento</span>
              </button>

              <button 
                onClick={() => atualizarStatusExecucao('Parado')} 
                className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${(ordem.status === 'Parado' || mostrarCampoParada) ? 'bg-amber-500 border-amber-400 text-white shadow-md' : clean ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}
              >
                <PauseCircle size={18} />
                <span className="text-[10px] font-black uppercase">Parar</span>
              </button>
            </div>

            {mostrarCampoAndamento && (
              <div className="mt-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3 animate-in fade-in zoom-in duration-200">
                <input 
                  type="text" 
                  value={tecnicoAtuante} 
                  onChange={(e) => setTecnicoAtuante(e.target.value)}
                  placeholder="Nome do técnico..."
                  className={`w-full p-3 rounded-xl text-sm font-bold border outline-none ${clean ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#111c2e] border-slate-700 text-white'}`}
                />
                <textarea 
                  value={atividadeExecutada} 
                  onChange={(e) => setAtividadeExecutada(e.target.value)}
                  placeholder="O que está sendo feito?"
                  className={`w-full p-3 rounded-xl text-sm font-bold border outline-none min-h-[80px] ${clean ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#111c2e] border-slate-700 text-white'}`}
                />
                <button 
                  onClick={() => atualizarStatusExecucao('Em andamento')}
                  disabled={atualizandoStatusRapido}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"
                >
                  {atualizandoStatusRapido ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Confirmar e Iniciar
                </button>
              </div>
            )}

            {mostrarCampoParada && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 animate-in fade-in zoom-in duration-200">
                <textarea 
                  value={motivoParada} 
                  onChange={(e) => setMotivoParada(e.target.value)}
                  placeholder="Qual o motivo da parada?"
                  className={`w-full p-3 rounded-xl text-sm font-bold border outline-none min-h-[80px] ${clean ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#111c2e] border-slate-700 text-white'}`}
                />
                <button 
                  onClick={() => atualizarStatusExecucao('Parado')}
                  disabled={atualizandoStatusRapido}
                  className="w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"
                >
                  {atualizandoStatusRapido ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Confirmar Parada
                </button>
              </div>
            )}
          </section>
        )}

        {/* INFO PRINCIPAIS */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <InfoItem clean={clean} Icone={User} titulo="Cliente" texto={ordem.cliente} />
            <InfoItem clean={clean} Icone={Monitor} titulo="Máquina" texto={ordem.maquina} />
            <InfoItem clean={clean} Icone={Users} titulo="Solicitante" texto={ordem.solicitante || '-'} />
            <InfoItem clean={clean} Icone={User} titulo="Técnico Atual" texto={ordem.usuario_responsavel || '-'} />
            <InfoItem clean={clean} Icone={FileText} titulo="Descrição Original" texto={ordem.descricao} full />
          </div>
        </section>

        {/* FOTOS */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Camera size={20} className="text-blue-500" />
            <h2 className="font-black uppercase tracking-tighter">Fotos</h2>
          </div>
          {!encerrada && (
            <div className="flex gap-2 mb-4">
              <label className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl cursor-pointer shadow-md">
                <Camera size={16} /> <span className="text-[10px] font-black">Câmera</span>
                <input type="file" hidden accept="image/*" capture="environment" onChange={handleAddFoto} />
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 border py-3 rounded-xl cursor-pointer ${clean ? 'bg-slate-100' : 'bg-slate-700/50'}`}>
                <FolderOpen size={16} /> <span className="text-[10px] font-black">Galeria</span>
                <input type="file" multiple hidden accept="image/*" onChange={handleAddFoto} />
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {fotos.map((f) => (
              <img key={f.id} src={f.url} className="w-full h-32 object-cover rounded-xl border border-slate-700/30" onClick={() => window.open(f.url)} />
            ))}
          </div>
        </section>

        {/* MATERIAIS - QUADRO ATUALIZADO */}
        <div className="mb-6">
          {!encerrada && (
            <button onClick={() => router.push(`/ordens/${id_os}/material`)} className={`w-full py-4 mb-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 ${clean ? 'border-blue-500/30 text-blue-600' : 'border-blue-500/20 text-blue-400'}`}>
              <span className="font-black uppercase text-xs">Acrescentar Material</span>
            </button>
          )}
          
          {materiais.length > 0 && (
            <div className={`rounded-3xl p-6 border ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
              <h2 className="font-black uppercase text-xs mb-4">Materiais / Peças</h2>
              <div className="space-y-3">
                {materiais.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-500/5 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-black uppercase text-blue-500 italic">
                        {m.tipo?.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-black px-2 py-1 bg-blue-500/10 rounded-lg text-blue-500">
                        x{m.quantidade}
                      </span>
                    </div>
                    
                    <p className="text-xs font-bold uppercase mb-2">{m.descricao}</p>
                    
                    {/* Grid Dinâmico de Dimensões Técnicas */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 pt-3 border-t border-white/5">
                      {m.espessura && <MedidaDetalhe label="Espessura" valor={`${m.espessura}mm`} />}
                      {m.diametro && <MedidaDetalhe label={m.tipo?.includes('tubo') ? "Ø Externo" : "Ø Diâmetro"} valor={`${m.diametro}mm`} />}
                      {m.diametro_interno && <MedidaDetalhe label="Ø Interno" valor={`${m.diametro_interno}mm`} />}
                      {m.largura && <MedidaDetalhe label="Largura" valor={`${m.largura}mm`} />}
                      {m.comprimento && <MedidaDetalhe label="Comprimento" valor={`${m.comprimento}mm`} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HISTÓRICO DE ATIVIDADES */}
        <section className={`rounded-3xl p-6 mb-8 border ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-500/10 pb-4">
            <FileText size={20} className="text-purple-500" />
            <h2 className="font-black uppercase tracking-tighter">Histórico de Mão de Obra</h2>
          </div>
          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-500/10">
            {atualizacoes.map((item) => (
              <div key={item.id} className="pl-8 relative">
                <div className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-4 ${item.usuario_nome === 'SISTEMA' ? 'bg-amber-500' : 'bg-purple-500'} ${clean ? 'border-white' : 'border-[#0d1726]'}`} />
                <div className="flex justify-between">
                  <p className="font-black text-[10px] uppercase text-blue-500">{item.tecnicos_responsaveis || item.usuario_nome}</p>
                  <span className="text-[9px] opacity-40">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium mt-1">{item.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FATURAMENTO */}
        {exibirFaturamento && (
          <section className={`rounded-3xl p-6 mb-8 border ${ordem.status === 'Finalizado' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-blue-500/40 bg-blue-500/5'} ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <h2 className="font-black uppercase text-xs mb-4 text-blue-500">Dados de Faturamento</h2>
            <div className="space-y-4">
              <input type="text" value={numPedido} onChange={(e) => setNumPedido(e.target.value)} placeholder="Nº Pedido de Venda" className={`w-full rounded-xl p-4 text-sm font-bold border outline-none ${clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#111c2e] border-slate-700 text-white'}`} />
              <input type="text" value={numOSFaturam} onChange={(e) => setNumOSFaturam(e.target.value)} placeholder="Nº OS do Sistema Principal" className={`w-full rounded-xl p-4 text-sm font-bold border outline-none ${clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#111c2e] border-slate-700 text-white'}`} />
              <button 
                onClick={salvarDadosFaturamento} 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-transform"
                disabled={salvandoDadosExtras}
              >
                {salvandoDadosExtras ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Salvar no Faturamento'}
              </button>
            </div>
          </section>
        )}

        {/* BOTÕES FINAIS */}
        {!encerrada && (
          <div className="grid grid-cols-2 gap-4 mb-10">
            <button onClick={() => alterarStatus('Cancelado')} className="flex flex-col items-center p-5 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 active:scale-95 transition-transform">
              <XCircle size={28} className="mb-2" /> <span className="text-[10px] font-black uppercase">Cancelar</span>
            </button>
            <button onClick={() => alterarStatus('Finalizado')} className="flex flex-col items-center p-5 rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
              <CheckCircle2 size={28} className="mb-2" /> <span className="text-[10px] font-black uppercase">Finalizar OS</span>
            </button>
          </div>
        )}
      </main>

      {/* MENU NAVEGAÇÃO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-3 px-6 z-50 ${clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'}`}>
        <div className="max-w-md mx-auto flex justify-between items-center">
          <MenuNav titulo="Início" Icone={LayoutGrid} clean={clean} onClick={() => router.push('/dashboard')} />
          <MenuNav ativo titulo="Ordens" Icone={ClipboardList} clean={clean} onClick={() => router.push('/ordens')} />
          <MenuNav titulo="Faturam." Icone={CircleDollarSign} clean={clean} onClick={() => router.push('/faturamento')} />
          <MenuNav titulo="Config." Icone={Settings} clean={clean} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL EDIÇÃO */}
      {modalEdicao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[101] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-[32px] p-8 border ${clean ? 'bg-white text-slate-900' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
                <h2 className="text-lg font-black uppercase italic mb-6">Editar OS</h2>
                <div className="space-y-4">
                    <input value={editForm.cliente} onChange={(e) => setEditForm({...editForm, cliente: e.target.value})} placeholder="Cliente" className={`w-full rounded-xl p-3 border outline-none ${clean ? 'bg-slate-50' : 'bg-[#111c2e]'}`} />
                    <input value={editForm.solicitante} onChange={(e) => setEditForm({...editForm, solicitante: e.target.value})} placeholder="Solicitante" className={`w-full rounded-xl p-3 border outline-none ${clean ? 'bg-slate-50' : 'bg-[#111c2e]'}`} />
                    <input value={editForm.maquina} onChange={(e) => setEditForm({...editForm, maquina: e.target.value})} placeholder="Máquina" className={`w-full rounded-xl p-3 border outline-none ${clean ? 'bg-slate-50' : 'bg-[#111c2e]'}`} />
                    <textarea value={editForm.descricao} onChange={(e) => setEditForm({...editForm, descricao: e.target.value})} placeholder="Descrição" className={`w-full rounded-xl p-3 border outline-none min-h-[100px] ${clean ? 'bg-slate-50' : 'bg-[#111c2e]'}`} />
                    <button onClick={salvarEdicaoOS} disabled={salvandoEdicao} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-white shadow-lg flex items-center justify-center">
                        {salvandoEdicao ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                    </button>
                    <button onClick={() => setModalEdicao(false)} className="w-full text-xs font-bold text-slate-500 uppercase mt-2">Fechar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

// --- COMPONENTES AUXILIARES ---

function InfoItem({ Icone, titulo, texto, full, clean }: any) {
  return (
    <div className={`flex gap-3 ${full ? 'col-span-2 mt-2 border-t pt-4 border-slate-500/10' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
        <Icone size={16} />
      </div>
      <div className="min-w-0">
        <p className={`text-[10px] font-black uppercase mb-0.5 ${clean ? 'text-slate-400' : 'opacity-40'}`}>{titulo}</p>
        <p className="text-sm font-bold leading-tight break-words">{texto}</p>
      </div>
    </div>
  )
}

function MenuNav({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 transition-all ${ativo ? 'text-blue-500 scale-110' : clean ? 'text-slate-400' : 'text-slate-500'}`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

function MedidaDetalhe({ label, valor }: { label: string, valor: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-black uppercase opacity-40 leading-none mb-1 flex items-center gap-1">
        <Ruler size={8} /> {label}
      </span>
      <span className="text-xs font-bold">{valor}</span>
    </div>
  )
}

function badgeEstilo(status: string) {
  const base = "text-[10px] font-black px-2 py-0.5 rounded-md border uppercase "
  switch (status) {
    case 'Finalizado': return base + 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
    case 'Cancelado': return base + 'bg-rose-500/10 border-rose-500/20 text-rose-500'
    case 'Parado': return base + 'bg-amber-500/10 border-amber-500/20 text-amber-500'
    default: return base + 'bg-blue-500/10 border-blue-500/20 text-blue-500'
  }
}