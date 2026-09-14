import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();  
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let data;
      if (role === 'student') {
        data = await authService.studentLogin(identifier, password);
        localStorage.setItem('@DesafioDoDia:token', data.access_token);
        
        navigate('/dashboard'); 
        
      } else {
        data = await authService.teacherLogin(identifier, password);
        localStorage.setItem('@DesafioDoDia:token', data.access_token);
        
        navigate('/teacher-dashboard'); 
      }
      
    } catch (error) {
      setErrorMsg('ERRO: CREDENCIAIS INVÁLIDAS OU CORROMPIDAS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // container raiz: fundo escuro e o truque do grid pattern com css nativo
    <div 
      className="min-h-screen bg-[var(--color-cyber-dark)] flex items-center justify-center p-6 font-sans relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(rgba(0, 255, 102, 0.2) 2px, transparent 2px)',
        backgroundSize: '30px 30px'
      }}
    >
      
      {/* tipografia colossal de fundo (maximalismo puro, rotacionado e com opacidade baixa) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-10">
        <h1 className="font-display text-[20vw] font-black uppercase text-[var(--color-acid-green)] leading-none -rotate-6 whitespace-nowrap">
          SYSTEM_
        </h1>
      </div>

      {/* janela de sistema retro-arcade (com leve rotacao -rotate-1 para dar o tom de fanzine) */}
      <div className="relative z-10 w-full max-w-md bg-black border-[4px] border-[var(--color-acid-green)] shadow-[8px_8px_0px_0px_var(--color-acid-green)] -rotate-1 flex flex-col">
        
        {/* barra de titulo estilo macos/win98 */}
        <div className="bg-[var(--color-acid-green)] border-b-[4px] border-[var(--color-acid-green)] px-4 py-2 flex justify-between items-center">
          <div className="flex gap-2">
            <div className="w-4 h-4 bg-black border-2 border-black"></div>
            <div className="w-4 h-4 bg-transparent border-2 border-black"></div>
            <div className="w-4 h-4 bg-transparent border-2 border-black"></div>
          </div>
          <span className="font-mono font-black text-black text-sm tracking-widest uppercase">
            AUTH_GATEWAY.EXE
          </span>
        </div>

        {/* cabecalho interno com a space grotesk (font-display) */}
        <div className="p-8 pb-4 text-center bg-black">
          <h1 className="font-display text-5xl font-black uppercase tracking-tighter text-white">
            DESAFIO<br/>DO DIA
          </h1>
        </div>

        {/* abas de selecao com tipografia monoespacada */}
        <div className="flex border-b-[4px] border-[var(--color-acid-green)] bg-black">
          <button 
            type="button"
            onClick={() => { setRole('student'); setIdentifier(''); setPassword(''); setErrorMsg(''); }}
            className={`flex-1 py-4 font-mono font-bold text-sm tracking-widest uppercase border-r-[4px] border-[var(--color-acid-green)] transition-colors ${role === 'student' ? 'bg-[var(--color-acid-green)] text-black' : 'text-[var(--color-acid-green)] hover:bg-[#003311]'}`}
          >
            [ ALUNO ]
          </button>
          <button 
            type="button"
            onClick={() => { setRole('teacher'); setIdentifier(''); setPassword(''); setErrorMsg(''); }}
            className={`flex-1 py-4 font-mono font-bold text-sm tracking-widest uppercase transition-colors ${role === 'teacher' ? 'bg-[var(--color-cyber-magenta)] text-white' : 'text-[var(--color-acid-green)] hover:bg-[#003311]'}`}
          >
            [ PROFESSOR ]
          </button>
        </div>

        {/* formulario de dados */}
        <form onSubmit={handleLogin} className="p-8 flex flex-col gap-6 bg-black">
          
          {errorMsg && (
            <div className="bg-[var(--color-cyber-magenta)] text-white font-mono font-bold p-3 text-center text-sm uppercase tracking-widest animate-pulse border-2 border-white">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-mono font-bold text-xs tracking-widest text-[var(--color-acid-green)] uppercase">
              &gt; {role === 'student' ? 'MATRÍCULA' : 'E-MAIL'}
            </label>
            <input 
              type={role === 'student' ? 'text' : 'email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={role === 'student' ? 'Ex: 202612345' : 'prof@escola.com'}
              required
              className="bg-transparent border-[3px] border-[var(--color-acid-green)] text-white p-4 font-mono font-bold text-lg focus:outline-none focus:bg-[#002200] transition-colors placeholder:text-gray-600"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono font-bold text-xs tracking-widest text-[var(--color-acid-green)] uppercase">
              &gt; {role === 'student' ? 'PIN_CODE' : 'PASSWORD'}
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              maxLength={role === 'student' ? 4 : undefined}
              required
              className="bg-transparent border-[3px] border-[var(--color-acid-green)] text-white p-4 font-mono font-bold text-lg focus:outline-none focus:bg-[#002200] transition-colors placeholder:text-gray-600"
            />
          </div>

          {/* botao com rotacao contraria (rotate-1) gerando o caos controlado do acid graphic */}
          <button 
            type="submit"
            disabled={loading}
            className="mt-6 bg-[var(--color-acid-green)] text-black border-[4px] border-[var(--color-acid-green)] py-4 font-display font-black text-2xl uppercase tracking-widest hover:bg-[var(--color-cyber-cyan)] hover:border-[var(--color-cyber-cyan)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-cyber-magenta)] transition-all disabled:opacity-50 rotate-1"
          >
            {loading ? 'INICIANDO...' : 'ACESSAR_'}
          </button>
        </form>

      </div>
    </div>
  );
}