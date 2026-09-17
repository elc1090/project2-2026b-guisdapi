# project2-2026b-guisdapi

# Projeto: Aplicação com persistência de dados em backend

![Falta colocar GIF](./moho_follow_through2.gif "GIF animado do projeto")

## Acesso

https://project2-2026b-guisdapi.vercel.app/

## Desenvolvedor(a)

Nome: Guilherme Serafini Dapieve
Curso: Sistemas da Informação

## Proposta

Desafio do dia, semelhante a um dos exemplos do primeiro projeto, mas com nova arquitetura usando banco de dados não relacional. Mais funcionalidades:

* Estatísticas coletivas da turma
* Sistema de sequência (streak) e histórico próprio
* Modo contra o relógio com temporizador
* Calendário com histórico de desafios
* Área do professor e do aluno

## Parceria/cliente/usuário

Parceria: Guilherme de Cezaro Martini

## Feedback/comentário da parceria/cliente/usuário

Achei a estética muito bonita e diferente da aplicação original, tentando deixar mais "cyber" conforme foi pedido, achei muito bem executado. Uma coisa que achei muito boa foi a autenticação onde é separado por professor ou aluno e o aluno deve inserir uma turma.
Outras funcionalidades foram cumpridas muito bem também, com presença de streak, estatisticas e leaderboard.
No geral achei que foi bem executado e por mais que tenha sido inspirado no jogo já existente, parece muito original.

## Desenvolvimento

### Processo

Comecei o projeto instalando os frameworks: React com Vite para o frontend, FastAPI no backend e configurando o MongoDB como banco. Criei um ambiente virtual com o venv para isolar as dependências em Python, e instalei também o Motor do MongoDB junto com o FastAPI, para o acesso assíncrono das consultas.

A primeira parte que foquei foi o backend. Fiz a organização das rotas com o `APIRouter` do FastAPI, separando em módulos por assunto (professores, alunos, desafios) em vez de deixar tudo em um arquivo só, isso ajudou a não me perder conforme o projeto foi crescendo. A primeira rota que criei foi a de professores, e usei bastante a interface do Swagger (gerada automaticamente pelo FastAPI) para visualizar e testar as rotas enquanto ia desenvolvendo, achei bem interessante essa parte.

Depois fui para a implementação da autentificação. Fiz a parte do login do usuário com JWT (JSON Web Token), onde o próprio token carrega o id do usuário e o papel dele (aluno ou professor), sem precisar fazer um acesso extra ao banco toda hora pra saber quem está fazendo a requisição. As senhas ficaram protegidas com bcrypt, e o Pydantic ficou responsável por validar tudo que entrava e saía da API, desde os dados de cadastro até garantir que ninguém mandasse um PIN fora do padrão de 4 dígitos. Com isso, montei o fluxo do professor: cadastro, login e criação de turma, que gera um código de convite único de 6 caracteres pro aluno usar depois pra entrar. Em seguida montei a parte do aluno, com a validação desse código de convite.

Com a autenticação funcionando, parti pros desafios em si: rota do desafio do dia, envio de resposta, cálculo de pontuação e do ranking da turma (feito direto no banco, pra não pesar no servidor), e a lógica de streak, que usa o horário UTC como padrão pra não dar problema com fuso horário.

Depois de grande parte do backend pronto, fui para o frontend: criação do visual da Dashboard do aluno e do professor, criação de serviços para interações na API, configuração e instalação da Axios pra fazer a comunicação com a API, incluindo o envio automático do token JWT nas requisições. Aí apareceram alguns problemas que foram chatos de resolver: erro de CORS, porque o front e o back rodam em portas separadas, um bloqueio de IP no MongoDB Atlas que travou minha conexão com o banco por um tempo, alguns erros para mostrar a página depois de fazer o deploy e alguns bugs no aplicativo, como a lógica de soma do streak de dias seguidos não estar funcionando muito bem. Depois disso fui acrescentando funcionalidades que ainda faltavam, como edição e exclusão de turmas e desafios.

Usei IA como apoio em grande parte do processo.

### Trechos de código

**1. Autenticação e geração do token JWT**

