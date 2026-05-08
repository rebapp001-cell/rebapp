'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  LayoutGrid, ClipboardList, CircleDollarSign, Settings,
  Plus, Save, User, Phone, Monitor, FileText,
  Wifi, WifiOff, X, Share2, Loader2
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function OrcamentoPage() {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [isOnline, setIsOnline] = useState(true)
  
  const [form, setForm] = useState({ 
    cliente: '', contato: '', maquina: '', descricao: '', valor: '' 
  })

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarOrcamentos()
  }, [])

  async function carregarOrcamentos() {
    setCarregando(true)
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

  // --- FUNÇÃO PARA GERAR PDF E COMPARTILHAR ---
  async function exportarPDF(orc: any) {
    setGerandoPdf(true)
    const element = document.getElementById(`temp-pdf-${orc.id}`)
    if (!element) return

    try {
      element.style.display = 'block' // Mostra temporariamente para o print
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      const pdfBlob = pdf.output('blob')
      
      element.style.display = 'none' // Esconde novamente

      const file = new File([pdfBlob], `Orcamento_${orc.cliente}.pdf`, { type: 'application/pdf' })

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Orçamento Tornearia Divisa',
          text: `Olá, segue o orçamento de ${orc.cliente}`
        })
      } else {
        pdf.save(`Orcamento_${orc.cliente}.pdf`)
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao gerar PDF")
    } finally {
      setGerandoPdf(false)
    }
  }

  const clean = tema === 'clean'

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER DASHBOARD STYLE */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className={`text-3xl font-black italic ${clean ? 'text-slate-800' : 'text-white'}`}>ORÇAMENTOS</h1>
              {isOnline ? <Wifi size={18} className="text-emerald-500" /> : <WifiOff size={18} className="text-rose-500 animate-pulse" />}
            </div>
            <p className="text-xs font-bold uppercase opacity-50 tracking-widest">Painel de Propostas</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="p-3 rounded-xl bg-blue-600 text-white shadow-lg active:scale-90 transition-all">
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>

        {/* LISTA DE ORÇAMENTOS */}
        <div className="space-y-4">
          {carregando ? (
            <div className="py-10 text-center animate-pulse italic opacity-50">Buscando dados...</div>
          ) : orcamentos.map((orc) => (
            <div key={orc.id} className={`p-5 rounded-3xl border relative ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-black uppercase truncate pr-8">{orc.cliente}</p>
                <button 
                  disabled={gerandoPdf}
                  onClick={() => exportarPDF(orc)} 
                  className="absolute top-4 right-4 p-2 bg-emerald-500/10 text-emerald-500 rounded-full active:scale-90"
                >
                  {gerandoPdf ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-3 opacity-60 text-[10px] font-bold uppercase">
                <Monitor size={12} /> {orc.maquina || 'S/ Máquina'}
              </div>

              <div className={`p-3 rounded-2xl text-[11px] italic mb-3 ${clean ? 'bg-slate-50 text-slate-600' : 'bg-[#111c2e] text-slate-400'}`}>
                "{orc.descricao_servico}"
              </div>

              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black opacity-30 uppercase">{new Date(orc.created_at).toLocaleDateString()}</span>
                <span className="text-lg font-black text-emerald-500">R$ {orc.valor_estimado}</span>
              </div>

              {/* TEMPLATE OCULTO PARA O PDF (ESTILO DA IMAGEM ENVIADA) */}
              <div id={`temp-pdf-${orc.id}`} style={{ display: 'none', width: '210mm', backgroundColor: 'white', color: 'black', padding: '15mm', fontFamily: 'Arial' }}>
                <div style={{ display: 'flex', border: '1px solid black', marginBottom: '10px' }}>
                  <div style={{ width: '35%', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '24pt', fontWeight: 'bold', color: '#1a4a8e', fontStyle: 'italic' }}>Divisa</div>
                    <div style={{ fontSize: '8pt', fontWeight: 'bold', letterSpacing: '2px' }}>TORNEARIA</div>
                  </div>
                  <div style={{ width: '65%', backgroundColor: '#1a4a8e', color: 'white', padding: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '14pt' }}>TORNEARIA DIVISA COMERCIO E SERVIÇO LTDA</h2>
                    <p style={{ fontSize: '8pt', margin: '5px 0' }}>
                      AV. 22, QD. 25, LT. 01 PRIMAVERA DO OESTE, ROSÁRIO-BA<br />
                      CELULAR: (62) 99929-2829 / (62) 99618-6262<br />
                      CNPJ: 11.190.449/0001-86
                    </p>
                  </div>
                </div>

                <div style={{ backgroundColor: '#2b5797', color: 'white', padding: '3px', textAlign: 'center', fontSize: '9pt', fontWeight: 'bold' }}>DADOS DO CLIENTE</div>
                <div style={{ border: '1px solid black', fontSize: '9pt', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                    <div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '5px', fontWeight: 'bold' }}>CLIENTE:</div>
                    <div style={{ width: '80%', padding: '5px' }}>{orc.cliente}</div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '5px', fontWeight: 'bold' }}>CONTATO:</div>
                    <div style={{ width: '80%', padding: '5px' }}>{orc.contato}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#2b5797', color: 'white', padding: '3px', textAlign: 'center', fontSize: '9pt', fontWeight: 'bold' }}>ORÇAMENTO</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#a6a6a6' }}>
                      <th style={{ border: '1px solid black', padding: '5px' }}>DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                      <th style={{ border: '1px solid black', padding: '5px' }}>MAQUINA</th>
                      <th style={{ border: '1px solid black', padding: '5px' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid black', padding: '15px' }}>{orc.descricao_servico}</td>
                      <td style={{ border: '1px solid black', padding: '15px', textAlign: 'center' }}>{orc.maquina}</td>
                      <td style={{ border: '1px solid black', padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>R$ {orc.valor_estimado}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <div style={{ width: '40%', border: '1px solid black' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#2b5797', color: 'white', padding: '8px', fontWeight: 'bold' }}>
                      <span>VALOR TOTAL</span>
                      <span>R$ {orc.valor_estimado}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '40px', backgroundColor: '#d9d9d9', padding: '10px', textAlign: 'center', fontSize: '8pt', fontWeight: 'bold' }}>
                  VALIDADE DO ORÇAMENTO: 07 DIAS • Correntina-BA, {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MENU INFERIOR PADRÃO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 ${clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'}`}>
        <div className="max-w-md mx-auto grid grid-cols-5 px-2">
          <MenuItem titulo="Início" Icone={LayoutGrid} clean={clean} onClick={() => router.push('/dashboard')} />
          <MenuItem titulo="Ordens" Icone={ClipboardList} clean={clean} onClick={() => router.push('/ordens')} />
          <MenuItem ativo titulo="Orçam." Icone={FileText} clean={clean} onClick={() => router.push('/orcamento')} />
          <MenuItem titulo="Faturam." Icone={CircleDollarSign} clean={clean} onClick={() => router.push('/faturamento')} />
          <MenuItem titulo="Config." Icone={Settings} clean={clean} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL NOVO ORÇAMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 animate-in slide-in-from-bottom duration-300 ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase italic">Novo Orçamento</h2>
              <button onClick={() => setModalAberto(false)} className="p-2 opacity-50"><X /></button>
            </div>
            <div className="space-y-4">
              <InputIcon Icone={User} clean={clean} placeholder="Cliente" value={form.cliente} onChange={(v:any) => setForm({...form, cliente: v})} />
              <InputIcon Icone={Phone} clean={clean} placeholder="WhatsApp" value={form.contato} onChange={(v:any) => setForm({...form, contato: v})} />
              <InputIcon Icone={Monitor} clean={clean} placeholder="Máquina" value={form.maquina} onChange={(v:any) => setForm({...form, maquina: v})} />
              <textarea 
                className={`w-full p-4 rounded-2xl text-xs h-24 outline-none border ${clean ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'}`}
                placeholder="Serviço..."
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
              />
              <InputIcon Icone={CircleDollarSign} clean={clean} placeholder="Valor" value={form.valor} onChange={(v:any) => setForm({...form, valor: v})} />
              <button onClick={salvarOrcamento} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-blue-600/30">
                Salvar Proposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// COMPONENTES AUXILIARES
function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 ${ativo ? 'text-blue-500' : 'text-slate-500'}`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className="mt-1 text-[9px] font-bold uppercase">{titulo}</span>
    </button>
  )
}

function InputIcon({ Icone, placeholder, value, onChange, clean }: any) {
  return (
    <div className="relative">
      <Icone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
      <input 
        className={`w-full py-4 pl-12 pr-4 rounded-2xl text-xs outline-none border ${clean ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}