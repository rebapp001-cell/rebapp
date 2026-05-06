'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, ClipboardList, User, Monitor, 
  FileText, Camera, Users, LayoutGrid, 
  CircleDollarSign, Settings, CheckCircle2, XCircle, Loader2,
  PlayCircle, PauseCircle, Pencil, Download, X, ImagePlus
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

  // Estados para inputs de status e fotos
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

  async function salvarEdicaoOS() {
    setSalvandoEdicao(true)
    const { error } = await supabase.from('ordens_servico').update({...editForm}).eq('id', ordem.id)
    if (!error) {
      setModalEdicao(false)
      carregarDados()
    }
    setSalvandoEdicao(false)
  }

  async function gerarPDF() {
    if (!ordem) return
    setGerandoPDF(true)

    try {
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-10000px'
      container.style.top = '0'
      container.style.width = '210mm'
      container.style.backgroundColor = '#ffffff'

      container.innerHTML = `
        <div style="padding: 20mm; font-family: Arial, sans-serif; color: #1a1a1a;">
          <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px;">
            <div>
              <h1 style="margin: 0; color: #2563eb; font-size: 26px; font-weight: 900;">RELATÓRIO TÉCNICO</h1>
              <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">Ordem de Serviço: <strong>#${ordem.numero_os || ordem.id}</strong></p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #4b5563;">
              <p style="margin: 0;">Emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
              <p style="margin: 0;">Status: <span style="color: #2563eb; font-weight: bold;">${ordem.status.toUpperCase()}</span></p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 5px 0; font-size: 10px; font-weight: bold; color: #2563eb; text-transform: uppercase;">Cliente</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${ordem.cliente}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Solicitante: ${ordem.solicitante || '-'}</p>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 5px 0; font-size: 10px; font-weight: bold; color: #2563eb; text-transform: uppercase;">Equipamento</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${ordem.maquina}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Responsável: ${ordem.usuario_responsavel || '-'}</p>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 12px; font-weight: 800; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; text-transform: uppercase;">Descrição</h2>
            <p style="font-size: 12px; line-height: 1.6;">${ordem.descricao}</p>
          </div>

          ${materiais.length > 0 ? `
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 12px; font-weight: 800; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; text-transform: uppercase;">Materiais</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <tr style="background: #f1f5f9;">
                  <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left;">Item</th>
                  <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; width: 60px;">Qtd</th>
                </tr>
                ${materiais.map(m => `
                  <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 8px;">${m.descricao}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${m.quantidade}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}

          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 12px; font-weight: 800; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; text-transform: uppercase;">Fotos</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              ${fotos.map(f => `
                <div style="border: 1px solid #e2e8f0; padding: 5px; border-radius: 8px; background: #fff;">
                  <img src="${f.url}" style="width: 100%; height: 180px; object-fit: cover;" crossorigin="anonymous" />
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `
      document.body.appendChild(container)
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width)
      pdf.save(`Relatorio_OS_${ordem.numero_os}.pdf`)
      document.body.removeChild(container)
    } catch (e) { alert("Erro ao gerar PDF profissional.") } finally { setGerandoPDF(false) }
  }

  async function handleAddFoto(e: any) {
    if (!e.target.files?.[0] || !ordem) return
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
    <div className={`min-h-screen pb-24 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      
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
          <button onClick={gerarPDF} disabled={gerandoPDF} className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            {gerandoPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          </button>
          <button onClick={() => setModalEdicao(true)} className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <Pencil size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-8">
        
        {/* CARD PRINCIPAL */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="grid grid-cols-2 gap-6">
            <InfoBox label="Cliente" value={ordem?.cliente} clean={clean} Icon={User} />
            <InfoBox label="Máquina" value={ordem?.maquina} clean={clean} Icon={Monitor} />
            <InfoBox label="Solicitante" value={ordem?.solicitante || '-'} clean={clean} Icon={Users} />
            <InfoBox label="Técnico" value={ordem?.usuario_responsavel || 'Aguardando'} clean={clean} Icon={User} />
            <div className="col-span-2 pt-2">
              <p className="text-[10px] font-black uppercase text-blue-500 mb-2">Descrição</p>
              <p className="text-xs font-medium opacity-70 leading-relaxed">{ordem?.descricao}</p>
            </div>
          </div>
        </div>

        {/* GALERIA */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <h2 className="text-[10px] font-black uppercase text-blue-500 mb-4">Fotos</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <label className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-600 rounded-2xl cursor-pointer text-white">
              <Camera size={20} /><span className="text-[9px] font-black uppercase">Câmera</span>
              <input type="file" hidden capture="environment" accept="image/*" onChange={handleAddFoto} />
            </label>
            <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed ${clean ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-600'}`}>
              <ImagePlus size={20} /><span className="text-[9px] font-black uppercase">Galeria</span>
              <input type="file" hidden accept="image/*" onChange={handleAddFoto} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {fotos.map(f => <img key={f.id} src={f.url} className="w-full h-32 object-cover rounded-2xl" />)}
          </div>
        </div>

        {/* HISTÓRICO */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <h2 className="text-[10px] font-black uppercase text-purple-500 mb-6">Histórico de Atividades</h2>
          <div className="space-y-6">
            {atualizacoes.map((at) => (
              <div key={at.id} className="relative pl-6 border-l-2 border-purple-500/20">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#07111f] border-2 border-purple-500" />
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">
                  {new Date(at.created_at).toLocaleDateString()} às {new Date(at.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <p className="text-xs font-bold text-blue-400 mb-1">{at.tecnicos_responsaveis || at.usuario_nome}</p>
                <p className="text-xs opacity-70 leading-relaxed">{at.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BOTAO MATERIAIS */}
        <button onClick={() => router.push(`/ordens/${id_os}/material`)} className="w-full py-5 rounded-[32px] border-2 border-dashed border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest">+ Peças e Materiais</button>

      </main>

      {/* MODAL EDIÇÃO */}
      {modalEdicao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className={`w-full max-w-sm rounded-[32px] p-8 border ${clean ? 'bg-white text-black' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
            <h2 className="text-lg font-black uppercase mb-6 italic">Editar Dados</h2>
            <div className="space-y-4">
              <input value={editForm.cliente} onChange={e => setEditForm({...editForm, cliente: e.target.value})} className={`w-full p-4 rounded-xl border ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`} placeholder="Cliente" />
              <input value={editForm.solicitante} onChange={e => setEditForm({...editForm, solicitante: e.target.value})} className={`w-full p-4 rounded-xl border ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`} placeholder="Solicitante" />
              <input value={editForm.maquina} onChange={e => setEditForm({...editForm, maquina: e.target.value})} className={`w-full p-4 rounded-xl border ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`} placeholder="Máquina" />
              <textarea value={editForm.descricao} onChange={e => setEditForm({...editForm, descricao: e.target.value})} className={`w-full p-4 rounded-xl border min-h-[100px] ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`} placeholder="Descrição" />
              <button onClick={salvarEdicaoOS} disabled={salvandoEdicao} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase">{salvandoEdicao ? 'Salvando...' : 'Confirmar'}</button>
              <button onClick={() => setModalEdicao(false)} className="w-full text-xs font-bold uppercase opacity-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-4 px-8 flex justify-between items-center z-40 ${clean ? 'bg-white/80 border-slate-200 text-slate-400' : 'bg-[#07111f]/80 border-slate-800 text-slate-600'} backdrop-blur-xl`}>
         <NavIcon Icon={LayoutGrid} onClick={() => router.push('/dashboard')} />
         <NavIcon Icon={ClipboardList} active onClick={() => router.push('/ordens')} />
         <NavIcon Icon={CircleDollarSign} onClick={() => router.push('/faturamento')} />
         <NavIcon Icon={Settings} onClick={() => router.push('/configuracao')} />
      </nav>
    </div>
  )
}

function InfoBox({ label, value, Icon, clean }: any) {
  return (
    <div className="flex gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-600/10 text-blue-400'}`}><Icon size={18} /></div>
      <div className="overflow-hidden">
        <p className="text-[9px] font-black uppercase opacity-40 mb-0.5">{label}</p>
        <p className="text-xs font-bold truncate">{value || '-'}</p>
      </div>
    </div>
  )
}

function NavIcon({ Icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`transition-all ${active ? 'text-blue-500 scale-110' : 'hover:text-blue-400'}`}>
      <Icon size={22} strokeWidth={active ? 3 : 2} />
    </button>
  )
}