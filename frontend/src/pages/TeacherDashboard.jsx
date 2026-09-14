import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '../services/teacherService';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  
  // Estados para gerenciar os dados reais da API
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // ⚠️ TRUQUE PARA O TESTE: Cole o ID da turma que você usou no Swagger aqui
  const TEST_CLASSROOM_ID = '6aa6f14d3993007a123d9861';

  // 1. Busca os desafios da turma assim que o painel abre
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('@DesafioDoDia:token');
        if (!token) {
          navigate('/login');
          return;
        }

        const challengesData = await teacherService.getClassroomChallenges(TEST_CLASSROOM_ID);
        setChallenges(challengesData);
        
        // Se a turma tiver desafios, já seleciona o primeiro automaticamente
        if (challengesData.length > 0) {
          setSelectedChallengeId(challengesData[0].id);
        }
      } catch (error) {
        console.error("Erro ao buscar desafios da turma:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  // 2. Busca as submissões sempre que o professor trocar o desafio selecionado
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedChallengeId) return;
      
      try {
        const subsData = await teacherService.getChallengeSubmissions(selectedChallengeId);
        setSubmissions(subsData);
      } catch (error) {
        console.error("Erro ao buscar submissões:", error);
      }
    };

    fetchSubmissions();
  }, [selectedChallengeId]);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Cálculos dinâmicos para o Dashboard
  const totalSubmissions = submissions.length;
  const correctSubmissions = submissions.filter(s => s.is_correct).length;
  const hitRate = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

  return (
    <div 
      className="min-h-screen bg-[var(--color-cyber-dark)] py-8 md:py-12 font-sans text-white overflow-x-hidden relative"
      style={{
        backgroundImage: 'radial-gradient(rgba(0, 255, 255, 0.15) 2px, transparent 2px)', 
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
        
        {loading ? (
          <div className="bg-black border-[4px] border-[var(--color-cyber-cyan)] shadow-[8px_8px_0px_0px_var(--color-cyber-cyan)] p-12 text-center">
            <h2 className="font-mono text-[var(--color-cyber-cyan)] text-xl animate-pulse tracking-widest uppercase">
              &gt; SINCRONIZANDO_BASE_DE_DADOS...
            </h2>
          </div>
        ) : (
          <>
            {/* Seletor de Desafios */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center bg-black border-[3px] border-[#333] p-4">
              <span className="font-mono text-[var(--color-cyber-cyan)] text-sm tracking-widest uppercase font-bold">
                &gt; INSPECIONAR_DESAFIO:
              </span>
              <select 
                value={selectedChallengeId}
                onChange={(e) => setSelectedChallengeId(e.target.value)}
                className="bg-[#050505] border-[2px] border-[var(--color-cyber-cyan)] text-white font-mono text-sm p-2 outline-none cursor-pointer flex-1 uppercase"
              >
                {challenges.map(challenge => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title} [{new Date(challenge.scheduled_date).toLocaleDateString('pt-BR')}]
                  </option>
                ))}
              </select>
            </div>

            {/* Métricas / Dashboard Rápido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-black border-[3px] border-[#333] p-6 flex flex-col transition-colors hover:border-[var(--color-cyber-cyan)]">
                <span className="font-mono text-gray-500 text-xs tracking-widest uppercase mb-2">Total de Submissões</span>
                <span className="font-display text-4xl text-white font-black">{totalSubmissions}</span>
              </div>
              <div className="bg-black border-[3px] border-[var(--color-cyber-cyan)] shadow-[4px_4px_0px_0px_var(--color-cyber-cyan)] p-6 flex flex-col translate-y-[-2px] translate-x-[-2px]">
                <span className="font-mono text-[var(--color-cyber-cyan)] text-xs tracking-widest uppercase mb-2">Taxa de Acerto</span>
                <span className="font-display text-4xl text-[var(--color-cyber-cyan)] font-black">
                  {hitRate}%
                </span>
              </div>
              <div className="bg-black border-[3px] border-[var(--color-acid-green)] p-6 flex flex-col">
                <span className="font-mono text-[var(--color-acid-green)] text-xs tracking-widest uppercase mb-2">Status da Turma</span>
                <span className="font-display text-2xl text-[var(--color-acid-green)] font-black mt-1">
                  {hitRate >= 70 ? 'EXCELENTE' : hitRate >= 40 ? 'ATENÇÃO' : 'CRÍTICO'}
                </span>
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
                {submissions.length === 0 ? (
                   <p className="font-mono text-gray-500 text-center uppercase tracking-widest py-8">
                     Nenhuma resposta registrada para este desafio ainda.
                   </p>
                ) : (
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
                            <button className="font-mono text-xs border-[2px] border-[#333] px-3 py-1 text-gray-400 hover:text-white hover:border-white transition-all shrink-0">
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
                            <p className="font-mono text-[#005555] text-[10px] mt-4 tracking-widest uppercase">
                              ENVIADO EM: {new Date(sub.submitted_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}