'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  LayoutGrid, ClipboardList, CircleDollarSign, Settings,
  Plus, User, Phone, Monitor, FileText,
  Wifi, WifiOff, X, Share2, Loader2, Camera, MapPin, Hash, Edit3, Save
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function OrcamentoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // ESTADOS
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const [form, setForm] = useState({ 
    razao_social: '', solicitante: '', endereco: '', documento: '',
    maquina: '', descricao: '', quantidade: '1', valor_unitario: '',
    desconto: '0', observacao: '', foto_preview: ''
  })

  useEffect(() => {
    carregarOrcamentos()
    const handleStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handleStatus)
    window.addEventListener('offline', handleStatus)
    return () => {
      window.removeEventListener('online', handleStatus)
      window.removeEventListener('offline', handleStatus)
    }
  }, [])

  async function carregarOrcamentos() {
    setCarregando(true)
    const { data } = await supabase.from('orçamentos').select('*').order('created_at', { ascending: false })
    if (data) setOrcamentos(data)
    setCarregando(false)
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setForm({ ...form, foto_preview: reader.result as string })
      reader.readAsDataURL(file)
    }
  }

  async function salvarOrcamento() {
    if (!form.razao_social || !form.valor_unitario) {
      alert('Preencha a Razão Social e o Valor!')
      return
    }
    
    const vUnit = parseFloat(form.valor_unitario) || 0
    const qtd = parseFloat(form.quantidade) || 1
    const desc = parseFloat(form.desconto) || 0
    const vTotal = (vUnit * qtd) - desc

    const dados = {
      cliente: form.razao_social,
      solicitante: form.solicitante,
      endereco: form.endereco,
      documento: form.documento,
      maquina: form.maquina,
      descricao_servico: form.descricao,
      quantidade: qtd,
      valor_unitario: vUnit,
      valor_total: vTotal,
      desconto: desc,
      observacao: form.observacao,
      foto_url: form.foto_preview
    }

    try {
      const { error } = editandoId 
        ? await supabase.from('orçamentos').update(dados).eq('id', editandoId)
        : await supabase.from('orçamentos').insert([dados])

      if (!error) {
        fecharModal()
        carregarOrcamentos()
      } else {
        alert("Erro no Banco: " + error.message)
      }
    } catch (e) {
      alert("Erro ao salvar.")
    }
  }

  function abrirEdicao(orc: any) {
    setEditandoId(orc.id)
    setForm({
      razao_social: orc.cliente || '',
      solicitante: orc.solicitante || '',
      endereco: orc.endereco || '',
      documento: orc.documento || '',
      maquina: orc.maquina || '',
      descricao: orc.descricao_servico || '',
      quantidade: orc.quantidade?.toString() || '1',
      valor_unitario: orc.valor_unitario?.toString() || '',
      desconto: orc.desconto?.toString() || '0',
      observacao: orc.observacao || '',
      foto_preview: orc.foto_url || ''
    })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
    setForm({ 
      razao_social: '', solicitante: '', endereco: '', documento: '',
      maquina: '', descricao: '', quantidade: '1', valor_unitario: '',
      desconto: '0', observacao: '', foto_preview: ''
    })
  }

  async function exportarPDF(orc: any) {
    setGerandoPdf(true)
    const element = document.getElementById(`temp-pdf-${orc.id}`)
    if (!element) return

    element.style.display = 'block'
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
      
      const pdfBlob = pdf.output('blob')
      const file = new File([pdfBlob], `Orcamento_${orc.cliente}.pdf`, { type: 'application/pdf' })

      if (navigator.share) {
        await navigator.share({ files: [file], title: 'Orçamento Divisa' })
      } else {
        pdf.save(`Orcamento_${orc.cliente}.pdf`)
      }
    } catch (err) {
      alert("Erro ao gerar PDF")
    }
    element.style.display = 'none'
    setGerandoPdf(false)
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-20 overflow-x-hidden">
      <main className="max-w-md mx-auto px-4 pt-6">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black italic tracking-tight text-white">ORÇAMENTOS</h1>
            <div className="flex items-center gap-2 opacity-50 text-[10px] font-bold">
              {isOnline ? <Wifi size={10} className="text-emerald-500" /> : <WifiOff size={10} />}
              TORNEARIA DIVISA
            </div>
          </div>
          <button onClick={() => setModalAberto(true)} className="bg-blue-600 p-3 rounded-xl shadow-lg active:scale-90 transition-all">
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-3">
          {carregando ? (
            <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : orcamentos.map((orc) => (
            <div key={orc.id} className="bg-[#0d1726] border border-slate-800 p-4 rounded-2xl relative">
              <div className="flex justify-between mb-2">
                <div onClick={() => abrirEdicao(orc)} className="flex-1 cursor-pointer">
                  <p className="text-[10px] font-black text-blue-500">#{orc.id.toString().slice(-4)}</p>
                  <p className="font-bold uppercase text-xs truncate w-32">{orc.cliente}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirEdicao(orc)} className="p-2 bg-slate-800 rounded-lg text-slate-400"><Edit3 size={16} /></button>
                  <button onClick={() => exportarPDF(orc)} className="p-2 bg-emerald-600 text-white rounded-lg">
                    {gerandoPdf ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <p className="text-[9px] font-bold opacity-30 uppercase">{orc.maquina || 'Geral'}</p>
                <p className="text-lg font-black text-emerald-400 font-mono">R$ {orc.valor_total?.toFixed(2)}</p>
              </div>

              {/* TEMPLATE PDF (EXATAMENTE COMO A IMAGEM FORNECIDA) */}
              <div id={`temp-pdf-${orc.id}`} style={{ display: 'none', width: '210mm', backgroundColor: 'white', color: 'black', padding: '10mm' }}>
                <div style={{ display: 'flex', border: '1px solid black', marginBottom: '5px' }}>
                  <div style={{ width: '35%', padding: '10px', textAlign: 'center', borderRight: '1px solid black' }}>
                    <div style={{ fontSize: '24pt', fontWeight: 'bold', color: '#1a4a8e', fontStyle: 'italic' }}>Divisa</div>
                    <div style={{ fontSize: '8pt', fontWeight: 'bold', letterSpacing: '3px' }}>TORNEARIA</div>
                  </div>
                  <div style={{ width: '65%', backgroundColor: '#1a4a8e', color: 'white', padding: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>TORNEARIA DIVISA COMERCIO E SERVIÇO LTDA</div>
                    <div style={{ fontSize: '7pt' }}>AV. 22, QD. 25, LT. 01 PRIMAVERA DO OESTE, ROSÁRIO-BA</div>
                    <div style={{ fontSize: '7pt' }}>CEL: (62) 99929-2829 | CNPJ: 11.190.449/0001-86</div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#2b5797', color: 'white', textAlign: 'center', padding: '3px', fontSize: '8pt', fontWeight: 'bold' }}>DADOS DO CLIENTE</div>
                <div style={{ border: '1px solid black', fontSize: '8pt', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}><div style={{ width: '20%', background: '#eee', padding: '3px' }}>CLIENTE:</div><div style={{ padding: '3px' }}>{orc.cliente}</div></div>
                    <div style={{ display: 'flex' }}><div style={{ width: '20%', background: '#eee', padding: '3px' }}>MÁQUINA:</div><div style={{ padding: '3px' }}>{orc.maquina}</div></div>
                </div>
                <div style={{ border: '1px solid black', padding: '10px', minHeight: '100px' }}>
                    <p style={{ fontSize: '9pt' }}><b>SERVIÇO:</b> {orc.descricao_servico}</p>
                    <p style={{ fontSize: '10pt', textAlign: 'right', marginTop: '20px' }}><b>TOTAL: R$ {orc.valor_total?.toFixed(2)}</b></p>
                    {orc.foto_url && <img src={orc.foto_url} style={{ maxWidth: '200px', marginTop: '10px' }} />}
                </div>
                <p style={{ textAlign: 'center', fontSize: '8pt', marginTop: '10px' }}>VALIDADE: 7 DIAS</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL RESPONSIVO AJUSTADO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#0d1726] rounded-t-[32px] sm:rounded-[32px] p-6 h-[85vh] sm:h-auto max-h-[90vh] overflow-y-auto border-t sm:border border-slate-700">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#0d1726] py-2 z-10">
              <h2 className="text-lg font-black italic">{editandoId ? 'EDITAR' : 'NOVO'} PROPOSTA</h2>
              <button onClick={fecharModal} className="bg-slate-800 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-4 pb-10">
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFoto} />
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center bg-slate-900/50 overflow-hidden">
                {form.foto_preview ? <img src={form.foto_preview} className="w-full h-full object-cover" /> : <Camera size={24} className="text-blue-500" />}
              </div>

              <div className="grid gap-3">
                <InputIcon Icone={User} placeholder="Razão Social" value={form.razao_social} onChange={(v) => setForm({...form, razao_social: v})} />
                <InputIcon Icone={Monitor} placeholder="Máquina" value={form.maquina} onChange={(v) => setForm({...form, maquina: v})} />
                <InputIcon Icone={Hash} placeholder="CNPJ / CPF" value={form.documento} onChange={(v) => setForm({...form, documento: v})} />
                <textarea className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs h-20 outline-none focus:border-blue-500" placeholder="Descrição do Serviço" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                    <InputIcon Icone={Hash} placeholder="Qtd" value={form.quantidade} onChange={(v) => setForm({...form, quantidade: v})} />
                    <InputIcon Icone={CircleDollarSign} placeholder="Unitário" value={form.valor_unitario} onChange={(v) => setForm({...form, valor_unitario: v})} />
                </div>
                <InputIcon Icone={CircleDollarSign} placeholder="Desconto" value={form.desconto} onChange={(v) => setForm({...form, desconto: v})} />
              </div>

              <button onClick={salvarOrcamento} className="w-full py-4 bg-blue-600 rounded-xl font-bold uppercase text-sm shadow-xl flex items-center justify-center gap-2">
                <Save size={18} />
                {editandoId ? 'Salvar Alterações' : 'Gerar Proposta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU INFERIOR FIXO */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#07111f]/80 backdrop-blur-lg border-t border-slate-800 py-3 z-50">
        <div className="max-w-md mx-auto grid grid-cols-5 text-[9px] font-bold uppercase text-slate-500 text-center">
            <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center gap-1"><LayoutGrid size={18}/>Início</button>
            <button className="flex flex-col items-center gap-1 text-blue-500"><FileText size={18}/>Orçam.</button>
            <button className="flex flex-col items-center gap-1"><ClipboardList size={18}/>Ordens</button>
            <button className="flex flex-col items-center gap-1"><CircleDollarSign size={18}/>Fatur.</button>
            <button className="flex flex-col items-center gap-1"><Settings size={18}/>Config.</button>
        </div>
      </nav>
    </div>
  )
}

// COMPONENTE DE INPUT COM TIPAGEM DEFINIDA (Resolve o erro do VS Code)
function InputIcon({ Icone, placeholder, value, onChange }: { Icone: any, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input 
        className="w-full bg-slate-900 border border-slate-700 py-3 pl-10 pr-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-all text-white" 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  )
}