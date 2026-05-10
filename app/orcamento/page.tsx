'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  Plus, User, FileText, Phone,
  X, Loader2, Camera, Image as ImageIcon, Hash, Edit3, Save, CircleDollarSign, Trash2,
  LayoutGrid, ClipboardList, Settings
} from 'lucide-react'

export default function OrcamentoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  const [form, setForm] = useState({ 
    razao_social: '', 
    solicitante: '', 
    documento: '', 
    telefone: '',
    descricao: '', 
    quantidade: '', 
    valor_unitario: '',
    desconto: '', 
    observacao: '', 
    fotos: [] as string[]
  })

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarOrcamentos()
  }, [])

  const clean = tema === 'clean'

  async function carregarOrcamentos() {
    setCarregando(true)
    // Usando 'orcamentos' (sem ç) para evitar o erro de sintaxe do banco
    const { data } = await supabase.from('orcamentos').select('*').order('created_at', { ascending: false })
    if (data) setOrcamentos(data)
    setCarregando(false)
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setForm(prev => ({ ...prev, fotos: [...prev.fotos, reader.result as string] }))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removerFoto = (index: number) => {
    setForm(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }))
  }

  function abrirEdicao(orc: any) {
    setEditandoId(orc.id)
    setForm({
      razao_social: orc.cliente || '',
      solicitante: orc.solicitante || '',
      documento: orc.documento || '',
      telefone: orc.telefone || '',
      descricao: orc.descricao_servico || '',
      quantidade: orc.quantidade?.toString() || '',
      valor_unitario: orc.valor_unitario?.toString() || '',
      desconto: orc.desconto?.toString() || '',
      observacao: orc.observacao || '',
      fotos: Array.isArray(orc.foto_url) ? orc.foto_url : (orc.foto_url ? [orc.foto_url] : [])
    })
    setModalAberto(true)
  }

  async function salvarOrcamento() {
    if (!form.razao_social || !form.valor_unitario) return alert('Preencha Razão Social e Valor!')
    
    const vUnit = parseFloat(form.valor_unitario.replace(',', '.')) || 0
    const qtd = parseFloat(form.quantidade) || 0
    const desc = parseFloat(form.desconto.replace(',', '.')) || 0
    const vTotal = (vUnit * qtd) - desc

    const dados = {
      cliente: form.razao_social,
      solicitante: form.solicitante,
      documento: form.documento,
      telefone: form.telefone,
      descricao_servico: form.descricao,
      quantidade: qtd,
      valor_unitario: vUnit,
      valor_total: vTotal,
      desconto: desc,
      observacao: form.observacao,
      foto_url: form.fotos 
    }

    const { error } = editandoId 
      ? await supabase.from('orcamentos').update(dados).eq('id', editandoId)
      : await supabase.from('orcamentos').insert([dados])

    if (!error) {
      fecharModal()
      carregarOrcamentos()
    } else {
      alert("Erro ao salvar: " + error.message)
    }
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
    setForm({ 
      razao_social: '', solicitante: '', documento: '', telefone: '',
      descricao: '', quantidade: '', valor_unitario: '',
      desconto: '', observacao: '', fotos: []
    })
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-32 ${
      clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
    }`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Orçamentos</h1>
            <p className={`text-sm ${clean ? 'text-slate-500' : 'text-slate-400'}`}>
              Gestão de propostas
            </p>
          </div>
          <button 
            onClick={() => setModalAberto(true)} 
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-3">
          {carregando ? (
            <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : orcamentos.map((orc) => (
            <div key={orc.id} className={`border p-4 rounded-2xl transition-all ${
              clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-red-500 uppercase">#{orc.id.toString().slice(-4)}</p>
                  <p className={`font-bold uppercase text-xs truncate ${clean ? 'text-slate-700' : 'text-white'}`}>
                    {orc.cliente}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => abrirEdicao(orc)} 
                    className={`p-2 rounded-lg active:scale-90 ${
                      clean ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <p className="text-sm font-black text-emerald-500 font-mono">
                    R$ {orc.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-end justify-center">
          <div className={`w-full max-w-md rounded-t-[40px] p-6 max-h-[92vh] overflow-y-auto border-t shadow-2xl ${
            clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'
          }`}>
            <div className={`flex justify-between items-center mb-6 sticky top-0 z-10 pb-2 ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
              <h2 className={`text-lg font-black italic uppercase ${clean ? 'text-slate-800' : 'text-white'}`}>
                {editandoId ? 'Editar' : 'Novo'} Orçamento
              </h2>
              <button onClick={fecharModal} className="bg-slate-800 p-2 rounded-full text-white"><X size={20}/></button>
            </div>

            <div className="space-y-4 pb-10">
              {/* Fotos */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Imagens ({form.fotos.length})</p>
                <div className="flex gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 p-3 rounded-xl text-xs font-bold text-slate-300"><ImageIcon size={16} /> Galeria</button>
                  <button onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 p-3 rounded-xl text-xs font-bold text-slate-300"><Camera size={16} /> Câmera</button>
                </div>
                <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFoto} />
                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFoto} />

                {form.fotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {form.fotos.map((foto, index) => (
                      <div key={index} className="relative min-w-30 h-24 rounded-xl overflow-hidden border border-slate-700">
                        <img src={foto} className="w-full h-full object-cover" alt="servico" />
                        <button onClick={() => removerFoto(index)} className="absolute top-1 right-1 bg-red-500 p-1 rounded-full text-white shadow-lg"><Trash2 size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Dados do Cliente</p>
                <InputIcon Icone={User} placeholder="Razão Social" value={form.razao_social} onChange={(v: string) => setForm({...form, razao_social: v})} clean={clean} />
                <InputIcon Icone={User} placeholder="Solicitante (Nome)" value={form.solicitante} onChange={(v: string) => setForm({...form, solicitante: v})} clean={clean} />
                <InputIcon Icone={Hash} placeholder="CNPJ" value={form.documento} onChange={(v: string) => setForm({...form, documento: v})} clean={clean} />
                <InputIcon Icone={Phone} placeholder="Telefone" value={form.telefone} onChange={(v: string) => setForm({...form, telefone: v})} clean={clean} />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Dados do Serviço</p>
                <textarea className={`w-full border p-3 rounded-xl text-xs h-20 outline-none focus:border-red-500 ${clean ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'}`} placeholder="Descrição do Serviço" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <InputIcon Icone={Hash} placeholder="Quantidade" value={form.quantidade} onChange={(v: string) => setForm({...form, quantidade: v})} clean={clean} />
                  <InputMoeda Icone={CircleDollarSign} placeholder="Unitário" value={form.valor_unitario} onChange={(v: string) => setForm({...form, valor_unitario: v})} clean={clean} />
                </div>
                <InputMoeda Icone={CircleDollarSign} placeholder="Desconto" value={form.desconto} onChange={(v: string) => setForm({...form, desconto: v})} clean={clean} />
                <textarea className={`w-full border p-3 rounded-xl text-xs h-16 outline-none focus:border-red-500 ${clean ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'}`} placeholder="Observações Adicionais" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})} />
              </div>

              <button onClick={salvarOrcamento} className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Save size={18} />
                {editandoId ? 'Atualizar Orçamento' : 'Gerar Orçamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU INFERIOR PADRONIZADO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 ${
        clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'
      }`}>
        <div className="max-w-md mx-auto grid grid-cols-5 px-2">
          <MenuItem clean={clean} titulo="Início" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
          <MenuItem clean={clean} titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
          <MenuItem clean={clean} ativo titulo="Orçam." Icone={FileText} onClick={() => {}} />
          <MenuItem clean={clean} titulo="Faturam." Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
          <MenuItem clean={clean} titulo="Config." Icone={Settings} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

// COMPONENTES AUXILIARES
function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 transition-all active:scale-90 ${
      ativo ? 'text-red-500' : clean ? 'text-slate-400' : 'text-slate-500'
    }`}>
      <Icone size={22} strokeWidth={ativo ? 2.5 : 2} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

function InputMoeda({ Icone, placeholder, value, onChange, clean }: any) {
  return (
    <div className="relative">
      <Icone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500">R$</span>
      <input 
        className={`w-full border py-3 pl-14 pr-3 rounded-xl text-xs outline-none focus:border-red-500 font-mono ${
            clean ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9,.]/g, ''))}
      />
    </div>
  )
}

function InputIcon({ Icone, placeholder, value, onChange, clean }: any) {
  return (
    <div className="relative">
      <Icone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input 
        className={`w-full border py-3 pl-10 pr-3 rounded-xl text-xs outline-none focus:border-red-500 ${
            clean ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`} 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  )
}