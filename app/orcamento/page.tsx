'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  LayoutGrid, ClipboardList, CircleDollarSign, 
  Settings, Plus, Save, User, Phone, Monitor, FileText, Loader2
} from 'lucide-react'

export default function OrcamentoPage() {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState({ cliente: '', contato: '', maquina: '', descricao: '', valor: '' })

  useEffect(() => { carregarOrcamentos() }, [])

  async function carregarOrcamentos() {
    const { data } = await supabase.from('orçamentos').select('*').order('created_at', { ascending: false })
    setOrcamentos(data || [])
    setCarregando(false)
  }

  async function salvarOrcamento() {
    if (!form.cliente) return alert('O nome do cliente é obrigatório!')
    const { error } = await supabase.from('orçamentos').insert([{
      cliente: form.cliente,
      contato: form.contato,
      maquina: form.maquina,
      descricao_servico: form.descricao,
      valor_estimado: parseFloat(form.valor) || 0
    }])
    if (!error) {
      setModalAberto(false)
      setForm({ cliente: '', contato: '', maquina: '', descricao: '', valor: '' })
      carregarOrcamentos()
    }
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-32">
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase italic">Orçamentos</h1>
        <button onClick={() => setModalAberto(true)} className="bg-blue-600 p-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px]">
          <Plus size={18} /> Novo Orçamento
        </button>
      </header>

      <main className="px-5 space-y-4">
        {carregando ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : orcamentos.map(orc => (
          <div key={orc.id} className="bg-[#0d1726] p-5 rounded-4xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black uppercase text-sm">{orc.cliente}</h3>
              <span className="text-emerald-400 font-black text-xs">R$ {orc.valor_estimado}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] opacity-50 uppercase font-bold mb-2">
               <Monitor size={12}/> {orc.maquina}
            </div>
            <p className="text-xs opacity-80 leading-relaxed italic">"{orc.descricao_servico}"</p>
          </div>
        ))}
      </main>

      {/* MENU INFERIOR PADRÃO */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#07111f]/90 backdrop-blur-md border-t border-slate-800 py-4 px-6 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
            <MenuNav titulo="Home" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
            <MenuNav titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
            <MenuNav ativo titulo="Orçamentos" Icone={FileText} onClick={() => router.push('/orcamento')} />
            <MenuNav titulo="Faturas" Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
            <MenuNav titulo="Ajustes" Icone={Settings} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL NOVO ORÇAMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#0d1726] rounded-[40px] p-8 border border-slate-700 shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-6 italic">Novo Registro</h2>
            <div className="space-y-4">
              <InputIcon Icone={User} placeholder="Nome do Cliente" value={form.cliente} onChange={(v:any) => setForm({...form, cliente: v})} />
              <InputIcon Icone={Phone} placeholder="WhatsApp / Telefone" value={form.contato} onChange={(v:any) => setForm({...form, contato: v})} />
              <InputIcon Icone={Monitor} placeholder="Máquina / Equipamento" value={form.maquina} onChange={(v:any) => setForm({...form, maquina: v})} />
              <textarea 
                placeholder="Descrição resumida do serviço..." 
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs h-28 focus:border-blue-500 outline-none"
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
              />
              <InputIcon Icone={CircleDollarSign} placeholder="Valor Estimado (Ex: 1500)" value={form.valor} onChange={(v:any) => setForm({...form, valor: v})} />
              
              <button onClick={salvarOrcamento} className="w-full py-4 bg-blue-600 rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                <Save size={20} /> Salvar Orçamento
              </button>
              <button onClick={() => setModalAberto(false)} className="w-full text-xs font-black uppercase opacity-40 mt-2">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuNav({ titulo, Icone, ativo, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${ativo ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}>
      <Icone size={22}/><span className="text-[8px] font-black uppercase">{titulo}</span>
    </button>
  )
}

function InputIcon({ Icone, placeholder, value, onChange }: any) {
  return (
    <div className="relative">
      <Icone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
      <input className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xs focus:border-blue-500 outline-none" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}