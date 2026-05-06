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
    
    const { data: fotosData } = await supabase.from('fotos_os').select('id, url').eq('id_os', id)
    setFotos(fotosData || [])
    
    const { data: upds } = await supabase.from('os_atualizacoes').select('*').eq('ordem_servico_id', id).order('created_at', { ascending: false })
    setAtualizacoes(upds || [])
    
    const { data: mats } = await supabase.from('materiais_os').select('*').eq('id_os', id)
    setMateriais(mats || [])
    
    setCarregando(false)
  }

  async function gerarPDF() {
    if (!ordem) return
    setGerandoPDF(true)

    try {
      // 1. Criar container invisível para o relatório
      const container = document.createElement('div')
      container.id = 'print-container-temp'
      container.style.position = 'fixed'
      container.style.left = '-10000px'
      container.style.top = '0'
      container.style.width = '210mm'
      container.style.backgroundColor = '#ffffff'

      // 2. Montar o HTML do relatório (Estilos Inline para evitar oklch)
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
              <p style="margin: 0 0 5px 0; font-size: 10px; font-weight: bold; color: #2563eb; text-transform: uppercase;">Cliente / Unidade</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${ordem.cliente}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Solicitante: ${ordem.solicitante || 'Não informado'}</p>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 5px 0; font-size: 10px; font-weight: bold; color: #2563eb; text-transform: uppercase;">Equipamento</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${ordem.maquina}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Responsável: ${ordem.usuario_responsavel || 'A definir'}</p>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 12px; font-weight: 800; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; text-transform: uppercase;">Descrição do Serviço</h2>
            <p style="font-size: 12px; line-height: 1.6; color: #374151; background: #fff; padding: 10px; border: 1px solid #f1f5f9;">${ordem.descricao}</p>
          </div>

          ${materiais.length > 0 ? `
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 12px; font-weight: 800; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; text-transform: uppercase;">Materiais Utilizados</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left;">Descrição da Peça / Insumo</th>
                    <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; width: 60px;">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  ${materiais.map(m => `
                    <tr>
                      <td style="border: 1px solid #e2e8f0; padding: 8px;">${m.descricao}</td>
                      <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center; font-weight: bold;">${m.quantidade}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 12px; font-weight: 800; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; text-transform: uppercase;">Fotos da Execução</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              ${fotos.map(f => `
                <div style="border: 1px solid #e2e8f0; padding: 5px; border-radius: 8px; text-align: center; background: #fff;">
                  <img src="${f.url}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px;" crossorigin="anonymous" />
                </div>
              `).join('')}
            </div>
          </div>

          <div style="margin-top: 80px; display: flex; justify-content: space-between; gap: 60px;">
            <div style="flex: 1; text-align: center;">
              <div style="border-top: 1px solid #94a3b8; margin-bottom: 5px;"></div>
              <p style="font-size: 10px; font-weight: bold; color: #64748b; margin: 0;">Assinatura do Técnico / Responsável</p>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="border-top: 1px solid #94a3b8; margin-bottom: 5px;"></div>
              <p style="font-size: 10px; font-weight: bold; color: #64748b; margin: 0;">Assinatura do Cliente / Solicitante</p>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(container)

      // 3. Capturar o canvas do container isolado
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Relatorio_OS_${ordem.numero_os || ordem.id}.pdf`)

      // 4. Limpeza
      document.body.removeChild(container)
    } catch (error) {
      console.error(error)
      alert("Falha ao gerar PDF. Verifique se as imagens estão acessíveis.")
    } finally {
      setGerandoPDF(false)
    }
  }

  // --- FUNÇÕES DE INTERAÇÃO DO APP ---
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
      
      {/* HEADER DA PÁGINA */}
      <header className="pt-6 px-5 max-w-md mx-auto flex items-center justify-between gap-4">
        <button onClick={() => router.back()} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'}`}>
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black uppercase italic tracking-tighter">OS #{ordem?.numero_os || ordem?.id}</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{ordem?.status}</span>
        </div>
        <button 
          onClick={gerarPDF} 
          disabled={gerandoPDF}
          className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {gerandoPDF ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
        </button>
      </header>

      <main className="max-w-md mx-auto px-5 pt-8">
        
        {/* CARD INFORMAÇÕES */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="grid grid-cols-2 gap-6">
            <InfoBox label="Cliente" value={ordem?.cliente} clean={clean} Icon={User} />
            <InfoBox label="Máquina" value={ordem?.maquina} clean={clean} Icon={Monitor} />
            <InfoBox label="Solicitante" value={ordem?.solicitante || '-'} clean={clean} Icon={Users} />
            <InfoBox label="Técnico" value={ordem?.usuario_responsavel || 'Aguardando'} clean={clean} Icon={User} />
            <div className="col-span-2 pt-2">
              <p className="text-[10px] font-black uppercase text-blue-500 mb-2">Descrição do Chamado</p>
              <p className="text-xs font-medium leading-relaxed opacity-70">{ordem?.descricao}</p>
            </div>
          </div>
        </div>

        {/* FOTOS */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[10px] font-black uppercase text-blue-500">Galeria de Campo</h2>
            {subindoFoto && <Loader2 size={16} className="animate-spin text-blue-500" />}
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <label className="flex flex-col items-center justify-center gap-2 p-5 bg-blue-600 rounded-3xl cursor-pointer active:scale-95 transition-transform text-white">
              <Camera size={24} />
              <span className="text-[9px] font-black uppercase">Câmera</span>
              <input type="file" hidden capture="environment" accept="image/*" onChange={handleAddFoto} />
            </label>
            <label className={`flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 border-dashed active:scale-95 transition-transform ${clean ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-600'}`}>
              <ImagePlus size={24} />
              <span className="text-[9px] font-black uppercase">Arquivos</span>
              <input type="file" hidden accept="image/*" onChange={handleAddFoto} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {fotos.map(f => (
              <img key={f.id} src={f.url} className="w-full h-32 object-cover rounded-2xl border-2 border-transparent hover:border-blue-500 transition-colors cursor-pointer" />
            ))}
          </div>
        </div>

        {/* MATERIAIS */}
        <div className="mb-6">
          <button 
            onClick={() => router.push(`/ordens/${id_os}/material`)}
            className="w-full py-5 rounded-[32px] border-2 border-dashed border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/5 transition-colors"
          >
            + Adicionar Peças / Insumos
          </button>
          {materiais.length > 0 && (
            <div className={`mt-4 rounded-[32px] p-6 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
              {materiais.map(m => (
                <div key={m.id} className="flex justify-between items-center py-2 border-b border-slate-500/10 last:border-0">
                  <span className="text-xs font-bold uppercase">{m.descricao}</span>
                  <span className="text-xs font-black text-blue-500">x{m.quantidade}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* NAV INFERIOR FIXA */}
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
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-600/10 text-blue-400'}`}>
        <Icon size={18} />
      </div>
      <div className="overflow-hidden">
        <p className="text-[9px] font-black uppercase opacity-40 mb-0.5 tracking-tighter">{label}</p>
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