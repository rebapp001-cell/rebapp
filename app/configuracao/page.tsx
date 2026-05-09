'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// Importando ícones modernos do Lucide
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Lock, 
  Eye, 
  EyeOff, 
  LayoutGrid, 
  ClipboardList, 
  CircleDollarSign, 
  Settings,
  Info,
  CheckCircle2,
  FileText // Importado para o menu
} from 'lucide-react'

export default function ConfiguracaoPage() {
  const router = useRouter()
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [verSenha, setVerSenha] = useState({ atual: false, nova: false, confirmar: false })
  
  const clean = tema === 'clean'

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app')
    if (temaSalvo === 'clean') setTema('clean')
  }, [])

  const alterarTema = (novoTema: 'dark' | 'clean') => {
    setTema(novoTema)
    localStorage.setItem('tema-app', novoTema)
  }

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${
      clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
    }`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1a2d] border-slate-800 text-white'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Configuração</h1>
            <p className={`text-sm ${clean ? 'text-slate-500' : 'text-slate-400'}`}>
              Ajuste sua conta e aparência
            </p>
          </div>
        </div>

        {/* SEÇÃO: APARÊNCIA */}
        <section className={`rounded-3xl p-6 mb-6 ${clean ? 'bg-white shadow-sm' : 'bg-[#0b1628]'}`}>
          <h2 className="text-lg font-semibold mb-5">Aparência do aplicativo</h2>
          <div className="grid grid-cols-2 gap-4">
            <ThemeCard 
              active={tema === 'dark'} 
              label="Dark" 
              sub="Tema escuro" 
              Icon={Moon} 
              onClick={() => alterarTema('dark')}
              clean={clean}
            />
            <ThemeCard 
              active={tema === 'clean'} 
              label="Clean" 
              sub="Tema claro" 
              Icon={Sun} 
              onClick={() => alterarTema('clean')}
              clean={clean}
            />
          </div>
        </section>

        {/* SEÇÃO: ALTERAR SENHA */}
        <section className={`rounded-3xl p-6 ${clean ? 'bg-white shadow-sm' : 'bg-[#0b1628]'}`}>
          <div className="flex items-center gap-3 mb-6">
            <Lock size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold">Alterar senha</h2>
          </div>

          <div className="space-y-4">
            <InputSenha 
              placeholder="Senha atual" 
              visible={verSenha.atual} 
              toggleVisible={() => setVerSenha({...verSenha, atual: !verSenha.atual})}
              clean={clean}
            />
            <InputSenha 
              placeholder="Nova senha" 
              visible={verSenha.nova} 
              toggleVisible={() => setVerSenha({...verSenha, nova: !verSenha.nova})}
              clean={clean}
            />
            <InputSenha 
              placeholder="Confirmar nova senha" 
              visible={verSenha.confirmar} 
              toggleVisible={() => setVerSenha({...verSenha, confirmar: !verSenha.confirmar})}
              clean={clean}
            />

            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl mt-2 transition-all shadow-lg shadow-red-600/20">
              Alterar senha
            </button>
          </div>

          {/* DICAS DE SENHA */}
          <div className={`mt-6 p-4 rounded-2xl border ${
            clean ? 'bg-red-50 border-red-100' : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex gap-3 mb-3 text-red-500">
              <Info size={18} />
              <p className="text-sm font-semibold">Sua senha deve ser:</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs opacity-80">
                <CheckCircle2 size={14} className="text-red-500" /> Apenas números
              </div>
              <div className="flex items-center gap-2 text-xs opacity-80">
                <CheckCircle2 size={14} className="text-red-500" /> Até 4 dígitos
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MENU INFERIOR PADRONIZADO (5 COLUNAS) */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 ${
        clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'
      }`}>
        <div className="max-w-md mx-auto grid grid-cols-5 px-2">
          <MenuItem clean={clean} titulo="Início" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
          <MenuItem clean={clean} titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
          <MenuItem clean={clean} titulo="Orçam." Icone={FileText} onClick={() => router.push('/orcamento')} />
          <MenuItem clean={clean} titulo="Faturam." Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
          <MenuItem clean={clean} ativo titulo="Config." Icone={Settings} onClick={() => {}} />
        </div>
      </nav>
    </div>
  )
}

// Subcomponente para os itens do Menu Inferior
function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center py-2 transition-all active:scale-90 ${
        ativo ? 'text-red-500' : clean ? 'text-slate-400' : 'text-slate-500'
      }`}
    >
      <Icone size={22} strokeWidth={ativo ? 2.5 : 2} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

// Subcomponente para os Cards de Tema
function ThemeCard({ active, label, sub, Icon, onClick, clean }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
        active 
          ? 'border-red-600 bg-red-600/5 ring-1 ring-red-600' 
          : clean ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#111f35]'
      }`}
    >
      <Icon size={20} className={active ? 'text-red-500' : 'text-slate-400'} />
      <span className={`mt-3 font-bold text-sm ${active && 'text-red-500'}`}>{label}</span>
      <span className="text-[10px] opacity-60">{sub}</span>
    </button>
  )
}

// Subcomponente para Inputs de Senha
function InputSenha({ placeholder, visible, toggleVisible, clean }: any) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500">
        <Lock size={18} />
      </div>
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        className={`w-full pl-12 pr-12 py-4 rounded-xl border outline-none text-sm transition-all ${
          clean 
            ? 'bg-slate-50 border-slate-200 focus:border-red-500' 
            : 'bg-[#101d31] border-slate-800 focus:border-red-500'
        }`}
      />
      <button 
        type="button"
        onClick={toggleVisible}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}