import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { challengesService } from '../services/challengesService';

const ITEM_WIDTH = 48; 
const ITEM_GAP = 12; 
const ITEM_SLOT = ITEM_WIDTH + ITEM_GAP;
const MAX_VISIBLE = 10;
const MIN_VISIBLE = 4;

function Dashboard() {
  const navigate = useNavigate();
  
  // Estados de busca do banco de dados
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados da interação do aluno
  const [selectedOption, setSelectedOption] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados da submissão gamificada
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Estados do carrossel/calendário
  const currentDate = new Date();
  const todayDay = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const wrapperRef = useRef(null); 
  const sliderRef = useRef(null); 
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE);

  const recalcVisibleCount = useCallback(() => {
    if (!wrapperRef.current) return;
    const available = wrapperRef.current.offsetWidth;
    const fits = Math.floor((available + ITEM_GAP) / ITEM_SLOT);
    setVisibleCount(Math.min(MAX_VISIBLE, Math.max(MIN_VISIBLE, fits)));
  }, []);

  useEffect(() => {
    recalcVisibleCount();
    window.addEventListener('resize', recalcVisibleCount);
    return () => window.removeEventListener('resize', recalcVisibleCount);
  }, [recalcVisibleCount]);

  useEffect(() => {
    if (sliderRef.current) {
      const todayIndex = todayDay - 1; 
      sliderRef.current.scrollLeft = todayIndex * ITEM_SLOT;
    }
  }, [visibleCount, todayDay]);

  // Busca o desafio ao carregar a página
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const token = localStorage.getItem('@DesafioDoDia:token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const data = await challengesService.getTodayChallenge();
        setChallenge(data);
      } catch (error) {
        console.error("Erro ao buscar desafio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [navigate]);

  // Função disparada ao clicar em INJETAR_RESPOSTA
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Pega o texto exato da alternativa escolhida
      const optionText = challenge.options[selectedOption];
      
      // Envia para o backend
      const result = await challengesService.submitAnswer(challenge.id, optionText, reasoning);
      
      // Guarda a pontuação e aciona a tela de sucesso
      setSubmissionResult(result);
      setHasSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("ERRO_ DE CONEXÃO. O servidor recusou a injeção de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções de arrastar o mouse do calendário
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const trackWidth = visibleCount * ITEM_SLOT - ITEM_GAP;
  const sidePadding = Math.max(0, trackWidth / 2 - ITEM_WIDTH / 2);

  return (
    <div 
      className="min-h-screen bg-[var(--color-cyber-dark)] py-8 md:py-12 font-sans text-white overflow-x-hidden relative"
      style={{
        backgroundImage: 'radial-gradient(rgba(0, 255, 102, 0.15) 2px, transparent 2px)',
        backgroundSize: '30px 30px'
      }}
    >
      <div className="absolute inset-0 flex items-start mt-20 justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
        <h1 className="font-display text-[25vw] font-black uppercase text-white leading-none rotate-2 whitespace-nowrap">
          RUNTIME_
        </h1>
      </div>

      <header className="relative z-10 max-w-5xl mx-auto px-8 md:px-12 flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <h1 className="font-display text-4xl font-black tracking-tighter uppercase text-[var(--color-acid-green)]">
          DESAFIO_DO_DIA
        </h1>

        <div className="flex items-center gap-4 font-mono font-bold text-xs tracking-widest uppercase">
          <div className="flex items-center h-10 border-[3px] border-[var(--color-acid-green)] bg-black text-[var(--color-acid-green)] px-4">
            [ TURMA: WEB-2026 ]
          </div>
          <div className="flex items-center h-10 gap-3 border-[3px] border-[var(--color-cyber-magenta)] bg-black text-[var(--color-cyber-magenta)] px-4 cursor-pointer hover:bg-[var(--color-cyber-magenta)] hover:text-white transition-colors">
            <span>&gt; GUILHERME</span>
            <div className="bg-current text-black h-5 w-5 flex items-center justify-center text-[10px]">👤</div>
          </div>
        </div>
      </header>

      <div ref={wrapperRef} className="relative z-10 w-full flex justify-center mb-12 px-8">
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{
            width: trackWidth > 0 ? `${trackWidth}px` : '100%',
            paddingLeft: `${sidePadding}px`,
            paddingRight: `${sidePadding}px`,
            maskImage: 'linear-gradient(to right, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)',
          }}
          className={`flex items-start overflow-x-auto pb-6 pt-4 gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {days.map((day) => {
            const isToday = day === todayDay;
            const isPast = day < todayDay;
            const isFuture = day > todayDay;
            const isStreak = day === todayDay - 1 || day === todayDay - 2;

            let circleClasses = "flex items-center justify-center w-12 h-12 font-mono font-bold text-sm shrink-0 relative transition-all select-none ";

            if (isStreak) {
              circleClasses += "bg-[var(--color-acid-green)] text-black border-[3px] border-[var(--color-acid-green)] shadow-[4px_4px_0px_0px_var(--color-acid-green)] -rotate-3";
            } else if (isToday) {
              circleClasses += "bg-[var(--color-cyber-magenta)] text-white border-[3px] border-white shadow-[4px_4px_0px_0px_white] scale-110 rotate-3";
            } else if (isFuture) {
              circleClasses += "bg-transparent border-[2px] border-dashed border-[#004411] text-[#006622]";
            } else if (isPast) {
              circleClasses += "bg-transparent border-[2px] border-[#004411] text-[#004411]";
            }

            return (
              <div key={day} id={isToday ? 'day-today' : `day-${day}`} className="flex flex-col items-center shrink-0">
                <div className={circleClasses}>
                  {day}
                  {isStreak && <span className="absolute -bottom-3 -right-3 text-lg drop-shadow-md pointer-events-none">🔥</span>}
                </div>
                {isToday && <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white mt-3"></div>}
              </div>
            );
          })}
        </div>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 mb-20">
        
        {loading ? (
          <div className="bg-black border-[4px] border-[var(--color-acid-green)] shadow-[8px_8px_0px_0px_var(--color-acid-green)] p-12 text-center">
            <h2 className="font-mono text-[var(--color-acid-green)] text-xl animate-pulse tracking-widest uppercase">
              &gt; CARREGANDO_SISTEMA...
            </h2>
          </div>
        ) : !challenge ? (
          <div className="bg-black border-[4px] border-[var(--color-cyber-magenta)] shadow-[8px_8px_0px_0px_var(--color-cyber-magenta)] p-12 text-center">
            <h2 className="font-display text-[var(--color-cyber-magenta)] text-2xl font-black uppercase">
              ERRO_404
            </h2>
            <p className="font-mono text-white mt-4 uppercase tracking-widest">
              Nenhum desafio encontrado para a sua turma hoje.
            </p>
          </div>
        ) : hasSubmitted && submissionResult ? (
          
          /* TELA DE RESULTADOS GAMIFICADA */
          <div className={`border-[4px] shadow-[8px_8px_0px_0px] p-12 text-center flex flex-col items-center animate-fade-in-up ${
            submissionResult.is_correct 
              ? 'bg-black border-[var(--color-acid-green)] shadow-[var(--color-acid-green)]' 
              : 'bg-black border-[var(--color-cyber-magenta)] shadow-[var(--color-cyber-magenta)]'
          }`}>
            <div className={`text-6xl mb-6 ${submissionResult.is_correct ? 'text-[var(--color-acid-green)]' : 'text-[var(--color-cyber-magenta)]'}`}>
              {submissionResult.is_correct ? '✔️' : '❌'}
            </div>
            
            <h2 className={`font-display text-3xl md:text-5xl font-black uppercase tracking-tighter ${
              submissionResult.is_correct ? 'text-[var(--color-acid-green)]' : 'text-[var(--color-cyber-magenta)]'
            }`}>
              {submissionResult.is_correct ? 'ACESSO_CONCEDIDO' : 'FALHA_CRÍTICA'}
            </h2>
            
            <div className={`w-16 h-[4px] my-6 ${submissionResult.is_correct ? 'bg-[var(--color-acid-green)]' : 'bg-[var(--color-cyber-magenta)]'}`}></div>
            
            {!submissionResult.is_correct && (
              <p className="font-mono text-white mt-2 uppercase tracking-widest leading-relaxed">
                A RESPOSTA CORRETA ERA:<br/>
                <span className="text-[var(--color-acid-green)] font-black">[{submissionResult.correct_answer}]</span>
              </p>
            )}

            <div className="mt-8 flex gap-6 font-mono font-black text-xl md:text-2xl">
              <div className="flex flex-col items-center border-[2px] border-white p-4">
                <span className="text-xs text-gray-400 mb-2 tracking-widest">XP_GANHO</span>
                <span className="text-[var(--color-cyber-cyan)]">+{submissionResult.score_earned}</span>
              </div>
              <div className="flex flex-col items-center border-[2px] border-white p-4">
                <span className="text-xs text-gray-400 mb-2 tracking-widest">STREAK</span>
                <span className="text-orange-500">{submissionResult.streak_updated} 🔥</span>
              </div>
            </div>
            
            <p className="font-mono text-gray-500 text-xs mt-8 uppercase tracking-widest">
              [ STATUS: RESPOSTA REGISTRADA. AGUARDE O PRÓXIMO CICLO. ]
            </p>
          </div>

        ) : (
          
          /* CARTÃO DO DESAFIO DO DIA */
          <div className="bg-black border-[4px] border-[var(--color-acid-green)] shadow-[8px_8px_0px_0px_var(--color-acid-green)] overflow-hidden flex flex-col">
            
            <div className="bg-[var(--color-acid-green)] border-b-[4px] border-[var(--color-acid-green)] px-4 py-2 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="w-4 h-4 bg-black border-2 border-black"></div>
                <div className="w-4 h-4 bg-transparent border-2 border-black"></div>
                <div className="w-4 h-4 bg-transparent border-2 border-black"></div>
              </div>
              <span className="font-mono font-black text-black text-sm tracking-widest uppercase">
                CHALLENGE_TODAY.EXE
              </span>
            </div>

            <div className="p-6 md:p-8 flex justify-between items-start">
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-2xl md:text-3xl font-black uppercase text-white mt-2">
                  {challenge.title}
                </h2>
              </div>
            </div>

            <div className="bg-[#050505] border-y-[2px] border-[#003311] text-[var(--color-acid-green)] p-6 md:p-8 w-full font-mono text-sm md:text-base leading-relaxed">
              <div className="flex gap-2 mb-6 items-center text-xs text-[#006622] uppercase tracking-widest">
                <span>&gt;_ input.txt</span>
              </div>
              <pre className="overflow-x-auto [scrollbar-width:none] whitespace-pre-wrap">
                <code>{challenge.content}</code>
              </pre>
            </div>

            <div className="p-6 md:p-8 bg-black">
              <p className="font-mono text-[var(--color-acid-green)] font-bold text-sm tracking-widest mb-6 uppercase">
                &gt; ESCOLHA A RESPOSTA CORRETA:
              </p>
              
              <div className="flex flex-col gap-4 font-sans">
                {challenge.options.map((optionText, index) => {
                  const letra = String.fromCharCode(65 + index);
                  const isSelected = selectedOption === index;
                  
                  return (
                    <button 
                      key={index} 
                      onClick={() => setSelectedOption(index)}
                      className={`flex items-center w-full text-left border-[3px] p-3 md:p-4 transition-all group ${
                        isSelected 
                          ? 'bg-[#001100] border-[var(--color-acid-green)] text-white shadow-[4px_4px_0px_0px_var(--color-acid-green)] translate-y-[-2px] translate-x-[-2px]' 
                          : 'bg-black border-[#333] text-gray-400 hover:border-[var(--color-cyber-magenta)] hover:text-white'
                      }`}
                    >
                      <div className={`font-mono font-black w-10 shrink-0 text-xl transition-colors ${isSelected ? 'text-[var(--color-acid-green)]' : 'group-hover:text-[var(--color-cyber-magenta)]'}`}>
                        [ {letra} ]
                      </div>
                      <span className="ml-2 font-bold uppercase tracking-wide">
                        {optionText}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Área da Justificativa e Envio */}
              {selectedOption !== null && (
                <div className="mt-8 animate-fade-in-up">
                  <p className="font-mono text-[var(--color-cyber-magenta)] font-bold text-sm tracking-widest mb-4 uppercase">
                    &gt; JUSTIFIQUE SUA ESCOLHA_
                  </p>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="DIGITE SEU RACIOCÍNIO AQUI (MIN. 10 CARACTERES)..."
                    className="w-full h-32 bg-[#050505] border-[2px] border-[var(--color-cyber-magenta)] text-[var(--color-cyber-magenta)] p-4 font-mono text-sm uppercase placeholder:text-[#440044] focus:outline-none focus:border-white focus:text-white transition-colors resize-none"
                  />
                  
                  <button 
                    onClick={handleSubmit}
                    disabled={reasoning.trim().length < 10 || isSubmitting}
                    className="mt-6 w-full bg-[var(--color-cyber-magenta)] text-white font-display font-black text-2xl uppercase py-4 border-[3px] border-[var(--color-cyber-magenta)] hover:bg-black hover:text-[var(--color-cyber-magenta)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "PROCESSANDO..." : "INJETAR_RESPOSTA"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;