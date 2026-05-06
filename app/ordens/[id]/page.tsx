'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, ClipboardList, User, Monitor, 
  FileText, Camera, Users, LayoutGrid, 
  CircleDollarSign, Settings, CheckCircle2, XCircle, Loader2,
  PlayCircle, PauseCircle, Pencil, Download, X, ImagePlus,
  Trash2, CheckCircle
} from 'lucide-react'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()
  const id_os = params.id

  const [ordem, setOrdem] = useState<any>(null)
  const [fotos, setFotos] = useState<any[]>([])
  const [atualizacoes, setAtualizacoes] = useState<any[]>([])
  const [materiais, setMateriais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPDF, setGerandoPDF] = useState(false)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  // Estados para Edição
  const [modalEdicao, setModalEdicao] = useState(false)
  const [editForm, setEditForm] = useState({
    cliente: '',
    solicitante: '',
    maquina: '',
    descricao: ''
  })
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  // Estados para inputs de status
  const [tecnicoAtuante, setTecnicoAtuante] = useState('')
  const [atividadeExecutada, setAtividadeExecutada] = useState('')
  const [mostrarCampoAndamento, setMostrarCampoAndamento] = useState(false)
  const [motivoParada, setMotivoParada] = useState('')
  const [mostrarCampoParada, setMostrarCampoParada] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)

  useEffect(() => {
    carregarDados()
    const t = localStorage.getItem('tema-app') as any
    if (t) setTema(t)
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

  async function alterarStatus(novoStatus: string, descricaoTexto: string) {
    if (!descricaoTexto) return alert("Por favor, preencha a descrição.")
    
    try {
      // 1. Atualiza status na tabela principal
      await supabase.from('ordens_servico').update({ status: novoStatus }).eq('id', ordem.id)

      // 2. Insere no histórico
      const { error } = await supabase.from('os_atualizacoes').insert([{
        ordem_servico_id: ordem.id,
        descricao: tecnicoAtuante ? `[${tecnicoAtuante.toUpperCase()}]: ${descricaoTexto}` : descricaoTexto,
        usuario_nome: tecnicoAtuante || 'Técnico',
        tipo_status: novoStatus // Importante para a cor da bolinha
      }])

      if (error) throw error

      setMostrarCampoAndamento(false)
      setMostrarCampoParada(false)
      setAtividadeExecutada('')
      setMotivoParada('')
      setTecnicoAtuante('')
      carregarDados()
    } catch (e) {
      alert("Erro ao salvar atualização no banco.")
    }
  }

  async function finalizarOS() {
    if (!confirm("Deseja realmente finalizar esta OS?")) return
    await supabase.from('ordens_servico').update({ status: 'Finalizada' }).eq('id', ordem.id)
    carregarDados()
  }

  async function cancelarOS() {
    if (!confirm("Deseja realmente cancelar esta OS?")) return
    await supabase.from('ordens_servico').update({ status: 'Cancelada' }).eq('id', ordem.id)
    carregarDados()
  }

  async function gerarPDF() {
    if (!ordem) return
    setGerandoPDF(true)
    try {
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-10000px'
      container.style.width = '210mm'
      container.style.backgroundColor = '#ffffff'
      container.innerHTML = `<div style="padding: 20mm; color: #000;"><h1>Relatório OS #${ordem.id}</h1><p>Cliente: ${ordem.cliente}</p></div>`
      document.body.appendChild(container)
      const canvas = await html2canvas(container, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width)
      pdf.save(`OS_${ordem.id}.pdf`)
      document.body.removeChild(container)
    } catch (e) { alert("Erro PDF") } finally { setGerandoPDF(false) }
  }

  async function handleAddFoto(e: any) {
    if (!e.target.files?.[0]) return
    setSubindoFoto(true)
    const file = e.target.files[0]
    const path = `${ordem.id}/${Date.now()}-${file.name}`
    await supabase.storage.from('os-imagens').upload(path, file)
    const { data: { publicUrl } } = supabase.storage.from('os-imagens').getPublicUrl(path)
    await supabase.from('fotos_os').insert([{ id_os: ordem.id, url: publicUrl }])
    carregarDados()
    setSubindoFoto(false)
  }

  const clean = tema === 'clean'

  if (carregando) return <div className="min-h-screen flex items-center justify-center font-black">CARREGANDO...</div>

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      
      {/* HEADER */}
      <header className="pt-6 px-5 max-w-md mx-auto flex items-center justify-between gap-4">
        <button onClick={() => router.back()} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'}`}>
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black uppercase italic tracking-tighter">OS #{ordem?.numero_os || ordem?.id}</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{ordem?.status}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={gerarPDF} className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Download size={18} /></button>
          <button onClick={() => setModalEdicao(true)} className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Pencil size={18} /></button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-8">
        
        {/* CARD INFORMAÇÕES */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="grid grid-cols-2 gap-6">
            <InfoBox label="Cliente" value={ordem?.cliente} clean={clean} Icon={User} />
            <InfoBox label="Máquina" value={ordem?.maquina} clean={clean} Icon={Monitor} />
            <div className="col-span-2 pt-2">
              <p className="text-[10px] font-black uppercase text-blue-500 mb-2 tracking-widest">Descrição Inicial</p>
              <p className="text-xs font-medium opacity-70 leading-relaxed">{ordem?.descricao}</p>
            </div>
          </div>
        </div>

        {/* STATUS CONTROLS - CINZA POR PADRÃO */}
        <div className="grid grid-cols-2 gap-3 mb-4">
            <button 
              onClick={() => { setMostrarCampoAndamento(true); setMostrarCampoParada(false); }}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${ordem?.status === 'Em Andamento' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-500/20 text-slate-500'}`}
            >
              <PlayCircle size={18} /> Em Andamento
            </button>
            <button 
              onClick={() => { setMostrarCampoParada(true); setMostrarCampoAndamento(false); }}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${ordem?.status === 'Parado' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-500/20 text-slate-500'}`}
            >
              <PauseCircle size={18} /> Parar Serviço
            </button>
        </div>

        {/* FORMULÁRIO DINÂMICO DE STATUS */}
        {mostrarCampoAndamento && (
          <div className={`mb-6 p-5 rounded-3xl border-2 border-blue-500/30 ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <input value={tecnicoAtuante} onChange={e => setTecnicoAtuante(e.target.value)} className="w-full p-4 rounded-xl text-xs mb-2 bg-black/20 border border-white/10" placeholder="Nome do Técnico" />
            <textarea value={atividadeExecutada} onChange={e => setAtividadeExecutada(e.target.value)} className="w-full p-4 rounded-xl text-xs mb-3 bg-black/20 border border-white/10" placeholder="Atividade realizada..." />
            <button onClick={() => alterarStatus('Em Andamento', atividadeExecutada)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase">Confirmar Andamento</button>
          </div>
        )}

        {mostrarCampoParada && (
          <div className={`mb-6 p-5 rounded-3xl border-2 border-amber-500/30 ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <textarea value={motivoParada} onChange={e => setMotivoParada(e.target.value)} className="w-full p-4 rounded-xl text-xs mb-3 bg-black/20 border border-white/10" placeholder="Motivo da pausa..." />
            <button onClick={() => alterarStatus('Parado', motivoParada)} className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase">Confirmar Parada</button>
          </div>
        )}

        {/* GALERIA */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <h2 className="text-[10px] font-black uppercase text-blue-500 mb-4 tracking-tighter">Fotos de Campo</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-600 rounded-2xl cursor-pointer text-white">
              <Camera size={20} /><span className="text-[9px] font-black uppercase">Câmera</span>
              <input type="file" hidden capture="environment" accept="image/*" onChange={handleAddFoto} />
            </label>
            <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed ${clean ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-600'}`}>
              <ImagePlus size={20} /><span className="text-[9px] font-black uppercase">Galeria</span>
              <input type="file" hidden accept="image/*" onChange={handleAddFoto} />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {fotos.map(f => <img key={f.id} src={f.url} className="w-full h-20 object-cover rounded-xl" />)}
          </div>
        </div>

        {/* PEÇAS E MATERIAIS - ACIMA DO HISTÓRICO */}
        <button 
            onClick={() => router.push(`/ordens/${id_os}/material`)} 
            className="w-full py-5 mb-6 rounded-[32px] border-2 border-dashed border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          + Adicionar Peças / Materiais
        </button>

        {/* HISTÓRICO COM CORES NAS BOLINHAS */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <h2 className="text-[10px] font-black uppercase text-purple-500 mb-6 italic tracking-widest">Linha do Tempo</h2>
          <div className="space-y-6">
            {atualizacoes.map((at) => {
              const isParado = at.tipo_status === 'Parado';
              return (
                <div key={at.id} className={`relative pl-6 border-l-2 ${isParado ? 'border-amber-500/20' : 'border-blue-500/20'}`}>
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#07111f] border-2 ${isParado ? 'border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                  <p className="text-[9px] font-black uppercase opacity-40 mb-1">{new Date(at.created_at).toLocaleString()}</p>
                  <p className="text-xs opacity-80 leading-relaxed font-medium italic">"{at.descricao}"</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* AÇÕES FINAIS - NO FUNDO DA PÁGINA */}
        <div className="grid grid-cols-2 gap-3 mb-10">
            <button onClick={finalizarOS} className="flex items-center justify-center gap-2 py-5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-3xl font-black text-[10px] uppercase">
              <CheckCircle size={18} /> Finalizar OS
            </button>
            <button onClick={cancelarOS} className="flex items-center justify-center gap-2 py-5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-3xl font-black text-[10px] uppercase">
              <Trash2 size={18} /> Cancelar OS
            </button>
        </div>
      </main>

      {/* MODAL EDIÇÃO */}
      {modalEdicao && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-white">
          <div className="w-full max-w-sm bg-[#0d1726] p-8 rounded-[40px] border border-white/10">
             <h2 className="text-lg font-black uppercase mb-6 italic">Editar OS</h2>
             <div className="space-y-4">
                <input value={editForm.cliente} onChange={e => setEditForm({...editForm, cliente: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10" placeholder="Cliente" />
                <input value={editForm.maquina} onChange={e => setEditForm({...editForm, maquina: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10" placeholder="Máquina" />
                <textarea value={editForm.descricao} onChange={e => setEditForm({...editForm, descricao: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 min-h-[100px]" placeholder="Descrição" />
                <button onClick={salvarEdicaoOS} className="w-full py-4 bg-blue-600 rounded-2xl font-black uppercase">Salvar</button>
                <button onClick={() => setModalEdicao(false)} className="w-full text-xs font-bold opacity-50">Voltar</button>
             </div>
          </div>
        </div>
      )}

      {/* NAV INFERIOR RESTAURADA */}
      <footer className={`fixed bottom-0 left-0 right-0 border-t py-4 px-6 flex justify-around items-center z-40 ${clean ? 'bg-white/80 border-slate-200' : 'bg-[#07111f]/80 border-slate-800'} backdrop-blur-xl`}>
        <NavItem Icon={LayoutGrid} label="Início" onClick={() => router.push('/dashboard')} />
        <NavItem Icon={ClipboardList} label="Ordens" active onClick={() => router.push('/ordens')} />
        <NavItem Icon={CircleDollarSign} label="Faturas" onClick={() => router.push('/faturamento')} />
        <NavItem Icon={Settings} label="Ajustes" onClick={() => router.push('/configuracao')} />
      </footer>
    </div>
  )

  async function salvarEdicaoOS() {
    setSalvandoEdicao(true)
    await supabase.from('ordens_servico').update({...editForm}).eq('id', ordem.id)
    setModalEdicao(false)
    carregarDados()
    setSalvandoEdicao(false)
  }
}

// COMPONENTES AUXILIARES
function NavItem({ Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-500 scale-110' : 'text-slate-500'}`}>
      <Icon size={20} strokeWidth={active ? 3 : 2} />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  )
}

function InfoBox({ label, value, Icon, clean }: any) {
  return (
    <div className="flex gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-600/10 text-blue-400'}`}><Icon size={18} /></div>
      <div className="overflow-hidden">
        <p className="text-[9px] font-black uppercase opacity-40 mb-0.5">{label}</p>
        <p className="text-xs font-bold truncate tracking-tight">{value || '-'}</p>
      </div>
    </div>
  )
}