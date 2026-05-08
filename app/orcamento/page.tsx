'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  Plus, User, FileText, MapPin, Phone,
  Wifi, WifiOff, X, Share2, Loader2, Camera, Image as ImageIcon, Hash, Edit3, Save, CircleDollarSign
} from 'lucide-react'

export default function OrcamentoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  const [form, setForm] = useState({ 
    razao_social: '', 
    solicitante: '', 
    documento: '', 
    telefone: '',
    descricao: '', 
    quantidade: '', 
    valor_unitario: '',
    desconto: '0', 
    observacao: '', 
    foto_preview: ''
  })

  useEffect(() => {
    carregarOrcamentos()
  }, [])

  async function carregarOrcamentos() {
    setCarregando(true)
    const { data } = await supabase.from('orçamentos').select('*').order('created_at', { ascending: false })
    if (data) setOrcamentos(data)
    setCarregando(false)
  }

  // FUNÇÃO PARA TRATAR A FOTO (CONVERTE PARA BASE64 PARA PREVIEW/SALVAMENTO SIMPLES)
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm({ ...form, foto_preview: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  // FUNÇÃO PARA CARREGAR DADOS NO MODAL PARA EDIÇÃO
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
      desconto: orc.desconto?.toString() || '0',
      observacao: orc.observacao || '',
      foto_preview: orc.foto_url || ''
    })
    setModalAberto(true)
  }

  async function salvarOrcamento() {
    if (!form.razao_social || !form.valor_unitario) return alert('Preencha Razão Social e Valor!')
    
    const vUnit = parseFloat(form.valor_unitario) || 0
    const qtd = parseFloat(form.quantidade) || 0
    const desc = parseFloat(form.desconto) || 0
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
      foto_url: form.foto_preview
    }

    const { error } = editandoId 
      ? await supabase.from('orçamentos').update(dados).eq('id', editandoId)
      : await supabase.from('orçamentos').insert([dados])

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
      desconto: '0', observacao: '', foto_preview: ''
    })
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-24">
      <main className="max-w-md mx-auto px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black italic uppercase">Orçamentos</h1>
          <button onClick={() => setModalAberto(true)} className="bg-blue-600 p-3 rounded-xl active:scale-95 transition-all">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-3">
          {carregando ? (
            <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : orcamentos.map((orc) => (
            <div key={orc.id} className="bg-[#0d1726] border border-slate-800 p-4 rounded-2xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-blue-500 uppercase">#{orc.id.toString().slice(-4)}</p>
                  <p className="font-bold uppercase text-xs truncate w-32">{orc.cliente}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* BOTÃO DE EDIÇÃO NO CARD */}
                  <button onClick={() => abrirEdicao(orc)} className="p-2 bg-slate-800 rounded-lg text-slate-400 active:scale-90">
                    <Edit3 size={16} />
                  </button>
                  <p className="text-sm font-black text-emerald-400 ml-2">R$ {orc.valor_total?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-[#0d1726] rounded-t-[40px] p-6 max-h-[92vh] overflow-y-auto border-t border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#0d1726] z-10 pb-2">
              <h2 className="text-lg font-black italic uppercase">{editandoId ? 'Editar' : 'Novo'} Orçamento</h2>
              <button onClick={fecharModal} className="bg-slate-800 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-4 pb-10">
              
              {/* SEÇÃO DE FOTO */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Imagem do Serviço</p>
                <div className="flex gap-3">
                  {/* Botão Galeria */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 p-3 rounded-xl text-xs font-bold text-slate-300"
                  >
                    <ImageIcon size={16} /> Galeria
                  </button>
                  {/* Botão Câmera */}
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 p-3 rounded-xl text-xs font-bold text-slate-300"
                  >
                    <Camera size={16} /> Câmera
                  </button>
                </div>
                
                {/* Inputs Escondidos */}
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFoto} />
                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFoto} />

                {/* Preview da Foto */}
                {form.foto_preview && (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-700">
                    <img src={form.foto_preview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setForm({...form, foto_preview: ''})}
                      className="absolute top-2 right-2 bg-red-500 p-1 rounded-full text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Dados do Cliente</p>
                <InputIcon Icone={User} placeholder="Razão Social" value={form.razao_social} onChange={(v) => setForm({...form, razao_social: v})} />
                <InputIcon Icone={Phone} placeholder="Solicitante (Nome)" value={form.solicitante} onChange={(v) => setForm({...form, solicitante: v})} />
                <InputIcon Icone={Hash} placeholder="CNPJ" value={form.documento} onChange={(v) => setForm({...form, documento: v})} />
                <InputIcon Icone={Phone} placeholder="Telefone" value={form.telefone} onChange={(v) => setForm({...form, telefone: v})} />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Dados do Serviço</p>
                <textarea 
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs h-20 outline-none text-white focus:border-blue-500"
                  placeholder="Descrição do Serviço"
                  value={form.descricao}
                  onChange={e => setForm({...form, descricao: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputIcon Icone={Hash} placeholder="Quantidade" value={form.quantidade} onChange={(v) => setForm({...form, quantidade: v})} />
                  <InputIcon Icone={CircleDollarSign} placeholder="Valor Unitário" value={form.valor_unitario} onChange={(v) => setForm({...form, valor_unitario: v})} />
                </div>
                <InputIcon Icone={CircleDollarSign} placeholder="Desconto (R$)" value={form.desconto} onChange={(v) => setForm({...form, desconto: v})} />
                <textarea 
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs h-16 outline-none text-white focus:border-blue-500"
                  placeholder="Observações Adicionais"
                  value={form.observacao}
                  onChange={e => setForm({...form, observacao: e.target.value})}
                />
              </div>

              <button onClick={salvarOrcamento} className="w-full py-4 bg-blue-600 rounded-xl font-black uppercase text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Save size={18} />
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
      <Icone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input 
        className="w-full bg-slate-900 border border-slate-700 py-3 pl-10 pr-3 rounded-xl text-xs outline-none text-white focus:border-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}