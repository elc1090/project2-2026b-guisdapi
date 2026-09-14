import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  
  // Mock de dados para visualizarmos a interface antes de plugar a API
  const [submissions] = useState([
    { id: '1', student_name: 'Ana Silva', option_selected: 'A página recarrega completamente', is_correct: false, score_earned: 50, reasoning: 'Achei que o form nativo faria o reload da página inteira pelo comportamento padrão do HTML.' },
    { id: '2', student_name: 'Carlos Santos', option_selected: 'O fetch é disparado e #out recebe o texto', is_correct: true, score_earned: 95, reasoning: 'O preventDefault impede o reload e o fetch assíncrono injeta a resposta no DOM.' },
    { id: '3', student_name: 'Mariana Costa', option_selected: 'O fetch é disparado e #out recebe o texto', is_correct: true, score_earned: 100, reasoning: 'Manipulação direta do DOM após a promessa ser resolvida com sucesso.' }
  ]);

  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div 
      className="min-h-screen bg-[var(--color-cyber-dark)] py-8 md:py-12 font-sans text-white overflow-x-hidden relative"
      style={{
        backgroundImage: 'radial-gradient(rgba(0, 255, 255, 0.15) 2px, transparent 2px)', // Ciano no fundo
        backgroundSize: '30px 30px'
      }}
    >
      <div className="absolute inset-0 flex items-start mt-20 justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
        <h1 className="font-display text-[25vw] font-black uppercase text-white leading-none -rotate-2 whitespace-nowrap">
          SYSADMIN_
        </h1>
      </div>

      <header className="relative z-10 max-w-6xl mx-auto px-8 md:px-12 flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <h1 className="font-display text-4xl font-black tracking-tighter uppercase text-[var(--color-cyber-cyan)]">
          PAINEL_DE_CONTROLE
        </h1>

        <div className="flex items-center gap-4 font-mono font-bold text-xs tracking-widest uppercase">
          <div className="flex items-center h-10 border-[3px] border-[var(--color-cyber-cyan)] bg-black text-[var(--color-cyber-cyan)] px-4">
            [ MODO_PROFESSOR ]
          </div>
          <div 
            onClick={() => {
              localStorage.removeItem('@DesafioDoDia:token');
              navigate('/login');
            }}
            className="flex items-center h-10 gap-3 border-[3px] border-red-500 bg-black text-red-500 px-4 cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
          >
            <span>&gt; LOGOUT</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 mb-20">
        
        {/* Métricas / Dashboard Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-black border-[3px] border-[#333] p-6 flex flex-col">
            <span className="font-mono text-gray-500 text-xs tracking-widest uppercase mb-2">Total de Submissões</span>
            <span className="font-display text-4xl text-white font-black">{submissions.length}</span>
          </div>
          <div className="bg-black border-[3px] border-[var(--color-cyber-cyan)] shadow-[4px_4px_0px_0px_var(--color-cyber-cyan)] p-6 flex flex-col translate-y-[-2px] translate-x-[-2px]">
            <span className="font-mono text-[var(--color-cyber-cyan)] text-xs tracking-widest uppercase mb-2">Taxa de Acerto</span>
            <span className="font-display text-4xl text-[var(--color-cyber-cyan)] font-black">
              {Math.round((submissions.filter(s => s.is_correct).length / submissions.length) * 100)}%
            </span>
          </div>
          <div className="bg-black border-[3px] border-[var(--color-acid-green)] p-6 flex flex-col">
            <span className="font-mono text-[var(--color-acid-green)] text-xs tracking-widest uppercase mb-2">Status da Turma</span>
            <span className="font-display text-2xl text-[var(--color-acid-green)] font-black mt-1">EXCELENTE</span>
          </div>
        </div>

        {/* Tabela Brutalista de Respostas */}
        <div className="bg-black border-[4px] border-[var(--color-cyber-cyan)] shadow-[8px_8px_0px_0px_var(--color-cyber-cyan)] overflow-hidden flex flex-col">
          <div className="bg-[var(--color-cyber-cyan)] border-b-[4px] border-[var(--color-cyber-cyan)] px-4 py-2 flex justify-between items-center">
             <span className="font-mono font-black text-black text-sm tracking-widest uppercase">
              SUBMISSOES_RECENTES.DAT
            </span>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="border-[2px] border-[#333] bg-[#050505] overflow-hidden transition-colors hover:border-gray-500">
                  {/* Linha Principal */}
                  <div 
                    onClick={() => toggleRow(sub.id)}
                    className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={`font-mono font-black text-xl w-8 text-center ${sub.is_correct ? 'text-[var(--color-acid-green)]' : 'text-[var(--color-cyber-magenta)]'}`}>
                        {sub.is_correct ? '✔️' : '❌'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sans font-bold uppercase text-white tracking-wide">{sub.student_name}</span>
                        <span className="font-mono text-xs text-gray-500 line-clamp-1">{sub.option_selected}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-auto gap-6">
                      <div className="font-mono text-[var(--color-cyber-cyan)] text-sm font-bold">
                        XP: {sub.score_earned}
                      </div>
                      <button className="font-mono text-xs border-[2px] border-[#333] px-3 py-1 text-gray-400 hover:text-white hover:border-white transition-all">
                        {expandedRow === sub.id ? '[-] FECHAR' : '[+] INSPECIONAR'}
                      </button>
                    </div>
                  </div>

                  {/* Detalhe Expandido (Justificativa) */}
                  {expandedRow === sub.id && (
                    <div className="p-4 bg-[#001111] border-t-[2px] border-[#003333] animate-fade-in-up">
                      <p className="font-mono text-[var(--color-cyber-cyan)] font-bold text-xs tracking-widest mb-2 uppercase">
                        &gt; RACIOCÍNIO_DO_ALUNO:
                      </p>
                      <p className="font-mono text-sm text-gray-300 leading-relaxed uppercase border-l-[2px] border-[var(--color-cyber-cyan)] pl-4 py-1">
                        {sub.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}