```python
# routes/auth.py

# verifica se o pin de 4 dígitos bate com o hash criptografado
if not verify_password(credentials.pin, user["hashed_pin"]):
    raise HTTPException(status_code=401, detail="matricula ou pin incorretos")

# prepara os dados do jwt do aluno anexando a turma
token_data = {
    "sub": str(user["_id"]),
    "role": "student",
    "classroom_id": str(user["classroom_id"])  # fundamental para o envio das respostas depois
}

# gera o token assinado
token = create_access_token(token_data)
```

Neste trecho, é destacado a camada de segurança da API. As senhas e PINs nunca transitam ou são salvos em texto puro; é usado hashing para validação. Além disso, a arquitetura de login é baseada em JWT (JSON Web Tokens). É injetado o `classroom_id` diretamente no token do aluno, o que elimina a necessidade de fazer consultas extras ao banco de dados em cada requisição para descobrir de qual turma ele faz parte.

**2. Validação de propriedade da turma**

```python
# routes/challenges.py

# garante que o professor logado seja o dono da turma que criou o desafio
classroom = await db["classrooms"].find_one({
    "_id": ObjectId(challenge["classroom_id"]),
    "teacher_id": teacher_id
})

if not classroom:
    raise HTTPException(status_code=403, detail="voce nao tem permissao para ver os dados desta turma")
```

Um erro comum em APIs REST é a falta de validação de propriedade (Broken Object Level Authorization). Neste endpoint, que busca as submissões dos alunos, antes de devolver os dados a API cruza o `teacher_id` extraído do token JWT com o dono da turma registrada no banco. Se um professor tentar acessar pelo link o desafio de outro professor, a API retorna um erro 403 (Proibido).

**3. Bloqueio de tela para desafios passados**

```jsx
// pages/Dashboard.jsx

if (isToday) {
  const todayData = await challengesService.getTodayChallenge();
  setChallenge(todayData);
  // se já respondeu hoje, bloqueia a tela
  setIsReadOnly(dayData?.has_submitted || false);
} else {
  const pastChallenge = await challengesService.getChallengeById(dayData.challenge_id);
  setChallenge(pastChallenge);
  // dias passados SEMPRE ficam bloqueados (modo leitura), respondidos ou não
  setIsReadOnly(true);
}
```

No frontend, a separação entre o engajamento educacional e a parte disciplinar foi controlada por um único estado React chamado `isReadOnly`. Quando o aluno clica em um dia no carrossel de desafios, a função avalia se a questão é do passado ou se já foi respondida. Ao setar `isReadOnly(true)`, toda a interface reage instantaneamente, bloqueando os botões de envio e exibindo apenas a leitura, garantindo que o aluno possa rever o conteúdo atrasado sem burlar a lógica da ofensiva diária.

## Tecnologias

### Linguagens e afins

- React (com Vite)
- FastAPI (Python)
- MongoDB (com o driver assíncrono Motor)
- Pydantic (validação de dados)
- Tailwind CSS
- Axios
- react-router-dom
- JWT (JSON Web Token) / OAuth2 para autenticação
- bcrypt (hash de senhas)
- Vercel (deploy do frontend) + Render (deploy do backend)

### Ambiente de desenvolvimento

- VS Code
- Gemini Pro
- Claude Free
- ESLint (para o frontend em JavaScript)
- venv (ambiente virtual do Python)
- Uvicorn (servidor ASGI para rodar o FastAPI)
- Swagger (interface automática de documentação e teste das rotas da API)
- MongoDB Atlas (banco de dados na nuvem)

## Referências e créditos

- Documentação oficial do FastAPI
- Documentação do MongoDB / Motor (driver assíncrono)
- Documentação do Tailwind CSS
- Swagger UI, gerado automaticamente pelo FastAPI, usado para testar e validar as rotas durante o desenvolvimento
- Inspiração na aplicação web [Challenge of the Day](https://github.com/elc1090/demo-challenge-of-the-day) desenvolvida pela professora Andrea Schwertner Charão.

---

Projeto entregue para a disciplina de [Desenvolvimento de Software para a Web](http://github.com/andreainfufsm/elc1090-2026b) em 2026b