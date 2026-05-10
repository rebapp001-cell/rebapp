'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  useEffect(() => {
    document.title = "R&B Torneadora - Sistema OS"
    
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
  }, [])

  const alternarTema = (novoTema: 'dark' | 'clean') => {
    setTema(novoTema)
    localStorage.setItem('tema-app', novoTema)
  }

  async function fazerLogin() {
    if (!usuario || !senha) {
      alert('Preencha usuário e senha')
      return
    }

    setCarregando(true)

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuario.trim())
      .eq('senha', senha.trim())
      .maybeSingle()

    if (error) {
      console.error("Erro Supabase:", error.message)
      alert('Erro na conexão: ' + error.message)
      setCarregando(false)
      return
    }

    if (!data) {
      alert('Usuário ou senha inválidos. Verifique se o Caps Lock está ativado.')
      setCarregando(false)
      return
    }

    localStorage.setItem('usuario', data.usuario)
    router.push('/dashboard')
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 py-8 transition-colors duration-500 ${
      tema === 'dark' ? 'bg-[#07111f]' : 'bg-[#f8fafc]'
    }`}>
      
      {/* BOTÃO DE TEMA */}
      <div className="absolute top-6 right-6 flex bg-slate-800/10 p-1 rounded-xl border border-slate-700/20 backdrop-blur-sm">
        <button 
          onClick={() => alternarTema('dark')}
          className={`p-2 rounded-lg transition-all ${tema === 'dark' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
        >
          <Moon size={18} />
        </button>
        <button 
          onClick={() => alternarTema('clean')}
          className={`p-2 rounded-lg transition-all ${tema === 'clean' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600'}`}
        >
          <Sun size={18} />
        </button>
      </div>

      <div className="w-full max-w-md">
        
        {/* LOGO AREA */}
        <div className="flex justify-center mb-10">
          <div className="relative w-64 h-24">
            <Image
              src="/logo-divisa.png"
              alt="Logo R&B Torneadora"
              fill
              className="object-contain" // Removido o filtro de brilho e opacidade
              priority
            />
          </div>
        </div>

        {/* LOGIN CARD */}
        <div className={`border rounded-[40px] p-8 shadow-2xl transition-all duration-500 ${
          tema === 'dark' 
            ? 'bg-[#0d1726] border-slate-700/50 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-start gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 text-white">
              <Lock size={28} strokeWidth={2.5} />
            </div>

            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter">Sistema de Serviços</h1>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${tema === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Autenticação de Acesso
              </p>
            </div>
          </div>

          <div className="space-y-5 mb-8">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block px-2 tracking-widest">Usuário</label>
              <div className={`border rounded-2xl px-4 py-4 flex items-center gap-3 focus-within:border-red-500 transition-all ${
                tema === 'dark' ? 'bg-[#111c2e] border-slate-700/50' : 'bg-slate-50 border-slate-200'
              }`}>
                <User size={20} className="text-red-500" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.toUpperCase())}
                  placeholder="DIGITE SEU USUÁRIO"
                  className={`bg-transparent outline-none w-full text-sm font-bold uppercase placeholder:text-slate-600 ${
                    tema === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block px-2 tracking-widest">Senha</label>
              <div className={`border rounded-2xl px-4 py-4 flex items-center gap-3 focus-within:border-red-500 transition-all ${
                tema === 'dark' ? 'bg-[#111c2e] border-slate-700/50' : 'bg-slate-50 border-slate-200'
              }`}>
                <Lock size={20} className="text-red-500" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value.toUpperCase())}
                  placeholder="DIGITE SUA SENHA"
                  className={`bg-transparent outline-none w-full text-sm font-bold uppercase placeholder:text-slate-600 ${
                    tema === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="text-slate-500">
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={fazerLogin}
            disabled={carregando}
            className="w-full bg-red-600 hover:bg-red-700 transition-all py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {carregando ? 'Processando...' : <><LogIn size={18} /> Entrar no Sistema</>}
          </button>

          <div className="flex items-center gap-3 my-8 opacity-20">
            <div className="flex-1 h-px bg-slate-500" />
            <span className="text-slate-500 text-[10px] font-black uppercase">Segurança</span>
            <div className="flex-1 h-px bg-slate-500" />
          </div>

          <button
            type="button"
            className={`w-full border rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-all flex items-center justify-center gap-2 ${
              tema === 'dark' ? 'border-slate-700/50' : 'border-slate-200'
            }`}
            onClick={() => alert('Procure o administrador.')}
          >
            <ShieldCheck size={14} />
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  )
}