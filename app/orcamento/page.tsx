'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  LayoutGrid, ClipboardList, CircleDollarSign, Settings,
  Plus, Save, User, Phone, Monitor, FileText,
  Wifi, WifiOff, X, Share2, Loader2, Camera, MapPin, Hash, Edit3
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function OrcamentoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // ESTADOS DO SISTEMA
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // ESTADO DO FORMULÁRIO (TODOS OS CAMPOS DA IMAGEM)
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
    if (!form.razao_social || !form.valor_unitario) return alert('Razão Social e Valor são obrigatórios!')
    
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

    const { error } = editandoId 
      ? await supabase.from('orçamentos').update(dados).eq('id', editandoId)
      : await supabase.from('orçamentos').insert([dados])

    if (!error) {
      fecharModal()
      carregarOrcamentos()
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
    <div className="min-h-screen bg-[#07111f] text-white pb-32">
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER DA PÁGINA (TEMA DARK - SEM ALTERAÇÃO) */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">ORÇAMENTOS</h1>
            <div className="flex items-center gap-2 opacity-50 text-[10px] font-bold">
              {isOnline ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} />}
              TORNEARIA DIVISA
            </div>
          </div>
          <button onClick={() => setModalAberto(true)} className="bg-blue-600 p-4 rounded-2xl shadow-lg active:scale-90 transition-all">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* LISTA DE CARDS */}
        <div className="space-y-4">
          {carregando ? (
            <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : orcamentos.map((orc) => (
            <div key={orc.id} className="bg-[#0d1726] border border-slate-800 p-5 rounded-4xl relative group">
              <div className="flex justify-between mb-4">
                <div onClick={() => abrirEdicao(orc)} className="flex-1 cursor-pointer">
                  <p className="text-xs font-black text-blue-500 mb-1">PROPOSTA #{orc.id.toString().slice(-4)}</p>
                  <p className="font-bold uppercase text-sm truncate w-40">{orc.cliente}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirEdicao(orc)} className="p-2 bg-slate-800 rounded-full text-slate-400"><Edit3 size={18} /></button>
                  <button onClick={() => exportarPDF(orc)} className="p-2 bg-emerald-500 text-white rounded-full"><Share2 size={18} /></button>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="text-[10px] font-bold opacity-40 uppercase">
                  <p>{orc.maquina || 'Serviço Geral'}</p>
                  <p>{new Date(orc.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-xl font-black text-emerald-400">R$ {orc.valor_total?.toFixed(2)}</p>
              </div>

              {/* TEMPLATE PDF OCULTO (ESTRUTURA FIEL À IMAGEM) */}
              <div id={`temp-pdf-${orc.id}`} style={{ display: 'none', width: '210mm', backgroundColor: 'white', color: 'black', padding: '10mm', fontFamily: 'Arial' }}>
                <div style={{ display: 'flex', border: '1px solid black', marginBottom: '5px' }}>
                  <div style={{ width: '35%', padding: '15px', textAlign: 'center', borderRight: '1px solid black' }}>
                    <div style={{ fontSize: '28pt', fontWeight: 'bold', color: '#1a4a8e', fontStyle: 'italic' }}>Divisa</div>
                    <div style={{ fontSize: '8pt', fontWeight: 'bold', letterSpacing: '3px' }}>TORNEARIA</div>
                  </div>
                  <div style={{ width: '65%', backgroundColor: '#1a4a8e', color: 'white', padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>TORNEARIA DIVISA COMERCIO E SERVIÇO LTDA</div>
                    <div style={{ fontSize: '7pt', marginTop: '5px' }}>AV. 22, QD. 25, LT. 01 PRIMAVERA DO OESTE, ROSÁRIO-BA | CNPJ: 11.190.449/0001-86</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#2b5797', color: 'white', textAlign: 'center', fontSize: '8pt', fontWeight: 'bold', padding: '3px', border: '1px solid black' }}>DADOS DO CLIENTE</div>
                <div style={{ border: '1px solid black', borderTop: 'none', fontSize: '8pt' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid black' }}><div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '4px' }}>RAZÃO SOCIAL:</div><div style={{ padding: '4px' }}>{orc.cliente}</div></div>
                  <div style={{ display: 'flex', borderBottom: '1px solid black' }}><div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '4px' }}>ENDEREÇO:</div><div style={{ padding: '4px' }}>{orc.endereco}</div></div>
                  <div style={{ display: 'flex' }}><div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '4px' }}>CNPJ/CPF:</div><div style={{ padding: '4px' }}>{orc.documento}</div></div>
                </div>

                <div style={{ backgroundColor: '#2b5797', color: 'white', textAlign: 'center', fontSize: '8pt', fontWeight: 'bold', padding: '3px', border: '1px solid black', marginTop: '5px' }}>ORÇAMENTO</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', border: '1px solid black' }}>
                  <thead style={{ backgroundColor: '#a6a6a6' }}>
                    <tr>
                      <th style={{ border: '1px solid black', padding: '5px' }}>DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                      <th style={{ border: '1px solid black', padding: '5px' }}>QUANT.</th>
                      <th style={{ border: '1px solid black', padding: '5px' }}>UNITÁRIO</th>
                      <th style={{ border: '1px solid black', padding: '5px' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid black', padding: '10px', height: '60px' }}>{orc.descricao_servico}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center' }}>{orc.quantidade}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center' }}>R$ {orc.valor_unitario?.toFixed(2)}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center' }}>R$ {(orc.valor_unitario * orc.quantidade).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', border: '1px solid black', marginTop: '5px' }}>
                  <div style={{ width: '70%', padding: '10px' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 'bold' }}>OBSERVAÇÕES:</p>
                    <p style={{ fontSize: '8pt' }}>{orc.observacao}</p>
                    {orc.foto_url && <img src={orc.foto_url} style={{ maxHeight: '120px', marginTop: '10px' }} />}
                  </div>
                  <div style={{ width: '30%', borderLeft: '1px solid black' }}>
                    <div style={{ display: 'flex', backgroundColor: '#2b5797', color: 'white', padding: '5px', fontSize: '8pt' }}><span>TOTAL</span><span style={{ marginLeft: 'auto' }}>R$ {orc.valor_total?.toFixed(2)}</span></div>
                  </div>
                </div>
                <p style={{ textAlign: 'center', fontSize: '7pt', marginTop: '10px' }}>VALIDADE: 7 DIAS • Correntina-BA, {new Date(orc.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MENU INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-[#07111f] py-2 z-50">
        <div className="max-w-md mx-auto grid grid-cols-5 px-2 font-bold text-[9px] uppercase text-slate-500">
          <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center gap-1"><LayoutGrid size={20} />Início</button>
          <button onClick={() => router.push('/orcamento')} className="flex flex-col items-center gap-1 text-blue-500"><FileText size={20} />Orçam.</button>
          <button onClick={() => router.push('/ordens')} className="flex flex-col items-center gap-1"><ClipboardList size={20} />Ordens</button>
          <button onClick={() => router.push('/faturamento')} className="flex flex-col items-center gap-1"><CircleDollarSign size={20} />Fatur.</button>
          <button onClick={() => router.push('/configuracao')} className="flex flex-col items-center gap-1"><Settings size={20} />Config.</button>
        </div>
      </nav>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-100 flex items-end">
          <div className="w-full bg-[#0d1726] rounded-t-[40px] p-8 h-[92vh] overflow-y-auto border-t border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic">{editandoId ? 'EDITAR' : 'NOVO'} ORÇAMENTO</h2>
              <button onClick={fecharModal} className="bg-slate-800 p-2 rounded-full"><X /></button>
            </div>

            <div className="space-y-4 pb-20">
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFoto} />
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-40 border-2 border-dashed border-slate-700 rounded-4xl flex items-center justify-center bg-slate-900/50 overflow-hidden">
                {form.foto_preview ? <img src={form.foto_preview} className="w-full h-full object-cover" /> : <Camera size={32} className="text-blue-500" />}
              </div>

              <InputIcon Icone={User} placeholder="Razão Social" value={form.razao_social} onChange={(v: string) => setForm({...form, razao_social: v})} />
              <InputIcon Icone={Phone} placeholder="Solicitante" value={form.solicitante} onChange={(v: string) => setForm({...form, solicitante: v})} />
              <InputIcon Icone={MapPin} placeholder="Endereço" value={form.endereco} onChange={(v: string) => setForm({...form, endereco: v})} />
              <InputIcon Icone={Hash} placeholder="CNPJ ou CPF" value={form.documento} onChange={(v: string) => setForm({...form, documento: v})} />
              <InputIcon Icone={Monitor} placeholder="Máquina" value={form.maquina} onChange={(v: string) => setForm({...form, maquina: v})} />
              
              <textarea className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm h-24 outline-none" placeholder="Descrição..." value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />

              <div className="grid grid-cols-2 gap-3">
                <InputIcon Icone={Hash} placeholder="Qtd" value={form.quantidade} onChange={(v: string) => setForm({...form, quantidade: v})} />
                <InputIcon Icone={CircleDollarSign} placeholder="V. Unitário" value={form.valor_unitario} onChange={(v: string) => setForm({...form, valor_unitario: v})} />
              </div>
              <InputIcon Icone={CircleDollarSign} placeholder="Desconto (R$)" value={form.desconto} onChange={(v: string) => setForm({...form, desconto: v})} />

              <button onClick={salvarOrcamento} className="w-full py-5 bg-blue-600 rounded-3xl font-black uppercase shadow-xl active:scale-95 transition-all">
                {editandoId ? 'Atualizar Orçamento' : 'Gerar Orçamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InputIcon({ Icone, placeholder, value, onChange }: { Icone: any, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
      <input className="w-full bg-slate-900 border border-slate-700 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-blue-500" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}