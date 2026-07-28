# Sistema de Apoio à Gestão do ADA (ADAManagement)

> Aplicação web para apoiar coordenadores de curso da UFES no **Acompanhamento do Desempenho Acadêmico (ADA)**, com foco nos estudantes enquadrados no **Plano de Acompanhamento de Estudos (PAE)** e no **Plano de Integralização Curricular (PIC)**.

Trabalho de Conclusão de Curso em Ciência da Computação — Departamento de Computação, Centro de Ciências Exatas, Naturais e da Saúde, Universidade Federal do Espírito Santo, Campus de Alegre.

| | |
|---|---|
| **Autor** | Matheus Eliziário Nardi |
| **Orientador** | Prof. Dr. Marcelo Otone Aguiar |
| **Banca** | Prof. Dr. Rodrigo Freitas da Silva · Prof. Msc. Giuliano Prado de Morais Giglio |
| **Defesa** | 09 de julho de 2026 |
| **Monografia** | [`tcc_matheus.pdf`](tcc_matheus.pdf) |

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Módulos e funcionalidades](#módulos-e-funcionalidades)
- [Perfis de acesso](#perfis-de-acesso)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Modelo de dados](#modelo-de-dados)
- [Importação de planilhas](#importação-de-planilhas)
- [Regras de negócio](#regras-de-negócio)
- [Rotas da interface](#rotas-da-interface)
- [API REST](#api-rest)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [Testes e CI](#testes-e-ci)
- [Limitações conhecidas](#limitações-conhecidas)
- [Documentação do TCC no repositório](#documentação-do-tcc-no-repositório)

---

## Sobre o projeto

O ADA é a política institucional da UFES de monitoramento sistemático da trajetória discente, operacionalizada pelo PAE e pelo PIC. Antes deste sistema, o acompanhamento era feito a partir de planilhas exportadas do sistema acadêmico, analisadas manualmente a cada semestre, com as intervenções registradas em documentos avulsos ou e-mails.

O **Sistema de Apoio à Gestão do ADA** substitui esse fluxo por uma aplicação web única que:

- importa as planilhas institucionais (CSV/XLSX) e consolida os dados em um banco relacional;
- classifica os estudantes por enquadramento acadêmico em cada semestre letivo;
- destaca casos prioritários (situação crítica e próximos da formatura);
- registra, de forma rastreável, as ações de acompanhamento realizadas com cada aluno;
- documenta o plano de integralização curricular dos alunos em PAE e PIC.

O desenvolvimento seguiu um modelo iterativo e incremental, com validação contínua junto ao coordenador do curso — o principal usuário final da ferramenta.

---

## Módulos e funcionalidades

### Autenticação e sessão
- Login por e-mail e senha; senhas armazenadas apenas como hash **BCrypt**.
- Token **JWT** (HS256) com validade de 24 horas, enviado como `Authorization: Bearer <token>` em todas as rotas protegidas.
- O token é guardado no `localStorage` e injetado automaticamente pelo interceptador do Axios.
- Ao carregar a aplicação, a sessão é revalidada em `GET /api/me`; token inválido ou expirado é descartado e o usuário volta ao login.

### Seletor global de semestre letivo
- Componente fixo no cabeçalho, alimentado por `GET /api/semesters` (ordenado do mais recente para o mais antigo).
- O semestre escolhido define o contexto de **todos** os relatórios, indicadores, ações e planos da sessão (`SemesterContext`).
- A lista é recarregada automaticamente após uma importação bem-sucedida.

### Página inicial — painel de módulos
- Cartões de acesso rápido para os módulos do sistema.
- Antes de renderizar, a página consulta cursos, registros, alunos e indicadores do semestre selecionado; **cartões sem dados aparecem esmaecidos e desabilitados**.
- Os cartões *Usuários do Sistema* e *Importar Dados* só são exibidos para o perfil `admin`.

### Importação de dados acadêmicos
- Upload de arquivos `.csv` (delimitado por `;`) ou `.xlsx`, no layout de exportação da UFES.
- Cabeçalhos reconhecidos por nome, sem diferenciar maiúsculas/minúsculas e ignorando espaços nas bordas.
- Estratégia **upsert** pela chave natural `matrícula + semestre`; reimportar a mesma planilha atualiza os registros sem duplicar.
- **Processamento transacional:** ou a planilha inteira é gravada, ou nada é alterado — um erro no meio do arquivo não deixa o banco pela metade.
- Semestres, cursos e alunos ainda não cadastrados são criados automaticamente durante o processamento.
- Ao final, a interface exibe o resumo real da importação: registros novos, atualizados e linhas ignoradas.

### Relatório acadêmico
- Situação de cada aluno no semestre selecionado: matrícula, nome, curso, status, detalhe do acompanhamento, percentual de carga horária concluída (`integralized_hours / total_hours`) e número de disciplinas obrigatórias pendentes.
- Filtros combináveis: matrícula, nome do aluno, curso e status.
- Dois modos de triagem, acionados pelo painel de indicadores via *query string*:
  - `?mode=critical` — alunos em situação crítica;
  - `?max_pending=6` — possíveis formandos.
- Cada linha dá acesso direto a **Registrar ação** (desabilitado para alunos em regularidade) e **Ver/Registrar plano de integralização** (habilitado apenas para PAE e PIC).

### Painel de indicadores
- Gráfico de rosca com a distribuição dos alunos por status no semestre; clicar em uma fatia abre o relatório acadêmico já filtrado por aquele status.
- Tabela **Alunos em Situação Crítica**, com trancamentos e semestres sem carga horária.
- Tabela **Próximos da Formatura (≤ 6 matérias pendentes)**, ordenada da menor pendência para a maior.
- Ambas as tabelas levam ao histórico individual do aluno.

### Alunos ativos
- Lista os alunos com registro acadêmico no semestre selecionado.
- Filtros por matrícula, nome, ano de ingresso e tipo de cota.
- Acesso ao histórico completo de cada aluno.

### Histórico individual do aluno
- Cabeçalho com nome, matrícula, curso, ano de ingresso e cota.
- Gráfico de linha com a evolução da carga horária integralizada ao longo dos semestres.
- Gráfico de barras com as disciplinas obrigatórias pendentes por semestre.
- Tabela de enquadramento (*timeline*): status, detalhe, trancamentos e semestres sem carga horária em cada período importado.

### Ações de acompanhamento
- Registro de intervenções por aluno **e por semestre**: data da ação, descrição (até 500 caracteres) e data opcional de resposta do aluno.
- Edição e exclusão em linha das ações já registradas.
- O servidor recusa a criação de ações para alunos com status `Em regularidade` (HTTP 403); a interface já desabilita o botão nesses casos.

### Plano de integralização curricular (PAE/PIC) — rodada de cadastro
O registro do plano foi reformulado para dar autonomia ao aluno. Em vez de um botão por linha no relatório, há agora uma **rodada de cadastro** controlada pela coordenação e uma **página dedicada**:

- A coordenação **abre uma rodada** informando explicitamente os **dois períodos-alvo** (ex.: `2026/1` e `2026/2`). Existe no máximo **uma rodada aberta** por vez.
- Os **alunos em PAE/PIC** entram na sua área e montam, **para cada um dos dois períodos**, as disciplinas que pretendem cursar (escolhidas do catálogo).
- Elegibilidade: como os períodos-alvo são **futuros** (ainda não importados), a permissão vem do **enquadramento mais recente** do aluno ser PAE ou PIC — não do registro do período-alvo.
- O plano de cada período é único por aluno e semestre; salvar de novo **atualiza** (substitui integralmente as disciplinas daquele período).
- A **coordenação também registra/edita** o plano de qualquer aluno (fallback), pela página de Planos de Integralização.

### Área do aluno (autoatendimento)
- **Autocadastro por matrícula**: o aluno informa a matrícula (que já existe na base importada) e define uma senha; o **login passa a ser a matrícula**. Não há e-mail nos dados institucionais, então a matrícula é a identidade.
- O aluno vê o **próprio enquadramento** e a rodada aberta, e só acessa os **próprios dados** — sem relatórios, sem outros alunos, sem funções administrativas.

### Disciplinas
- CRUD do catálogo de disciplinas (código e nome), ordenado alfabeticamente por nome.
- Código único, validado no servidor (HTTP 409 em caso de duplicidade).
- É a origem das disciplinas selecionáveis no plano de integralização.

### Cursos e coordenações
- Lista os cursos criados automaticamente durante a importação, com código, nome e coordenador.
- Filtros por código e por nome.

### Usuários e perfil
- **Gestão de usuários** (visível para `admin`): listagem com filtros por nome, e-mail e permissão; alternância de papel por *switch*; exclusão de contas. Os controles ficam desabilitados para o Admin Master e para o próprio usuário logado.
- **Cadastro de usuário** (visível para `admin`): nome, e-mail e senha inicial.
- **Meu perfil**: o usuário edita nome, e-mail e senha; a senha em branco mantém a atual, e qualquer senha informada é regravada como hash BCrypt.

### Tema claro/escuro
- Alternância pelo menu do cabeçalho, com preferência persistida em `localStorage` (`themeMode`).
- Tema MUI próprio (paleta esmeralda), definido em `frontend/src/theme.js` para os dois modos.

---

## Perfis de acesso

Há **três papéis**. A coordenação usa `admin`/`user` na tabela `users`; o aluno autentica contra a tabela `students` e recebe o papel `student`. O "Admin Master" não é um papel separado — é o usuário de `ID = 1`, protegido por regra de negócio.

| Perfil | Como é identificado | O que o diferencia |
|---|---|---|
| **Admin Master** | `users.id = 1` | Não pode ser excluído nem rebaixado. É semeado na primeira execução a partir de `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME`. |
| **Administrador** | `users.role = "admin"` | Único perfil aceito pelo servidor nas rotas administrativas: importação de planilhas e cadastro, listagem e exclusão de usuários. |
| **Usuário comum (coordenação)** | `users.role = "user"` | Consulta relatórios, indicadores e históricos; registra ações, disciplinas, rodadas e planos pela interface. Não vê os módulos administrativos. |
| **Aluno** | token `role = "student"`, ligado a `students.id` | Autocadastra-se por matrícula. Acessa **apenas os próprios dados** (seu enquadramento e seu plano de integralização). Sem relatórios, sem outros alunos, sem escrita de disciplinas. |

> A separação entre perfis é aplicada **no servidor** por middlewares: `RequireRole("admin")` nas rotas administrativas, `RequireStaff()` (admin ou user) nas rotas de coordenação, e `RequireSelfOrStaff()` nas rotas de plano/histórico — o aluno só acessa a própria matrícula. A interface também roteia por papel (aluno → área do aluno; staff → painel).

---

## Arquitetura

Arquitetura em camadas sobre o estilo cliente-servidor, com comunicação por HTTP/JSON e implantação integral na plataforma Render.

```
┌──────────────────────────────────────────────────────────┐
│  APRESENTAÇÃO — Single Page Application                  │
│  React 18 · Vite · Material UI · Recharts · Axios        │
│  Render Static Site (frontend-ada.onrender.com)          │
└───────────────────────────┬──────────────────────────────┘
                            │  REST / JSON
                            │  Authorization: Bearer <JWT>
┌───────────────────────────▼──────────────────────────────┐
│  SERVIÇOS — API REST                                     │
│  Go 1.24 · Gin · GORM · JWT · BCrypt                     │
│  Render Web Service                                      │
│                                                          │
│  routes ─▶ middlewares ─▶ controllers ─▶ services     │
│                                  └────────▶ models      │
└───────────────────────────┬──────────────────────────────┘
                            │  GORM / driver pgx · SSL
┌───────────────────────────▼──────────────────────────────┐
│  PERSISTÊNCIA                                            │
│  PostgreSQL gerenciado no Render (rede privada interna)  │
└──────────────────────────────────────────────────────────┘
```

**Backend — responsabilidades por camada**

| Camada | Papel |
|---|---|
| `app/` | *Composition root*: carrega a configuração, conecta o banco, executa o `AutoMigrate`, semeia o administrador e injeta as dependências (config → db → services → handlers → rotas). Também expõe `/health` e faz o desligamento gracioso do servidor. |
| `routes/` | Monta a API em `/api/v1` (com alias `/api`) e separa rota pública, rotas autenticadas e o grupo administrativo. |
| `middlewares/` | `Auth` valida o token JWT (somente HS256) e publica `userID`/`role` tipados no contexto; `RequireRole` restringe o grupo administrativo. |
| `controllers/` | Traduzem HTTP ↔ domínio: fazem o *binding* da requisição, chamam o service e serializam a resposta via DTOs. Não acessam o banco. |
| `controllers/dto/` | Contratos de resposta da API, desacoplados do esquema do banco (sem `deleted_at` e demais campos internos). |
| `services/` | Toda a regra de negócio e o acesso a dados, um service por agregado; recebem o `*gorm.DB` por construtor (sem estado global) e devolvem erros de domínio tipados. |
| `models/` | *Structs* GORM que descrevem as tabelas, os relacionamentos e os índices. |
| `database/` | Abertura da conexão com o PostgreSQL, retornada ao chamador. |
| `config/` | Carregamento e validação das variáveis de ambiente — o servidor não sobe com `JWT_SECRET` ou `DATABASE_URL` ausentes. |

Os erros de domínio são sentinelas tipadas (`ErrNotFound`, `ErrConflict`, `ErrForbidden`…) definidas nos services e traduzidas para HTTP em um único ponto (`respondError`); violações de índice único do PostgreSQL viram HTTP 409 sem consultas *check-then-act*. O CORS usa lista branca definida pela variável `ALLOWED_ORIGINS` (padrão: `http://localhost:5173` e a URL do frontend em produção).

**Frontend — estado global**

| Contexto | Conteúdo |
|---|---|
| `AuthContext` | Usuário autenticado, token, `login`, `logout` e revalidação da sessão. |
| `SemesterContext` | Semestres disponíveis, semestre selecionado (id e código) e recarga da lista. |
| `ThemeContext` | Modo claro/escuro e persistência da preferência. |

---

## Tecnologias

### Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| Go | 1.24 | Linguagem da camada de serviços |
| Gin | v1.9.1 | Roteamento HTTP, *middlewares* e binding de JSON |
| GORM | v1.31.1 | ORM e `AutoMigrate` do esquema |
| gorm.io/driver/postgres | v1.6.0 | Driver PostgreSQL (baseado em pgx v5) |
| golang-jwt/jwt | v5.2.0 | Geração e validação dos tokens JWT (HS256) |
| golang.org/x/crypto | v0.47.0 | BCrypt para hash de senhas |
| Viper | v1.21.0 | Leitura de configuração (`.env` e variáveis de ambiente) |
| Excelize | v2.10.0 | Leitura de planilhas `.xlsx` |
| gin-contrib/cors | v1.7.0 | Middleware de CORS com lista branca de origens |

### Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.2 | Biblioteca de interface (componentes + Context API) |
| Vite | 5.1 | Servidor de desenvolvimento e *build* de produção |
| Material UI | 5.15 | Componentes, tema e responsividade |
| Emotion | 11 | CSS-in-JS usado pelo MUI |
| React Router | 6.22 | Roteamento da SPA |
| Axios | 1.6 | Cliente HTTP com interceptador de token |
| Recharts | 3.6 | Gráficos de rosca, linha e barras |
| React Toastify | 10 | Notificações de feedback |

### Infraestrutura

| Serviço | Uso |
|---|---|
| Render | Static Site (frontend), Web Service (backend) e PostgreSQL gerenciado |
| GitHub | Controle de versão e gatilho da entrega contínua no Render |

---

## Estrutura do repositório

```
ADAManagement/
├── backend/
│   ├── cmd/server/main.go            # Ponto de entrada mínimo: chama app.Run()
│   ├── internal/
│   │   ├── app/app.go                # Composition root: config → db → services → handlers → servidor
│   │   ├── config/config.go          # Variáveis de ambiente validadas (Viper)
│   │   ├── database/postgres.go      # Conexão com o PostgreSQL (sem estado global)
│   │   ├── controllers/              # Handlers HTTP — tradução HTTP ↔ domínio
│   │   │   ├── respond.go               # respondError, bindJSON, paginação
│   │   │   ├── dto/dto.go               # contratos de resposta da API
│   │   │   ├── auth_controller.go       # login, /me, cadastro de usuário
│   │   │   ├── user_controller.go
│   │   │   ├── import_controller.go
│   │   │   ├── report_controller.go
│   │   │   ├── indicators_controller.go
│   │   │   ├── student_controller.go
│   │   │   ├── action_controller.go
│   │   │   ├── discipline_controller.go
│   │   │   ├── study_plan_controller.go
│   │   │   ├── student_auth_controller.go   # autocadastro e login do aluno
│   │   │   └── plan_round_controller.go     # abrir/fechar/consultar rodada
│   │   ├── middlewares/
│   │   │   ├── auth_middleware.go       # JWT (HS256) + userID/studentID/role no contexto
│   │   │   └── require_role.go          # RequireRole/RequireStaff/RequireSelfOrStaff
│   │   ├── models/                   # user, course, semester, student, academic_record, student_action,
│   │   │                             # discipline, study_plan, plan_round + constantes de status e papéis
│   │   ├── routes/routes.go          # /api/v1 (alias /api); grupos por papel (público/auth/self/staff/admin)
│   │   └── services/                 # Regras de negócio e acesso a dados (um por agregado)
│   │       ├── errors.go                # sentinelas de erro do domínio
│   │       ├── rules.go                 # RN02/RN03: aluno crítico e próximo da formatura
│   │       ├── auth_service.go          # login staff, JWT, seed do admin
│   │       ├── student_auth_service.go  # autocadastro/login do aluno + /me do aluno
│   │       ├── user_service.go
│   │       ├── import_service.go        # parse testável + persistência transacional
│   │       ├── report_service.go
│   │       ├── indicators_service.go
│   │       ├── student_service.go       # histórico + latestStatus (elegibilidade)
│   │       ├── action_service.go
│   │       ├── discipline_service.go
│   │       ├── study_plan_service.go    # elegibilidade por rodada + enquadramento recente
│   │       └── plan_round_service.go    # rodada de cadastro (1 aberta por vez)
│   ├── .env                          # não versionado
│   ├── .env.example
│   ├── go.mod
│   └── go.sum
│
├── frontend/
│   ├── public/
│   │   ├── _redirects                # SPA no Render: /* → /index.html 200
│   │   └── ufes-logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx            # cabeçalho da coordenação (seletor de semestre e menu)
│   │   │   ├── StudentHeader.jsx     # cabeçalho enxuto da área do aluno
│   │   │   └── PlanPeriodEditor.jsx  # editor do plano de um período (reusado aluno/coordenação)
│   │   ├── context/                  # AuthContext (login staff + aluno), SemesterContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── Login.jsx             # login da coordenação
│   │   │   ├── StudentLogin.jsx      # login do aluno (matrícula)
│   │   │   ├── StudentRegister.jsx   # autocadastro do aluno
│   │   │   ├── StudentPlanPage.jsx   # área do aluno: enquadramento + plano dos 2 períodos
│   │   │   ├── PlanRounds.jsx        # coordenação: abrir/fechar rodada + alunos PAE/PIC
│   │   │   ├── CoordinatorStudentPlan.jsx # coordenação: editar plano de um aluno
│   │   │   ├── Home.jsx              # painel de módulos
│   │   │   ├── Profile.jsx
│   │   │   ├── ImportData.jsx
│   │   │   ├── UsersList.jsx
│   │   │   ├── RegisterUser.jsx
│   │   │   ├── StudentProfile.jsx    # histórico individual
│   │   │   ├── StudentActions.jsx
│   │   │   ├── Disciplines.jsx
│   │   │   └── Reports/
│   │   │       ├── AcademicReport.jsx
│   │   │       ├── StudentsReport.jsx
│   │   │       ├── CoursesReport.jsx
│   │   │       └── IndicatorsReport.jsx
│   │   ├── services/api.js           # instância Axios + interceptador do token
│   │   ├── theme.js                  # tema MUI (claro/escuro)
│   │   ├── App.jsx                   # provedores e rotas (por papel)
│   │   └── main.jsx
│   ├── .env                          # não versionado
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── .github/workflows/ci.yml          # CI: gofmt, go vet, testes e builds
└── tcc_matheus.pdf                   # monografia
```

---

## Modelo de dados

Todas as tabelas herdam de `gorm.Model`, portanto possuem `id`, `created_at`, `updated_at` e `deleted_at` (exclusão lógica). O esquema é criado e sincronizado por `AutoMigrate` na inicialização do servidor.

Duas exceções à exclusão lógica: **usuários** e **disciplinas** são removidos fisicamente (*hard delete*), pois seus campos únicos (e-mail e código) impediriam recadastrar um valor já usado por um registro apagado apenas logicamente. Ao excluir uma disciplina, os vínculos dela com planos de integralização são removidos na mesma transação. `academic_records.status` possui índice simples, usado pelos relatórios e pelo dashboard.

```
users
  id · name · email (único) · password (hash BCrypt) · role ('admin' | 'user')

courses
  id · code (inteiro, único) · name · coordinator

semesters
  id · code (único, ex.: "2025/2")

students
  id · registration (único) · name · entry_year · entry_period · quota_type
  password (hash BCrypt; vazio até o autocadastro — login do aluno = matrícula)
  course_id → courses.id

academic_records
  id · student_id → students.id · semester_id → semesters.id
  status · status_detail
  integralized_hours · total_hours · pending_obligatory
  semesters_no_hours · locks
  ÚNICO (student_id, semester_id)          -- idx_student_semester

student_actions
  id · student_id → students.id · semester_id → semesters.id
  action_date · description (≤ 500) · response_date (opcional)

disciplines
  id · code (único) · name

study_plans
  id · student_id → students.id · semester_id → semesters.id
  ÚNICO (student_id, semester_id)          -- idx_plan_student_semester

study_plan_disciplines                      -- tabela associativa N:N
  study_plan_id · discipline_id

plan_rounds                                 -- rodada de cadastro de planos
  id · period1_semester_id → semesters.id · period2_semester_id → semesters.id
  open (índice) · opened_by_user_id
```

Cada um dos dois períodos-alvo de uma `plan_round` é um `semesters` (criado pelo código informado, se ainda não existir). O plano de um período é, portanto, um `study_plans (aluno, semestre)` — o modelo de plano é reaproveitado; a rodada só define a janela e os dois semestres. Quando os dados reais desses períodos forem importados depois, casam pelo mesmo código, sem duplicação.

**Campos de `academic_records`**

| Campo | Significado |
|---|---|
| `status` | Enquadramento do aluno no semestre (coluna `ENQUADRAMENTO`) |
| `status_detail` | Observação do acompanhamento (coluna `ACOMPANHAMENTO_ENQUADRAMENTO`) |
| `integralized_hours` | Carga horária já integralizada |
| `total_hours` | Carga horária total prevista no currículo |
| `pending_obligatory` | Quantidade de **disciplinas obrigatórias** ainda pendentes |
| `semesters_no_hours` | Semestres sem carga horária cumprida |
| `locks` | Número de trancamentos de matrícula |

**Valores de status observados nas planilhas**

`Em regularidade` · `PAE` · `PIC` · `Bloqueio de matricula` · `Desligamento`

> Os status não são uma enumeração fixa no banco: eles vêm exatamente como estão na planilha importada. Os filtros da interface usam essa mesma grafia.

---

## Importação de planilhas

**Formatos aceitos:** `.csv` com separador `;` ou `.xlsx` (primeira aba).

O cabeçalho é localizado por nome de coluna, sem diferenciar maiúsculas/minúsculas e ignorando espaços nas extremidades. `PERIODO_BASE_ENQUADRAMENTO` e `MATR_ALUNO` são obrigatórias — se faltarem, a importação é abortada com erro. As demais colunas ausentes resultam em campo vazio ou zero; linhas individuais sem matrícula, sem semestre ou sem `COD_CURSO` numérico são ignoradas e contadas no resumo (nunca geram entidades vazias no banco).

| Coluna da planilha | Destino no banco |
|---|---|
| `PERIODO_BASE_ENQUADRAMENTO` **(obrigatória)** | `semesters.code` |
| `MATR_ALUNO` **(obrigatória)** | `students.registration` |
| `COD_CURSO` | `courses.code` |
| `NOME_CURSO` | `courses.name` |
| `COORDENADOR_CURSO` | `courses.coordinator` |
| `NOME_ALUNO` | `students.name` |
| `ANO_INGRESSO` | `students.entry_year` |
| `PERIODO_INGRESSO` | `students.entry_period` |
| `TIPO_COTA_INGRESSO` | `students.quota_type` |
| `ENQUADRAMENTO` | `academic_records.status` |
| `ACOMPANHAMENTO_ENQUADRAMENTO` | `academic_records.status_detail` |
| `CH_INTEGRALIZADA` | `academic_records.integralized_hours` |
| `CH_TOTAL_DISCIPLINAS_CONTAR` | `academic_records.total_hours` |
| `NUM_DISC_OBR_FALTANTES` | `academic_records.pending_obligatory` |
| `NUM_SEMESTRES_SEM_CH` | `academic_records.semesters_no_hours` |
| `NUM_TRANCAMENTOS` | `academic_records.locks` |

**Processamento**

1. O arquivo inteiro é lido e convertido em memória (`parseRows`) — etapa pura, coberta por testes unitários. As linhas inválidas são contadas como ignoradas nesta fase.
2. A gravação ocorre em **uma única transação**: cursos (criados ou atualizados por `COD_CURSO`), semestres, alunos e registros acadêmicos. Se qualquer linha falhar, nada é alterado (RNF-05).
3. As entidades existentes são pré-carregadas em mapas antes do laço — a importação não repete consultas por linha (padrão N+1 eliminado).
4. A resposta traz o resumo `{ total_rows, records_created, records_updated, skipped_rows }`, exibido pela interface ao final do upload (UC08, passo 7 do fluxo principal).

O índice único `idx_student_semester` garante, no próprio banco, que não existam dois registros para o mesmo aluno no mesmo semestre.

---

## Regras de negócio

| ID | Regra | Onde é aplicada |
|---|---|---|
| RN01 | O usuário de `ID = 1` (Admin Master) não pode ser excluído nem rebaixado. | `user_service.go` (HTTP 403) e desabilitado na interface |
| RN02 | **Aluno crítico:** status `Em regularidade` **e** (`locks > 1` **ou** `semesters_no_hours > 1`) — alunos ainda classificados como regulares, mas já com sinais de retenção. | `services/rules.go` (definição única), usada pelo dashboard e por `?mode=critical` no relatório acadêmico |
| RN03 | **Próximo da formatura:** status `Em regularidade` **e** `pending_obligatory <= 6` disciplinas obrigatórias. | `services/rules.go` (definição única), usada pelo dashboard e por `?max_pending=6` no relatório acadêmico |
| RN04 | Importação com estratégia *upsert* pela chave natural `matrícula + semestre`, em transação única; nenhuma duplicata é gerada. | `import_service.go` + índice único |
| RN05 | Não é permitido registrar ação de acompanhamento para aluno com status `Em regularidade`. | `action_service.go` (HTTP 403) e botão desabilitado na interface |
| RN06 | Semestres, cursos e alunos inexistentes são criados automaticamente durante a importação. | `import_service.go` |
| RN07 | Senhas armazenadas exclusivamente como hash BCrypt, no cadastro e na atualização. | `auth_service.go`, `user_service.go` |
| RN08 | Token JWT válido por 24 horas; expirado, exige novo login. | `auth_service.go`, `auth_middleware.go` |
| RN09 | Plano de integralização só é criado/editado se o **enquadramento mais recente** do aluno for `PAE` ou `PIC` (os períodos-alvo são futuros; a elegibilidade não vem do registro do semestre-alvo). | `study_plan_service.go` (`ensureEligible` + `latestStatus`, HTTP 403) |
| RN10 | No máximo um plano de integralização por aluno e semestre; a segunda tentativa de criação retorna conflito e direciona para a atualização. | `study_plan_service.go` — violação do índice único traduzida para HTTP 409 |
| RN11 | A atualização do plano **substitui integralmente** a lista de disciplinas associadas. | `study_plan_service.go` |
| RN12 | Descrição da ação de acompanhamento limitada a 500 caracteres. | `action_service.go` e `StudentActions.jsx` |
| RN13 | Código de disciplina é único. | `discipline_service.go` — violação do índice único traduzida para HTTP 409 |
| RN14 | Ações de acompanhamento e planos de integralização são sempre vinculados a um semestre letivo. | Modelos e services correspondentes |
| RN15 | Rotas administrativas (importação, cadastro/listagem/exclusão de usuários) exigem papel `admin`, verificado no servidor. | `middlewares/require_role.go` |
| RN16 | Autocadastro do aluno só é aceito para matrícula **já existente** na base e **ainda sem senha**; senha ≥ 6 caracteres. | `student_auth_service.go` (HTTP 404/409/400) |
| RN17 | Plano só pode ser registrado/editado com uma **rodada aberta** e para um dos **dois períodos-alvo** dela. | `study_plan_service.go` (`ensureEligible`, HTTP 403/400) |
| RN18 | A elegibilidade PAE/PIC do plano usa o **enquadramento mais recente** do aluno (maior código de semestre). | `services/student_service.go` (`latestStatus`) |
| RN19 | No máximo **uma rodada de cadastro aberta** por vez — abrir uma nova fecha a anterior, em transação. | `plan_round_service.go` |
| RN20 | O aluno (`role="student"`) só acessa os **próprios dados**: a matrícula da rota tem de ser a do token. | `middlewares/require_role.go` (`RequireSelfOrStaff`, HTTP 403) |

---

## Rotas da interface

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Login da coordenação | público |
| `/aluno/login` · `/aluno/cadastro` | Login e autocadastro do aluno | público |
| `/aluno` | Área do aluno: enquadramento + plano dos 2 períodos | `student` |
| `/home` | Painel de módulos | staff |
| `/profile` | Meu perfil | staff |
| `/import` | Importação de dados (módulo exibido para `admin`) | staff |
| `/users` · `/register-user` | Gestão e cadastro de usuários (exibidos para `admin`) | staff |
| `/report/records` · `/reports/records` | Relatório acadêmico | staff |
| `/report/students` | Alunos ativos | staff |
| `/report/courses` | Cursos cadastrados | staff |
| `/reports/indicators` | Painel de indicadores | staff |
| `/students/:registration` | Histórico individual do aluno | staff |
| `/students/:registration/actions` | Ações de acompanhamento | staff |
| `/planos` | Rodada de cadastro + alunos em PAE/PIC | staff |
| `/planos/:registration` | Plano de integralização de um aluno (coordenação) | staff |
| `/disciplines` | Disciplinas | staff |

Todas as rotas, exceto as públicas, exigem sessão ativa; o `PrivateRoute` também restringe por papel — um aluno que tente uma rota de staff é enviado para `/aluno`, e vice-versa. (staff = `admin` ou `user`.)

---

## API REST

Base: `<BACKEND_URL>/api/v1` — o prefixo `/api`, sem versão, permanece como alias de compatibilidade. Com exceção das rotas públicas, todas exigem `Authorization: Bearer <token>`. A coluna **Acesso** indica o middleware aplicado: **Autenticado** (qualquer token), **Self ou Staff** (o próprio aluno ou a coordenação), **Staff** (`admin` ou `user`) e **Admin**.

Fora da API, `GET /health` (sem autenticação) responde ao *health check* da plataforma de hospedagem, verificando também a conectividade com o banco.

### Autenticação e usuários

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `POST` | `/login` | Público | corpo: `email`, `password` | Login da coordenação — token JWT + dados do usuário |
| `POST` | `/student/register` | Público | corpo: `registration`, `password` | Autocadastro do aluno (matrícula existente e sem senha; senha ≥ 6) |
| `POST` | `/student/login` | Público | corpo: `registration`, `password` | Login do aluno — token JWT `role="student"` |
| `GET` | `/me` | Autenticado | — | Ramifica por papel: dados do usuário (staff) ou do aluno + enquadramento |
| `POST` | `/register` | **Admin** | corpo: `name`, `email`, `password`, `role?` | Cria usuário (`role` padrão `user`; e-mail validado; senha ≥ 6 caracteres) |
| `GET` | `/users` | **Admin** | `name`, `email`, `role` | Lista usuários (sem o hash da senha) |
| `PUT` | `/users/:id` | Autenticado | corpo: `name?`, `email?`, `password?`, `role?` | Usuário comum edita apenas o próprio perfil; só `admin` altera `role` |
| `DELETE` | `/users/:id` | **Admin** | — | Remove usuário (`ID = 1` e autoexclusão bloqueados) |

### Importação e dados de referência

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `POST` | `/upload` | **Admin** | `multipart/form-data`, campo `file` | Importa planilha CSV/XLSX; retorna `summary` com o resultado |
| `GET` | `/semesters` | **Staff** | — | Semestres em ordem decrescente de código |
| `GET` | `/reports/courses` | **Staff** | `code`, `name` | Cursos cadastrados |

### Relatórios e indicadores

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `GET` | `/reports/records` | **Staff** | `semester_id`, `mode=critical`, `max_pending`, `registration`, `student_name`, `course_name`, `status`, `limit`, `offset` | Relatório acadêmico com aluno, curso e semestre aninhados |
| `GET` | `/reports/students` | **Staff** | `semester_id`, `registration`, `name`, `entry_year`, `quota_type`, `limit`, `offset` | Alunos (com `semester_id`, apenas os que têm registro no semestre) |
| `GET` | `/reports/dashboard` | **Staff** | `semester_id` **(obrigatório)** | Distribuição por status, alunos críticos e próximos da formatura |
| `GET` | `/students/:registration/history` | **Self ou Staff** | — | `{ student, history }` — histórico ordenado por semestre |

### Acompanhamento discente

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `GET` | `/students/:registration/actions` | **Staff** | `semester_id` **(obrigatório)** | Ações do aluno no semestre, mais recentes primeiro |
| `POST` | `/students/:registration/actions` | **Staff** | corpo: `semester_id`, `action_date`, `description`, `response_date?` | Registra ação (403 se o aluno estiver em regularidade) |
| `PUT` | `/actions/:id` | **Staff** | corpo: `action_date?`, `description?`, `response_date?` | Atualiza ação |
| `DELETE` | `/actions/:id` | **Staff** | — | Remove ação |

### Disciplinas

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `GET` | `/disciplines` | Autenticado | — | Disciplinas em ordem alfabética (aluno lê para montar o plano) |
| `POST` | `/disciplines` | **Staff** | corpo: `code`, `name` | Cria disciplina (409 se o código já existir) |
| `PUT` | `/disciplines/:id` | **Staff** | corpo: `code?`, `name?` | Atualiza disciplina |
| `DELETE` | `/disciplines/:id` | **Staff** | — | Remove disciplina |

### Rodada de cadastro e plano de integralização

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `GET` | `/rounds/current` | Autenticado | — | Rodada aberta (os 2 períodos-alvo); 404 se nenhuma |
| `GET` | `/rounds` | **Staff** | — | Histórico de rodadas |
| `POST` | `/rounds` | **Staff** | corpo: `period1`, `period2` | Abre rodada (fecha a anterior; períodos distintos) |
| `PUT` | `/rounds/:id/close` | **Staff** | — | Encerra a rodada |
| `GET` | `/students/:registration/plan` | **Self ou Staff** | `semester_id` **(obrigatório)** | Plano do aluno no semestre (404 se não existir) |
| `POST` | `/students/:registration/plan` | **Self ou Staff** | corpo: `semester_id`, `discipline_ids[]` | Cria plano (403 sem rodada aberta ou fora de PAE/PIC; 400 se o semestre não for da rodada; 409 se já existir) |
| `PUT` | `/students/:registration/plan` | **Self ou Staff** | corpo: `semester_id`, `discipline_ids[]` | Substitui as disciplinas do plano (mesmas validações) |

> Paginação: em `/reports/records` e `/reports/students`, `limit`/`offset` são opcionais — sem `limit`, a listagem completa é retornada (comportamento esperado pelas telas atuais); com `limit`, o total de linhas vem no cabeçalho `X-Total-Count`. As respostas usam DTOs: campos internos como `deleted_at` não são expostos.

---

## Como rodar localmente

### Pré-requisitos

- [Go 1.24+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- Uma instância PostgreSQL acessível (local ou gerenciada)

### 1. Backend

```bash
cd backend
cp .env.example .env      # preencha os valores (ver seção seguinte)
go mod download
go run cmd/server/main.go
```

O servidor sobe em `http://localhost:8080`. Na primeira execução:

- variáveis obrigatórias ausentes derrubam o servidor na largada, com mensagem indicando quais faltam;
- o `AutoMigrate` cria/atualiza todas as tabelas;
- `EnsureAdmin` cria o usuário administrador definido no `.env`, caso ainda não exista.

`GET http://localhost:8080/health` confirma que servidor e banco estão no ar.

> O `.env` é lido a partir do diretório de trabalho — execute o comando **de dentro de `backend/`**. Se o arquivo não existir, o Viper usa apenas as variáveis do ambiente do sistema.

### 2. Frontend

```bash
cd frontend
npm install
echo 'VITE_API_URL=http://localhost:8080' > .env
npm run dev
```

A aplicação fica disponível em `http://localhost:5173` — porta fixada no `vite.config.ts` justamente por constar na lista branca de CORS do backend.

Entre com o e-mail e a senha definidos em `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Em seguida, importe uma planilha em **Importar Dados**: enquanto não houver dados, os cartões de relatório da página inicial permanecem desabilitados.

---

## Variáveis de ambiente

### Backend — `backend/.env`

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | DSN do PostgreSQL, ex.: `postgres://usuario:senha@host:5432/banco?sslmode=require` |
| `JWT_SECRET` | sim | Segredo usado para assinar os tokens (HS256) |
| `ADMIN_EMAIL` | sim | E-mail do administrador semeado na primeira execução |
| `ADMIN_PASSWORD` | sim | Senha inicial desse administrador |
| `ADMIN_NAME` | sim | Nome exibido para esse administrador |
| `PORT` | não | Porta do servidor (padrão `8080`) |
| `APP_ENV` | não | `production` ativa o modo release do Gin (padrão `development`) |
| `ALLOWED_ORIGINS` | não | Origens permitidas no CORS, separadas por vírgula (padrão: `http://localhost:5173` e `https://frontend-ada.onrender.com`) |

As obrigatórias são validadas na inicialização — o servidor aborta listando as ausentes, em vez de subir com chave JWT vazia.

### Frontend — `frontend/.env`

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base do backend **sem sufixo** — `services/api.js` acrescenta `/api/v1`. Padrão: `http://localhost:8080` |

---

## Deploy

Todos os componentes são hospedados no Render, com implantação automática a cada *push* na branch principal do repositório GitHub.

| Componente | Serviço no Render | Configuração esperada |
|---|---|---|
| Frontend | Static Site | *Build*: `npm install && npm run build` · Publicação: `dist` · `public/_redirects` mantém o roteamento da SPA (`/* /index.html 200`) · Variável `VITE_API_URL` apontando para o backend |
| Backend | Web Service (Go) | *Build*: `go build -o app ./cmd/server` · Variáveis de ambiente da seção anterior, com `APP_ENV=production` · Porta fornecida pela plataforma em `PORT` · *Health check path*: `/health` |
| Banco | PostgreSQL gerenciado | Conexão por SSL sobre a rede privada interna; sem exposição pública |

> Ao publicar o frontend em um domínio novo, acrescente a URL em `ALLOWED_ORIGINS` (separada por vírgula) — sem necessidade de alterar código; caso contrário o navegador bloqueia as requisições. O servidor faz desligamento gracioso em `SIGTERM`, encerrando as conexões em andamento antes de sair — compatível com os reinícios da plataforma.

---

## Testes e CI

- `cd backend && go test ./...` executa os testes unitários e de integração:
  - **parse da importação** (`parseRows` — cabeçalho com caixa/espaços diferentes, descarte de linhas inválidas);
  - **tradução de erros** de domínio para HTTP (`respondError`, sem vazar detalhes internos em 500);
  - **elegibilidade do plano e rodada** (`study_plan_service_test.go` — exige rodada aberta, semestre-alvo e enquadramento mais recente PAE/PIC; só uma rodada aberta) e **auth do aluno** (`student_auth_service_test.go` — matrícula inexistente, duplo cadastro, login e claims), sobre um **SQLite in-memory** (driver puro-Go, sem CGO);
  - **ownership** (`RequireSelfOrStaff` — aluno em matrícula alheia recebe 403; staff passa).
- O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda a cada push e pull request: `gofmt`, `go vet`, testes e build do backend, além do build de produção do frontend.

---

## Limitações conhecidas

Registradas aqui por transparência; parte delas já aparece na monografia como trabalhos futuros. As falhas estruturais apontadas em revisões anteriores — RBAC apenas na interface, `userID` sempre zero no contexto (que quebrava a edição de perfil de usuários comuns), e-mail duplicado respondendo 500, importação sem transação, curso vazio vinculando alunos ao curso errado e o log residual "Aiven" — foram corrigidas na refatoração do backend.

1. **Progresso da importação.** A barra mede de fato apenas o envio do arquivo; o processamento no servidor é síncrono e a etapa intermediária é uma estimativa animada. Ao final, porém, o resumo real (novos, atualizados, ignorados) é retornado e exibido.
2. **Filtro inicial em Alunos Ativos.** O campo de ano de ingresso vem preenchido com o ano corrente e é aplicado na primeira consulta — para ver todos os alunos, é preciso limpar o campo e buscar novamente.
3. **Paginação apenas na API.** `GET /reports/records` e `GET /reports/students` aceitam `limit`/`offset` e devolvem `X-Total-Count`, mas as telas ainda carregam a lista completa.
4. **Identidade fraca no autocadastro do aluno.** Como não há e-mail nem outro dado sigiloso na planilha, o autocadastro exige apenas a matrícula (semipública) para definir a senha do primeiro acesso — decisão consciente, dado o baixo risco da informação. Não há recuperação de senha (sem canal de e-mail); um reset dependeria de provisionamento pela coordenação. Uma identidade forte exigiria integração com a autenticação institucional (fora de escopo).
5. **Cobertura de testes.** O backend tem testes de unidade e de integração (via SQLite in-memory) das regras críticas — importação, erros, elegibilidade do plano/rodada, auth do aluno e ownership. O frontend ainda não tem testes automatizados além do build de produção no CI.
6. **LGPD.** Foram adotadas minimização de dados (matrícula como identificador), armazenamento irreversível de senhas (staff e aluno) e acesso restrito por papel. Políticas formais de retenção e de tratamento continuam pendentes.

---

## Documentação do TCC no repositório

| Arquivo | Conteúdo |
|---|---|
| [`tcc_matheus.pdf`](tcc_matheus.pdf) | Monografia completa: fundamentação, metodologia, requisitos, casos de uso, resultados e apêndices (dicionário de dados, casos de uso e os diagramas de arquitetura, casos de uso e modelo de dados) |

---

## Autor

**Matheus Eliziário Nardi** — Bacharelado em Ciência da Computação, UFES / Campus de Alegre.
Orientação: Prof. Dr. Marcelo Otone Aguiar.
