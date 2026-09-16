import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  
  // Modos e Papéis
  const [isLoginMode, setIsLoginMode] = useState(true); // true = Login, false = Cadastro
  const [role, setRole] = useState('student');
  
  // Campos do Formulário
  const [name, setName] = useState(''); // Usado apenas no cadastro
  const [identifier, setIdentifier] = useState(''); // Matrícula (aluno) ou Email (professor)
  const [password, setPassword] = useState(''); // PIN (aluno) ou Senha (professor)
  const [classroomCode, setClassroomCode] = useState(''); // Usado apenas no cadastro de aluno

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Limpa os campos quando troca de aba ou modo
  const resetFields = () => {
    setIdentifier(''); setPassword(''); setName(''); setClassroomCode(''); setErrorMsg('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // MODO CADASTRO
      if (!isLoginMode) {
        if (role === 'student') {
          await authService.registerStudent(name, identifier, classroomCode, password);
        } else {
          await authService.registerTeacher(name, identifier, password);
        }
        // Após cadastrar, fazemos o login automaticamente por baixo dos panos! (Melhor UX)
      }

      // MODO LOGIN (Ou Auto-Login após cadastro)
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
      // Se for erro do backend (ex: matrícula já existe), o Axios coloca a mensagem em error.response.data.detail
      const backendError = error.response?.data?.detail;
      setErrorMsg(backendError ? `ERRO: ${backendError}` : 'ERRO: CREDENCIAIS INVÁLIDAS OU CORROMPIDAS.');
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
        <form onSubmit={handleAuth} className="p-8 flex flex-col gap-6 bg-black">
          
          {errorMsg && (
            <div className="bg-[var(--color-cyber-magenta)] text-white font-mono font-bold p-3 text-center text-sm uppercase tracking-widest animate-pulse border-2 border-white">
              {errorMsg}
            </div>
          )}

          {/* CAMPO: NOME (Só aparece no cadastro) */}
          {!isLoginMode && (
            <div className="flex flex-col gap-2 animate-fade-in-up">
              <label className="font-mono font-bold text-xs tracking-widest text-[var(--color-acid-green)] uppercase">
                &gt; NOME COMPLETO
              </label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Guilherme S. Dapieve"
                required
                className="bg-transparent border-[3px] border-[var(--color-acid-green)] text-white p-4 font-mono font-bold text-lg focus:outline-none focus:bg-[#002200] transition-colors"
              />
            </div>
          )}

          {/* CAMPO: MATRÍCULA OU EMAIL */}
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

          {/* CAMPO: CÓDIGO DA TURMA (Só aparece no cadastro de aluno) */}
          {!isLoginMode && role === 'student' && (
            <div className="flex flex-col gap-2 animate-fade-in-up">
              <label className="font-mono font-bold text-xs tracking-widest text-[var(--color-acid-green)] uppercase">
                &gt; CÓDIGO DE CONVITE DA TURMA
              </label>
              <input 
                type="text"
                value={classroomCode}
                onChange={(e) => setClassroomCode(e.target.value)}
                placeholder="Ex: X7Y8Z9"
                required
                maxLength={6}
                className="bg-transparent border-[3px] border-[var(--color-acid-green)] text-white p-4 font-mono font-bold text-lg focus:outline-none focus:bg-[#002200] transition-colors"
              />
            </div>
          )}

          {/* CAMPO: PIN OU SENHA */}
          <div className="flex flex-col gap-2">
            <label className="font-mono font-bold text-xs tracking-widest text-[var(--color-acid-green)] uppercase">
              &gt; {role === 'student' ? 'PIN_CODE (4 DÍGITOS)' : 'PASSWORD'}
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="****"
              maxLength={role === 'student' ? 4 : undefined}
              required
              className="bg-transparent border-[3px] border-[var(--color-acid-green)] text-white p-4 font-mono font-bold text-lg focus:outline-none focus:bg-[#002200] transition-colors placeholder:text-gray-600"
            />
          </div>

          {/* BOTAO PRINCIPAL */}
          <button 
            type="submit"
            disabled={loading}
            className="mt-4 bg-[var(--color-acid-green)] text-black border-[4px] border-[var(--color-acid-green)] py-4 font-display font-black text-2xl uppercase tracking-widest hover:bg-[var(--color-cyber-cyan)] hover:border-[var(--color-cyber-cyan)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-cyber-magenta)] transition-all disabled:opacity-50 rotate-1"
          >
            {loading ? 'PROCESSANDO...' : isLoginMode ? 'ACESSAR_' : 'CRIAR_REGISTRO'}
          </button>

          {/* BOTAO PARA ALTERNAR ENTRE LOGIN E CADASTRO */}
          <button
            type="button"
            onClick={() => { setIsLoginMode(!isLoginMode); resetFields(); }}
            className="font-mono text-sm text-gray-400 hover:text-[var(--color-cyber-magenta)] uppercase tracking-widest transition-colors mt-2"
          >
            {isLoginMode ? '[ NÃO TEM CONTA? CADASTRAR_ ]' : '[ JÁ TEM CONTA? LOGIN_ ]'}
          </button>
        </form>

      </div>
    </div>
  );
}