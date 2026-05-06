'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, ClipboardList, User, Monitor, 
  FileText, Camera, Users, LayoutGrid, 
  CircleDollarSign, Settings, CheckCircle2, XCircle, Loader2,
  PlayCircle, PauseCircle, Pencil, Download, X, ImagePlus,
  Calendar, Package, Clock
} from 'lucide-react'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()
  const id_os = params.id
  const printRef = useRef<HTMLDivElement>(null)

  const [ordem, setOrdem] = useState<any>(null)
  const [fotos, setFotos] = useState<any[]>([])
  const [atualizacoes, setAtualizacoes] = useState<any[]>([])
  const [materiais, setMateriais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [gerandoPDF, setGerandoPDF] = useState(false)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)

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
    
    // Pequeno delay para garantir que imagens externas carreguem
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      const element = printRef.current
      // Tornamos o elemento temporariamente visível para o html2canvas mas fora da tela
      element.style.display = 'block'
      element.style.position = 'absolute'
      element.style.left = '-9999px'

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 800 // Largura fixa para manter a proporção do modelo da imagem image_784db2.jpg
      })

      element.style.display = 'none' // Esconde de volta

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Relatorio_OS_${ordem?.numero_os || id_os}.pdf`)
    } catch (error) {
      console.error(error)
      alert("Erro ao gerar PDF")
    } finally {
      setGerandoPDF(false)
    }
  }

  const clean = tema === 'clean'

  if (carregando) return <div className="min-h-screen flex items-center justify-center font-bold">Carregando...</div>

  return (
    <div className={`min-h-screen pb-32 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      
      {/* --- INTERFACE DO APP (O QUE VOCÊ VÊ NO CELULAR) --- */}
      <div className="max-w-md mx-auto px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/ordens')} className="p-3 rounded-xl border border-slate-700 bg-[#0d1726]">
            <ChevronLeft size={24} />
          </button>
          <button onClick={gerarPDF} disabled={gerandoPDF} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs">
            {gerandoPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Gerar Relatório PDF
          </button>
        </div>

        {/* Resumo visual rápido no App */}
        <div className="bg-[#0d1726] p-6 rounded-3xl border border-slate-800">
            <h1 className="text-xl font-black italic">OS #{ordem?.numero_os}</h1>
            <p className="opacity-50 text-sm mb-4">{ordem?.cliente}</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="opacity-40 uppercase font-black mb-1">Status</p>
                    <p className="font-bold">{ordem?.status}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="opacity-40 uppercase font-black mb-1">Data</p>
                    <p className="font-bold">{new Date(ordem?.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
        <p className="text-center mt-6 text-[10px] opacity-30 uppercase font-black">As fotos e materiais aparecerão no PDF formatado.</p>
      </div>

      {/* --- TEMPLATE DO PDF (ESCONDIDO NA TELA, IGUAL AO MODELO image_784db2.jpg) --- */}
      <div ref={printRef} style={{ display: 'none', width: '800px' }} className="bg-white text-slate-900">
        
        {/* Cabeçalho Escuro */}
        <header className="bg-[#001529] text-white p-10 rounded-b-[50px] flex justify-between items-start relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-10 h-10 bg-yellow-500 rounded flex items-center justify-center text-black font-black text-xl">D</div>
               <span className="text-2xl font-black uppercase italic tracking-tighter">Divisa <span className="text-yellow-500 text-[10px] block -mt-2">TORNEARIA</span></span>
            </div>
            <h1 className="text-3xl font-black uppercase mb-1">Relatório de Serviço</h1>
            <p className="opacity-50 text-xs font-bold uppercase mb-4 tracking-widest">Ordem de Serviço</p>
            <h2 className="text-5xl font-black text-blue-400 mb-6 italic">OS #{ordem?.numero_os || ordem?.id}</h2>
            <div className="bg-emerald-600 px-6 py-2 rounded-full inline-block text-xs font-black uppercase italic">
              {ordem?.status}
            </div>
          </div>

          <div className="z-10 text-right space-y-8 pt-4">
            <div className="flex items-center justify-end gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Data</p>
                <p className="text-lg font-black">{new Date(ordem?.created_at).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl"><Calendar className="text-blue-400" size={28} /></div>
            </div>
            <div className="flex items-center justify-end gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Técnico Responsável</p>
                <p className="text-lg font-black">{ordem?.usuario_responsavel || 'Jackson'}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl"><User className="text-blue-400" size={28} /></div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 rounded-bl-full pointer-events-none"></div>
        </header>

        <div className="p-12">
          {/* Seção Dados */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 pb-3">
              <ClipboardList size={22} className="text-blue-600" />
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Dados da Ordem de Serviço</h3>
            </div>
            <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
              <ItemRelatorio Icone={User} label="Cliente" valor={ordem?.cliente} />
              <ItemRelatorio Icone={Monitor} label="Máquina" valor={ordem?.maquina} />
              <ItemRelatorio Icone={Users} label="Solicitante" valor={ordem?.solicitante || 'NÃO INFORMADO'} />
              <ItemRelatorio Icone={User} label="Técnico" valor={ordem?.usuario_responsavel || 'Jackson'} />
              <div className="col-span-2 mt-4 pt-6 border-t border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Descrição</p>
                <p className="text-sm font-bold leading-relaxed text-slate-700">{ordem?.descricao}</p>
              </div>
            </div>
          </div>

          {/* Fotos e Materiais */}
          <div className="grid grid-cols-5 gap-10 mb-12">
            <div className="col-span-3">
              <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 pb-3">
                <Camera size={22} className="text-blue-600" />
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Fotos de Campo</h3>
              </div>
              <div className="space-y-4">
                {fotos.length > 0 ? (
                    <img src={fotos[0].url} crossOrigin="anonymous" className="w-full h-80 object-cover rounded-[40px] shadow-lg border-4 border-white" />
                ) : (
                    <div className="w-full h-40 bg-slate-100 rounded-[40px] flex items-center justify-center text-slate-300 italic font-bold">Sem fotos registradas</div>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 pb-3">
                <Package size={22} className="text-blue-600" />
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Peças / Materiais</h3>
              </div>
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-8 min-h-[200px]">
                {materiais.map(m => (
                  <div key={m.id} className="flex justify-between items-center mb-4 last:mb-0">
                    <span className="text-xs font-black uppercase text-slate-600">{m.descricao}</span>
                    <span className="text-sm font-black text-blue-600">x{m.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 pb-3">
              <Clock size={22} className="text-blue-600" />
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Histórico</h3>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-[40px] space-y-4">
              {atualizacoes.slice(0, 3).map(at => (
                <div key={at.id} className="flex gap-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-[10px] font-black text-purple-600 uppercase">{new Date(at.created_at).toLocaleDateString()} - {at.tecnicos_responsaveis || 'Jackson'}</p>
                    <p className="text-xs font-bold uppercase text-slate-700">{at.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assinatura */}
          <div className="flex justify-end">
            <div className="w-80 border-2 border-slate-100 p-8 rounded-[40px] text-center">
               <p className="text-xs font-black uppercase mb-10 text-slate-400">Recebido por</p>
               <div className="border-b-2 border-slate-200 w-full mb-3"></div>
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Data: ___ / ___ / ___</p>
            </div>
          </div>
        </div>

        {/* Rodapé institucional */}
        <footer className="bg-slate-900 text-white p-8 rounded-t-[50px] flex justify-between items-center mt-10">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-black font-black text-xs">D</div>
              <span className="text-sm font-black uppercase italic">Divisa Tornearia</span>
           </div>
           <p className="text-[10px] font-bold opacity-50 max-w-[250px] text-right uppercase">
             Obrigado por confiar em nosso trabalho! Qualidade e segurança em cada serviço.
           </p>
        </footer>
      </div>
    </div>
  )
}

function ItemRelatorio({ Icone, label, valor }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm shrink-0 text-blue-600">
        <Icone size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-black uppercase text-slate-800">{valor || '-'}</p>
      </div>
    </div>
  )
}