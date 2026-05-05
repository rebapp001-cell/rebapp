'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Save, Layers, CircleDot, Disc, 
  Cylinder, Ruler, Square, Loader2, Gauge
} from 'lucide-react'
import { supabase } from '../../../../lib/supabase'

interface DadosMaterial {
  descricao: string
  espessura: string
  diametro: string
  diametro_interno: string
  comprimento: string
  largura: string
  quantidade: string
}

interface InputGeralProps {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  type?: string
  clean: boolean
}

export default function AdicionarMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const id_os = params.id
  
  const [tipo, setTipo] = useState<string>('') 
  const [loading, setLoading] = useState(false)
  const [tema, setTema] = useState<'dark' | 'clean'>('clean')

  const [dados, setDados] = useState<DadosMaterial>({
    descricao: '',
    espessura: '',
    diametro: '',
    diametro_interno: '',
    comprimento: '',
    largura: '',
    quantidade: '1'
  })

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean'
    if (temaSalvo) setTema(temaSalvo)
  }, [])

  async function salvarMaterial() {
    if (!tipo) return alert('Selecione um tipo de material')
    setLoading(true)

    let d = dados.descricao.trim()
    const t = tipo.toUpperCase().replace('_', ' ')

    if (!d) {
      if (tipo === 'chapa') d = `CHAPA ${dados.espessura}mm x ${dados.largura}mm x ${dados.comprimento}mm`
      else if (tipo === 'eixo') d = `EIXO Ø${dados.diametro}mm x ${dados.comprimento}mm`
      else if (tipo === 'haste') d = `HASTE CROMADA Ø${dados.diametro}mm x ${dados.comprimento}mm`
      else if (tipo === 'tubo_mecanico') d = `TUBO MECÂNICO ØEXT ${dados.diametro}mm x ØINT ${dados.diametro_interno}mm x ${dados.comprimento}mm`
      else if (tipo === 'tubo_camisa') d = `TUBO P/ CAMISA ØINT ${dados.diametro_interno}mm x ${dados.comprimento}mm`
      else if (tipo === 'tecnil') d = `TECNIL (NYLON) Ø${dados.diametro}mm x ${dados.comprimento}mm`
    }
    
    const novoMaterial = {
      id_os: Number(id_os), 
      tipo,
      descricao: d, 
      espessura: dados.espessura,
      diametro: dados.diametro,
      diametro_interno: dados.diametro_interno,
      comprimento: dados.comprimento,
      largura: dados.largura,
      quantidade: dados.quantidade,
      created_at: new Date().toISOString()
    }

    try {
      const { error } = await supabase.from('materiais_os').insert([novoMaterial])
      if (error) throw error
      router.back()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar no banco de dados.')
    } finally {
      setLoading(false)
    }
  }

  const clean = tema === 'clean'

  return (
    <div className={`min-h-screen ${clean ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#07111f] text-white'} pb-10`}>
      <header className={`p-6 flex items-center gap-4 border-b ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-white/10'}`}>
        <button onClick={() => router.back()} className={`p-2 rounded-full ${clean ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-white'}`}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter">Acrescentar Material</h1>
          <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">Setor de Usinagem / OS #{id_os}</p>
        </div>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-6">
        <section>
          <label className="text-[10px] font-bold uppercase mb-3 block opacity-50 tracking-widest">Catálogo de Materiais</label>
          <div className="grid grid-cols-3 gap-2">
            <BotaoTipo clean={clean} ativo={tipo === 'chapa'} onClick={() => setTipo('chapa')} label="Chapa" Icone={Layers} />
            <BotaoTipo clean={clean} ativo={tipo === 'eixo'} onClick={() => setTipo('eixo')} label="Eixo" Icone={CircleDot} />
            <BotaoTipo clean={clean} ativo={tipo === 'haste'} onClick={() => setTipo('haste')} label="Haste" Icone={Gauge} />
            <BotaoTipo clean={clean} ativo={tipo === 'tubo_mecanico'} onClick={() => setTipo('tubo_mecanico')} label="T. Mecânico" Icone={Disc} />
            <BotaoTipo clean={clean} ativo={tipo === 'tubo_camisa'} onClick={() => setTipo('tubo_camisa')} label="T. Camisa" Icone={Cylinder} />
            <BotaoTipo clean={clean} ativo={tipo === 'tecnil'} onClick={() => setTipo('tecnil')} label="Tecnil" Icone={Square} />
          </div>
        </section>

        {tipo && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              {tipo === 'chapa' && (
                <>
                  <InputGeral clean={clean} label="Espessura (mm)" placeholder="0.00" value={dados.espessura} onChange={(v) => setDados({...dados, espessura: v})} />
                  <InputGeral clean={clean} label="Largura (mm)" placeholder="0.00" value={dados.largura} onChange={(v) => setDados({...dados, largura: v})} />
                </>
              )}

              {(tipo === 'tubo_mecanico' || tipo === 'tubo_camisa') && (
                <>
                  <InputGeral clean={clean} label="Ø Externo (mm)" placeholder="0.00" value={dados.diametro} onChange={(v) => setDados({...dados, diametro: v})} />
                  <InputGeral clean={clean} label="Ø Interno (mm)" placeholder="0.00" value={dados.diametro_interno} onChange={(v) => setDados({...dados, diametro_interno: v})} />
                </>
              )}

              {(tipo === 'eixo' || tipo === 'haste' || tipo === 'tecnil') && (
                <InputGeral clean={clean} label="Diâmetro (mm)" placeholder="Ø 0.00" value={dados.diametro} onChange={(v) => setDados({...dados, diametro: v})} />
              )}

              <InputGeral clean={clean} label="Comprimento (mm)" placeholder="0.00" value={dados.comprimento} onChange={(v) => setDados({...dados, comprimento: v})} />
              <InputGeral clean={clean} label="Quantidade" type="number" value={dados.quantidade} onChange={(v) => setDados({...dados, quantidade: v})} />
            </div>

            <button
              onClick={salvarMaterial}
              disabled={loading}
              className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase mt-6 flex items-center justify-center gap-2 text-white active:scale-95 transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar na Ordem</>}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function BotaoTipo({ ativo, onClick, label, Icone, clean }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
        ativo 
          ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
          : clean 
            ? 'bg-white border-slate-200 text-slate-400 hover:border-blue-200' 
            : 'bg-[#0d1726] border-white/5 text-slate-500 hover:border-white/20'
      }`}
    >
      <Icone size={22} className="mb-1.5" />
      <span className="text-[9px] font-black uppercase text-center leading-tight">{label}</span>
    </button>
  )
}

function InputGeral({ label, placeholder, value, onChange, type = "text", clean }: InputGeralProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] font-bold uppercase ml-1 opacity-50 flex items-center gap-1">
        <Ruler size={10} /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 ${
          clean ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0d1726] border-white/10 text-white'
        } w-full transition-all`}
      />
    </div>
  )
}