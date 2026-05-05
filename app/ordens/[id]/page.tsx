'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, ClipboardList, User, Monitor, 
  FileText, Camera, Users, LayoutGrid, 
  CircleDollarSign, Settings, CheckCircle2, XCircle, Loader2, FolderOpen,
  PlayCircle, PauseCircle, Pencil, Ruler, Download
} from 'lucide-react'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
  const printRef = useRef<HTMLDivElement>(null)

  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [fotos, setFotos] = useState<FotoOS[]>([])
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [perfilUsuario, setPerfilUsuario] = useState<string | null>(null)
  
  const [tecnicoAtuante, setTecnicoAtuante] = useState('')
  const [atividadeExecutada, setAtividadeExecutada] = useState('')
  const [mostrarCampoAndamento, setMostrarCampoAndamento] = useState(false)
  
  const [motivoParada, setMotivoParada] = useState('')
  const [mostrarCampoParada, setMostrarCampoParada] = useState(false)
  const [gerandoPDF, setGerandoPDF] = useState(false)

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
    const { data: osData } = await supabase.from('ordens_servico').select('*').eq('id', id).single()
    if (!osData) return setCarregando(false)
    
    setOrdem(osData)
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

    const { data: mats } = await supabase.from('materiais_os').select('*').eq('id_os', id)
    setMateriais(mats || [])

    setCarregando(false)
  }

  async function gerarPDF() {
    if (!printRef.current) return
    setGerandoPDF(true)
    try {
      const element = printRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: tema === 'clean' ? '#f8fafc' : '#07111f',
        ignoreElements: (el) => el.classList.contains('no-print')
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`OS_${ordem?.numero_os || id_os}.pdf`)
    } catch (error) {
      alert("Erro ao gerar PDF")
    } finally {
      setGerandoPDF(false)
    }
  }

  async function atualizarStatusExecucao(novoStatus: string) {
    if (!ordem) return
    if (novoStatus === 'Em andamento' && !mostrarCampoAndamento) {
        setMostrarCampoAndamento(true); setMostrarCampoParada(false); return 
    }
    if (novoStatus === 'Parado' && !mostrarCampoParada) {
        setMostrarCampoParada(true); setMostrarCampoAndamento(false); return 
    }

    const { error } = await supabase.from('ordens_servico').update({ 
      status: novoStatus,
      motivo_parada: novoStatus === 'Parado' ? motivoParada : null,
      usuario_responsavel: novoStatus === 'Em andamento' ? tecnicoAtuante : ordem.usuario_responsavel
    }).eq('id', ordem.id)

    if (!error) {
      await supabase.from('os_atualizacoes').insert([{
        ordem_servico_id: ordem.id,
        descricao: novoStatus === 'Em andamento' ? `INICIO: ${atividadeExecutada}` : `PARADA: ${motivoParada}`,
        tecnicos_responsaveis: novoStatus === 'Em andamento' ? tecnicoAtuante : null,
        usuario_nome: 'SISTEMA'
      }])
      setMostrarCampoParada(false); setMostrarCampoAndamento(false); carregarDados()
    }
  }

  async function salvarEdicaoOS() {
    if (!ordem) return
    setSalvandoEdicao(true)
    const { error } = await supabase.from('ordens_servico').update({...editForm}).eq('id', ordem.id)
    if (!error) { setModalEdicao(false); carregarDados(); }
    setSalvandoEdicao(false)
  }

  async function handleAddFoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !ordem) return
    const file = e.target.files[0]
    const nomeArquivo = `${ordem.id}/${Date.now()}-${file.name}`
    await supabase.storage.from('os-imagens').upload(nomeArquivo, file)
    const { data: { publicUrl } } = supabase.storage.from('os-imagens').getPublicUrl(nomeArquivo)
    await supabase.from('fotos_os').insert([{ id_os: ordem.id, url: publicUrl }])
    carregarDados()
  }

  async function alterarStatus(novoStatus: string) {
    if (!ordem || !confirm(`Deseja alterar para ${novoStatus}?`)) return
    await supabase.from('ordens_servico').update({ status: novoStatus, cancelada: novoStatus === 'Cancelado' }).eq('id', ordem.id)
    carregarDados()
  }

  const clean = tema === 'clean'
  const encerrada = ordem?.status === 'Finalizado' || ordem?.status === 'Cancelado'

  if (carregando) return <div className="min-h-screen flex items-center justify-center font-bold">Carregando...</div>

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      
      <div ref={printRef} className="pt-6">
        <main className="max-w-md mx-auto px-5">
          
          {/* HEADER */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <button onClick={() => router.push('/ordens')} className={`w-12 h-12 rounded-2xl flex items-center justify-center border no-print ${clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-black uppercase italic tracking-tighter">OS #{ordem?.numero_os ?? ordem?.id}</h1>
              <span className={badgeEstilo(ordem?.status || '')}>{ordem?.status}</span>
            </div>
            <div className="no-print flex gap-2">
              <button onClick={gerarPDF} disabled={gerandoPDF} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-500/10 rounded-xl">
                {gerandoPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </button>
              <button onClick={() => setModalEdicao(true)} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-500/10 rounded-xl"><Pencil size={18} /></button>
            </div>
          </div>

          {/* CONTROLE DE OPERAÇÃO - NO-PRINT */}
          {!encerrada && (
            <section className={`no-print mb-6 p-4 rounded-3xl border ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-800'}`}>
              <div className="flex gap-2">
                <button onClick={() => atualizarStatusExecucao('Em andamento')} className={`flex-1 py-4 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase ${ordem?.status === 'Em andamento' ? 'bg-blue-600 text-white border-blue-400' : clean ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  <PlayCircle size={18} /> Andamento
                </button>
                <button onClick={() => atualizarStatusExecucao('Parado')} className={`flex-1 py-4 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase ${ordem?.status === 'Parado' ? 'bg-amber-500 text-white border-amber-400' : clean ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  <PauseCircle size={18} /> Parar
                </button>
              </div>

              {mostrarCampoAndamento && (
                <div className="mt-4 space-y-3">
                  <input value={tecnicoAtuante} onChange={e => setTecnicoAtuante(e.target.value)} placeholder="Técnico" className={`w-full p-3 rounded-xl border ${clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'}`} />
                  <textarea value={atividadeExecutada} onChange={e => setAtividadeExecutada(e.target.value)} placeholder="Atividade" className={`w-full p-3 rounded-xl border ${clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'}`} />
                  <button onClick={() => atualizarStatusExecucao('Em andamento')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px]">Confirmar Início</button>
                </div>
              )}
              {mostrarCampoParada && (
                <div className="mt-4 space-y-3">
                  <textarea value={motivoParada} onChange={e => setMotivoParada(e.target.value)} placeholder="Motivo da parada" className={`w-full p-3 rounded-xl border ${clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'}`} />
                  <button onClick={() => atualizarStatusExecucao('Parado')} className="w-full py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px]">Confirmar Parada</button>
                </div>
              )}
            </section>
          )}

          {/* INFOS */}
          <div className={`rounded-3xl p-6 mb-5 border ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'}`}>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <InfoItem clean={clean} Icone={User} titulo="Cliente" texto={ordem?.cliente} />
              <InfoItem clean={clean} Icone={Monitor} titulo="Máquina" texto={ordem?.maquina} />
              <InfoItem clean={clean} Icone={Users} titulo="Solicitante" texto={ordem?.solicitante || '-'} />
              <InfoItem clean={clean} Icone={User} titulo="Técnico" texto={ordem?.usuario_responsavel || '-'} />
              <InfoItem clean={clean} Icone={FileText} titulo="Descrição" texto={ordem?.descricao} full />
            </div>
          </div>

          {/* FOTOS */}
          <div className={`rounded-3xl p-6 mb-5 border ${clean ? 'bg-white' : 'bg-[#0d1726] border-slate-800'}`}>
            <h2 className="text-[10px] font-black uppercase mb-4 text-blue-500">Fotos de Campo</h2>
            <div className="no-print mb-4">
               <label className="w-full py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase cursor-pointer"><Camera size={14}/> Tirar Foto<input type="file" hidden capture="environment" onChange={handleAddFoto} /></label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fotos.map(f => <img key={f.id} src={f.url} className="w-full h-32 object-cover rounded-xl" />)}
            </div>
          </div>

          {/* MATERIAIS */}
          <div className="mb-5">
            <button onClick={() => router.push(`/ordens/${id_os}/material`)} className="no-print w-full py-4 mb-4 border-2 border-dashed border-blue-500/20 rounded-2xl text-blue-400 font-black uppercase text-[10px]">Adicionar Materiais</button>
            {materiais.length > 0 && (
              <div className={`rounded-3xl p-6 border ${clean ? 'bg-white' : 'bg-[#0d1726] border-slate-800'}`}>
                <h2 className="text-[10px] font-black uppercase mb-4">Peças / Materiais</h2>
                {materiais.map(m => (
                  <div key={m.id} className="mb-3 pb-3 border-b border-white/5 last:border-0">
                    <p className="text-xs font-bold uppercase">{m.descricao} <span className="text-blue-500 ml-1">x{m.quantidade}</span></p>
                    <p className="text-[9px] opacity-40 uppercase">{m.tipo?.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTÓRICO */}
          <div className={`rounded-3xl p-6 mb-10 border ${clean ? 'bg-white' : 'bg-[#0d1726] border-slate-800'}`}>
            <h2 className="text-[10px] font-black uppercase mb-6 text-purple-500">Histórico</h2>
            <div className="space-y-5">
                {atualizacoes.map(at => (
                  <div key={at.id} className="border-l-2 border-purple-500/30 pl-4">
                    <p className="text-[9px] font-black uppercase opacity-40">{new Date(at.created_at).toLocaleDateString()} - {at.tecnicos_responsaveis || at.usuario_nome}</p>
                    <p className="text-xs font-medium mt-1">{at.descricao}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* AÇÕES - NO-PRINT */}
          {!encerrada && (
            <div className="no-print grid grid-cols-2 gap-4 mb-10">
              <button onClick={() => alterarStatus('Cancelado')} className="p-4 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase flex flex-col items-center gap-2"><XCircle size={20}/> Cancelar</button>
              <button onClick={() => alterarStatus('Finalizado')} className="p-4 rounded-3xl bg-emerald-500 text-white text-[10px] font-black uppercase flex flex-col items-center gap-2"><CheckCircle2 size={20}/> Finalizar</button>
            </div>
          )}
        </main>
      </div>

      {/* MENU - NO-PRINT (BOTÃO CONFIGURAÇÃO ADICIONADO) */}
      <nav className={`no-print fixed bottom-0 left-0 right-0 border-t py-4 px-6 z-50 ${clean ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#07111f] border-slate-800 text-white'}`}>
        <div className="max-w-md mx-auto flex justify-between items-center">
            <MenuNav titulo="Home" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
            <MenuNav ativo titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
            <MenuNav titulo="Faturas" Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
            <MenuNav titulo="Ajustes" Icone={Settings} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL EDIÇÃO */}
      {modalEdicao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-[32px] p-8 border ${clean ? 'bg-white text-black' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
                <h2 className="text-lg font-black uppercase mb-6 italic">Editar OS</h2>
                <div className="space-y-4">
                    <input value={editForm.cliente} onChange={e => setEditForm({...editForm, cliente: e.target.value})} className={`w-full p-3 rounded-xl border ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`} placeholder="Cliente" />
                    <input value={editForm.maquina} onChange={e => setEditForm({...editForm, maquina: e.target.value})} className={`w-full p-3 rounded-xl border ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`} placeholder="Máquina" />
                    <textarea value={editForm.descricao} onChange={e => setEditForm({...editForm, descricao: e.target.value})} className={`w-full p-3 rounded-xl border min-h-[100px] ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`} placeholder="Descrição" />
                    <button onClick={salvarEdicaoOS} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase">{salvandoEdicao ? 'Salvando...' : 'Salvar'}</button>
                    <button onClick={() => setModalEdicao(false)} className="w-full text-xs font-bold uppercase mt-2 opacity-50">Fechar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ Icone, titulo, texto, full, clean }: any) {
  return (
    <div className={`${full ? 'col-span-2' : ''} flex gap-3`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}><Icone size={16}/></div>
      <div>
        <p className="text-[9px] font-black uppercase opacity-40">{titulo}</p>
        <p className="text-xs font-bold leading-tight">{texto}</p>
      </div>
    </div>
  )
}

function MenuNav({ titulo, Icone, ativo, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${ativo ? 'text-blue-500' : 'text-slate-500'}`}>
      <Icone size={20}/><span className="text-[9px] font-black uppercase">{titulo}</span>
    </button>
  )
}

function badgeEstilo(status: string) {
  const base = "text-[9px] font-black px-2 py-0.5 rounded border uppercase "
  if (status === 'Finalizado') return base + 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
  if (status === 'Cancelado') return base + 'bg-rose-500/10 border-rose-500/20 text-rose-500'
  if (status === 'Parado') return base + 'bg-amber-500/10 border-amber-500/20 text-amber-500'
  return base + 'bg-blue-500/10 border-blue-500/20 text-blue-500'
}