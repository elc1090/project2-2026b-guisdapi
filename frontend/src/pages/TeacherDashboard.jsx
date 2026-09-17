import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '../services/teacherService';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // estados do modal de nova turma
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [isSubmittingClassroom, setIsSubmittingClassroom] = useState(false);

  // estados do modal de novo desafio
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cContent, setCContent] = useState('');
  const [cOptions, setCOptions] = useState(['', '', '', '']); 
  const [cCorrectIndex, setCCorrectIndex] = useState(0); 
  const [cDate, setCDate] = useState('');

  // estados do modal de edicao de turma
  const [isEditClassroomModalOpen, setIsEditClassroomModalOpen] = useState(false);
  const [editClassroomName, setEditClassroomName] = useState('');

  // estados do modal de edicao de desafio
  const [isEditChallengeMode, setIsEditChallengeMode] = useState(false);

  // limpa e abre o modal para criacao
  const openCreateChallengeModal = () => {
    setCTitle('');
    setCContent('');
    setCOptions(['', '', '', '']);
    setCCorrectIndex(0);
    setCDate('');
    setIsEditChallengeMode(false);
    setIsChallengeModalOpen(true);
  };

  // preenche e abre o modal para edicao
  const openEditChallengeModal = () => {
    const desafioAtual = challenges.find(c => c.id === selectedChallengeId);
    if (desafioAtual) {
      setCTitle(desafioAtual.title);
      setCContent(desafioAtual.content);
      setCOptions(desafioAtual.options);
      setCCorrectIndex(desafioAtual.options.indexOf(desafioAtual.correct_answer));
      setCDate(desafioAtual.scheduled_date.split('T')[0]); 
      setIsEditChallengeMode(true);
      setIsChallengeModalOpen(true);
    }
  };

  // processa a criacao ou atualizacao de um desafio
  const handleSubmitChallenge = async (e) => {
    e.preventDefault();
    if (!selectedClassroomId) {
      alert("Selecione uma turma primeiro!");
      return;
    }
    
    setIsSubmittingChallenge(true);
    try {
      const payload = {
        title: cTitle,
        content: cContent,
        options: cOptions,
        correct_answer: cOptions[cCorrectIndex],
        scheduled_date: cDate
      };

      if (isEditChallengeMode) {
        const updatedDesafio = await teacherService.updateChallenge(selectedChallengeId, payload);
        setChallenges(challenges.map(c => c.id === selectedChallengeId ? updatedDesafio : c));
      } else {
        const novoDesafio = await teacherService.createChallenge(selectedClassroomId, payload);
        setChallenges([novoDesafio, ...challenges]);
        setSelectedChallengeId(novoDesafio.id);
      }
      
      setIsChallengeModalOpen(false);
      setCTitle('');
      setCContent('');
      setCOptions(['', '', '', '']);
      setCCorrectIndex(0);
      setCDate('');
    } catch (error) {
      alert("ERRO_ CRITICO: Nao foi possivel processar o desafio. Verifique os dados.");
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  // executa a exclusao de um desafio com confirmacao dupla
  const handleDeleteChallenge = async () => {
    if (!selectedChallengeId) return;
    
    const confirm = window.confirm("ATENCAO: Deletar este desafio apagara TODAS as metricas e respostas dos alunos para esta questao especifica. Continuar?");
    
    if (confirm) {
      try {
        await teacherService.deleteChallenge(selectedChallengeId);
        
        const novosDesafios = challenges.filter(c => c.id !== selectedChallengeId);
        setChallenges(novosDesafios);
        
        if (novosDesafios.length > 0) {
          setSelectedChallengeId(novosDesafios[0].id);
        } else {
          setSelectedChallengeId('');
          setSubmissions([]); 
        }
      } catch (error) {
        alert("ERRO_ CRITICO: Falha ao deletar o desafio.");
      }
    }
  };

  // atualiza o array de opcoes de resposta dinamicamente
  const handleOptionChange = (index, value) => {
    const novasOpcoes = [...cOptions];
    novasOpcoes[index] = value;
    setCOptions(novasOpcoes);
  };

  // cria uma turma e aplica atualizacao otimista
  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    setIsSubmittingClassroom(true);
    try {
      const novaTurma = await teacherService.createClassroom(newClassroomName);
      
      setClassrooms([...classrooms, novaTurma]);
      setSelectedClassroomId(novaTurma.id);
      setChallenges([]);
      setSubmissions([]);
      setSelectedChallengeId('');
      
      setIsClassroomModalOpen(false);
      setNewClassroomName('');
    } catch (error) {
      alert("ERRO_ CRITICO: Nao foi possivel criar a turma.");
    } finally {
      setIsSubmittingClassroom(false);
    }
  };

  // prepara o modal de edicao com o nome atual da turma
  const openEditClassroomModal = () => {
    const turmaAtual = classrooms.find(c => c.id === selectedClassroomId);
    if (turmaAtual) {
      setEditClassroomName(turmaAtual.name);
      setIsEditClassroomModalOpen(true);
    }
  };

  // atualiza o nome da turma no servidor e no estado local
  const handleEditClassroom = async (e) => {
    e.preventDefault();
    try {
      const updatedClassroom = await teacherService.updateClassroom(selectedClassroomId, editClassroomName);
      setClassrooms(classrooms.map(c => c.id === selectedClassroomId ? updatedClassroom : c));
      setIsEditClassroomModalOpen(false);
    } catch (error) {
      alert("ERRO_ CRITICO: Nao foi possivel renomear a turma.");
    }
  };

  // exclui a turma e redireciona os selects para o estado seguro
  const handleDeleteClassroom = async () => {
    if (!selectedClassroomId) return;
    
    const confirm = window.confirm("ATENCAO: Deletar esta turma apagara DEFINITIVAMENTE todos os alunos, desafios e respostas vinculadas a ela. Continuar?");
    
    if (confirm) {
      try {
        await teacherService.deleteClassroom(selectedClassroomId);
        
        const newClassrooms = classrooms.filter(c => c.id !== selectedClassroomId);
        setClassrooms(newClassrooms);
        
        if (newClassrooms.length > 0) {
          setSelectedClassroomId(newClassrooms[0].id);
          const challengesData = await teacherService.getClassroomChallenges(newClassrooms[0].id);
          setChallenges(challengesData);
          if (challengesData.length > 0) {
            setSelectedChallengeId(challengesData[0].id);
          } else {
            setSelectedChallengeId('');
            setSubmissions([]);
          }
        } else {
          setSelectedClassroomId('');
          setChallenges([]);
          setSelectedChallengeId('');
          setSubmissions([]);
        }
      } catch (error) {
        alert("ERRO_ CRITICO: Falha ao deletar o diretorio da turma.");
      }
    }
  };

  // inicializa o painel blindando vazamentos de memoria e expiracao de token
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('@DesafioDoDia:token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const classroomsData = await teacherService.getClassrooms();
        
        if (!isMounted) return;

        setClassrooms(classroomsData);
        
        if (classroomsData.length > 0) {
          const firstClassroom = classroomsData[0].id;
          setSelectedClassroomId(firstClassroom);
          
          const challengesData = await teacherService.getClassroomChallenges(firstClassroom);
          if (!isMounted) return;
          
          setChallenges(challengesData);
          if (challengesData.length > 0) {
            setSelectedChallengeId(challengesData[0].id);
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('@DesafioDoDia:token');
            navigate('/login');
        } else {
            console.error("erro ao sincronizar painel:", error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // gerencia a transicao de turmas limpando os estados dependentes
  const handleClassroomChange = async (e) => {
    const newClassroomId = e.target.value;
    setSelectedClassroomId(newClassroomId);
    setSelectedChallengeId(''); 
    setSubmissions([]); 
    setLoading(true);
    
    try {
      const challengesData = await teacherService.getClassroomChallenges(newClassroomId);
      setChallenges(challengesData);
      if (challengesData.length > 0) {
        setSelectedChallengeId(challengesData[0].id);
      }
    } catch (error) {
      console.error("erro ao alterar turma:", error);
    } finally {
      setLoading(false);
    }
  };

  // sincroniza a lista de submissoes quando o desafio selecionado muda
  useEffect(() => {
    let isMounted = true;
    
    const fetchSubmissions = async () => {
      if (!selectedChallengeId) return;
      try {
        const subsData = await teacherService.getChallengeSubmissions(selectedChallengeId);
        if (isMounted) setSubmissions(subsData);
      } catch (error) {
        console.error("erro ao buscar submissoes:", error);
      }
    };
    
    fetchSubmissions();
    
    return () => {
      isMounted = false;
    };
  }, [selectedChallengeId]);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // recalcula metricas da turma
  const totalSubmissions = submissions.length;
  const correctSubmissions = submissions.filter(s => s.is_correct).length;
  const hitRate = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

  // formata a data para exibir corretamente no select prevenindo timezone shift
  const formatSafeDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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
          <button
            onClick={() => setIsClassroomModalOpen(true)}
            className="flex items-center h-10 border-[3px] border-[var(--color-acid-green)] bg-[var(--color-acid-green)] text-black px-4 hover:bg-transparent hover:text-[var(--color-acid-green)] transition-colors"
          >
            + NOVA TURMA
          </button>
        </div>

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
            <div className="mb-4 flex flex-col md:flex-row gap-4 items-center bg-black border-[3px] border-[#333] p-4">
              <span className="font-mono text-[var(--color-acid-green)] text-sm tracking-widest uppercase font-bold">
                &gt; TURMA_ATIVA:
              </span>
              <select
                value={selectedClassroomId}
                onChange={handleClassroomChange}
                className="bg-[#050505] border-[2px] border-[var(--color-acid-green)] text-white font-mono text-sm p-2 outline-none cursor-pointer flex-1 uppercase"
              >
                {classrooms.length === 0 ? (
                  <option value="">NENHUMA TURMA ENCONTRADA</option>
                ) : (
                  classrooms.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} [CODIGO DE CONVITE: {c.invite_code}]
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={openEditClassroomModal}
                disabled={!selectedClassroomId}
                className="bg-[var(--color-acid-green)] text-black font-mono font-bold px-4 py-2 hover:bg-transparent hover:text-[var(--color-acid-green)] hover:border-[var(--color-acid-green)] border-[2px] border-[var(--color-acid-green)] transition-colors disabled:opacity-50 shrink-0"
              >
                [ EDITAR ]
              </button>
              <button
                onClick={handleDeleteClassroom}
                disabled={!selectedClassroomId}
                className="bg-[var(--color-cyber-magenta)] text-white font-mono font-bold px-4 py-2 hover:bg-transparent hover:text-[var(--color-cyber-magenta)] hover:border-[var(--color-cyber-magenta)] border-[2px] border-[var(--color-cyber-magenta)] transition-colors disabled:opacity-50 shrink-0"
              >
                [ DELETAR ]
              </button>
            </div>

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
                    {challenge.title} [{formatSafeDate(challenge.scheduled_date)}]
                  </option>
                ))}
              </select>
              
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={openEditChallengeModal}
                  disabled={!selectedChallengeId}
                  className="bg-[var(--color-acid-green)] text-black font-mono font-bold px-3 py-2 hover:bg-transparent hover:text-[var(--color-acid-green)] hover:border-[var(--color-acid-green)] border-[2px] border-[var(--color-acid-green)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  [ EDITAR ]
                </button>
                <button
                  onClick={handleDeleteChallenge}
                  disabled={!selectedChallengeId}
                  className="bg-[var(--color-cyber-magenta)] text-white font-mono font-bold px-3 py-2 hover:bg-transparent hover:text-[var(--color-cyber-magenta)] hover:border-[var(--color-cyber-magenta)] border-[2px] border-[var(--color-cyber-magenta)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  [ DELETAR ]
                </button>
                <button
                  onClick={openCreateChallengeModal}
                  disabled={!selectedClassroomId}
                  className="bg-[var(--color-cyber-cyan)] text-black font-mono font-bold px-4 py-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  + NOVO DESAFIO
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-black border-[3px] border-[#333] p-6 flex flex-col transition-colors hover:border-[var(--color-cyber-cyan)]">
                <span className="font-mono text-gray-500 text-xs tracking-widest uppercase mb-2">Total de Submissoes</span>
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
                  {hitRate >= 70 ? 'EXCELENTE' : hitRate >= 40 ? 'ATENCAO' : 'CRITICO'}
                </span>
              </div>
            </div>

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
                        <div
                          onClick={() => toggleRow(sub.id)}
                          className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer gap-4"
                        >
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`font-mono font-black text-xl w-8 text-center ${sub.is_correct ? 'text-[var(--color-acid-green)]' : 'text-[var(--color-cyber-magenta)]'}`}>
                              {sub.is_correct ? '🟢' : '🔴'}
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
                        
                        {expandedRow === sub.id && (
                          <div className="p-4 bg-[#001111] border-t-[2px] border-[#003333] animate-fade-in-up">
                            <p className="font-mono text-[var(--color-cyber-cyan)] font-bold text-xs tracking-widest mb-2 uppercase">
                              &gt; RACIOCINIO_DO_ALUNO:
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

      {isClassroomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-black border-[4px] border-[var(--color-acid-green)] shadow-[8px_8px_0px_0px_var(--color-acid-green)] p-8 max-w-md w-full relative animate-fade-in-up">
            <button
              onClick={() => setIsClassroomModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-acid-green)] font-mono font-bold text-xl hover:text-white"
            >
              [X]
            </button>
            <h2 className="font-display text-2xl font-black uppercase text-white mb-6">
              INICIALIZAR_NOVA_TURMA
            </h2>
            <form onSubmit={handleCreateClassroom} className="flex flex-col gap-4">
              <label className="font-mono font-bold text-xs tracking-widest text-[var(--color-acid-green)] uppercase">
                &gt; NOME DO DIRETORIO/TURMA
              </label>
              <input
                type="text"
                value={newClassroomName}
                onChange={(e) => setNewClassroomName(e.target.value)}
                placeholder="Ex: Paradigmas de Programacao"
                required
                minLength={3}
                className="bg-transparent border-[3px] border-[var(--color-acid-green)] text-white p-3 font-mono text-sm focus:outline-none focus:bg-[#002200] transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmittingClassroom}
                className="mt-4 bg-[var(--color-acid-green)] text-black border-[3px] border-[var(--color-acid-green)] py-3 font-display font-black text-xl uppercase tracking-widest hover:bg-[var(--color-cyber-cyan)] hover:border-[var(--color-cyber-cyan)] transition-all disabled:opacity-50"
              >
                {isSubmittingClassroom ? 'PROCESSANDO...' : 'CRIAR_INSTANCIA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-black border-[4px] border-[var(--color-cyber-cyan)] shadow-[8px_8px_0px_0px_var(--color-cyber-cyan)] p-6 md:p-8 max-w-2xl w-full relative animate-fade-in-up my-8">
            <button
              onClick={() => setIsChallengeModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-cyber-cyan)] font-mono font-bold text-xl hover:text-white"
            >
              [X]
            </button>
            
            <h2 className="font-display text-2xl font-black uppercase text-white mb-6 text-[var(--color-cyber-cyan)]">
              {isEditChallengeMode ? 'EDITAR_DESAFIO' : 'COMPILAR_NOVO_DESAFIO'}
            </h2>
            
            <form onSubmit={handleSubmitChallenge} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono font-bold text-xs text-[var(--color-cyber-cyan)]">TITULO</label>
                  <input type="text" value={cTitle} onChange={e => setCTitle(e.target.value)} required minLength={5} className="bg-transparent border-[2px] border-[#333] text-white p-2 font-mono text-sm focus:border-[var(--color-cyber-cyan)] outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono font-bold text-xs text-[var(--color-cyber-cyan)]">DATA DE EXECUCAO (AGENDAMENTO)</label>
                  <input type="date" value={cDate} onChange={e => setCDate(e.target.value)} required className="bg-transparent border-[2px] border-[#333] text-white p-2 font-mono text-sm focus:border-[var(--color-cyber-cyan)] outline-none custom-calendar-icon" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono font-bold text-xs text-[var(--color-cyber-cyan)]">CORPO DO DESAFIO (TEXTO/MARKDOWN)</label>
                <textarea value={cContent} onChange={e => setCContent(e.target.value)} required minLength={10} className="bg-[#050505] border-[2px] border-[#333] text-white p-2 font-mono text-sm focus:border-[var(--color-cyber-cyan)] outline-none h-24 resize-none" />
              </div>

              <div className="mt-4 mb-2 border-l-[4px] border-[var(--color-cyber-cyan)] pl-4">
                <p className="font-mono font-bold text-xs text-[var(--color-cyber-cyan)] mb-4">DEFINA AS ALTERNATIVAS E MARQUE A RESPOSTA CORRETA:</p>
                <div className="flex flex-col gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={cCorrectIndex === index}
                        onChange={() => setCCorrectIndex(index)}
                        className="w-5 h-5 accent-[var(--color-cyber-cyan)] cursor-pointer"
                      />
                      <span className="font-mono font-bold text-gray-500">[{String.fromCharCode(65 + index)}]</span>
                      <input
                        type="text"
                        value={cOptions[index]}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        required
                        placeholder={`Texto da alternativa ${String.fromCharCode(65 + index)}`}
                        className={`flex-1 bg-transparent border-b-[2px] p-2 font-mono text-sm outline-none transition-colors ${cCorrectIndex === index ? 'border-[var(--color-cyber-cyan)] text-white' : 'border-[#333] text-gray-400 focus:border-gray-500'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <button type="submit" disabled={isSubmittingChallenge} className="mt-4 bg-[var(--color-cyber-cyan)] text-black border-[3px] border-[var(--color-cyber-cyan)] py-3 font-display font-black text-xl uppercase tracking-widest hover:bg-white hover:border-white transition-all disabled:opacity-50">
                {isSubmittingChallenge ? 'COMPILANDO...' : (isEditChallengeMode ? 'ATUALIZAR_DESAFIO' : 'DEPLOY_DESAFIO')}
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditClassroomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-black border-[4px] border-[var(--color-acid-green)] shadow-[8px_8px_0px_0px_var(--color-acid-green)] p-8 max-w-md w-full relative animate-fade-in-up">
            <button
              onClick={() => setIsEditClassroomModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-acid-green)] font-mono font-bold text-xl hover:text-white"
            >
              [X]
            </button>
            <h2 className="font-display text-2xl font-black uppercase text-white mb-6">
              RENOMEAR_INSTANCIA
            </h2>
            <form onSubmit={handleEditClassroom} className="flex flex-col gap-4">
              <label className="font-mono font-bold text-xs tracking-widest text-[var(--color-acid-green)] uppercase">
                &gt; NOVO NOME DA TURMA
              </label>
              <input
                type="text"
                value={editClassroomName}
                onChange={(e) => setEditClassroomName(e.target.value)}
                required
                minLength={3}
                className="bg-transparent border-[3px] border-[var(--color-acid-green)] text-white p-3 font-mono text-sm focus:outline-none focus:bg-[#002200] transition-colors"
              />
              <button
                type="submit"
                className="mt-4 bg-[var(--color-acid-green)] text-black border-[3px] border-[var(--color-acid-green)] py-3 font-display font-black text-xl uppercase tracking-widest hover:bg-[var(--color-cyber-cyan)] hover:border-[var(--color-cyber-cyan)] transition-all"
              >
                ATUALIZAR_DIRETORIO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}