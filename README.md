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
- Semestres, cursos e alunos ainda não cadastrados são criados automaticamente durante o processamento.
- Indicador de progresso durante o envio (ver [Limitações conhecidas](#limitações-conhecidas)).

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

### Plano de integralização curricular (PAE/PIC)
- Disponível apenas para alunos cujo registro no semestre esteja em **PAE** ou **PIC**; o título da tela muda conforme o enquadramento.
- Monta-se o plano selecionando disciplinas do catálogo; a lista de disciplinas já adicionadas não reaparece no seletor.
- Um único plano por aluno e semestre: a partir do segundo salvamento, a tela passa a **atualizar** o plano existente (a atualização substitui integralmente a lista de disciplinas).

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

O modelo de dados tem **dois papéis**: `admin` e `user`. O "Admin Master" não é um papel separado — é o usuário de `ID = 1`, protegido por regra de negócio.

| Perfil | Como é identificado | O que o diferencia |
|---|---|---|
| **Admin Master** | `users.id = 1` | Não pode ser excluído nem rebaixado. É semeado na primeira execução a partir de `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME`. |
| **Administrador** | `role = "admin"` | Vê e usa os módulos de importação de dados e de gestão de usuários; é o único perfil autorizado a criar usuários. |
| **Usuário comum** | `role = "user"` | Consulta relatórios, indicadores e históricos; registra ações, planos e disciplinas pela interface. Não vê os módulos administrativos. |

> A separação entre perfis é aplicada principalmente na interface. No servidor, apenas a criação de usuários verifica o papel — veja [Limitações conhecidas](#limitações-conhecidas).

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
│  routes ─▶ middlewares ─▶ controllers ─▶ services        │
│                                  └────────▶ models       │
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
| `routes/` | Define o grupo `/api`, separa a rota pública de login das rotas protegidas e aplica o middleware de autenticação. |
| `middlewares/` | Valida o token JWT e publica `userID` e `role` no contexto da requisição. |
| `controllers/` | Recebem e validam a requisição HTTP, aplicam as regras de negócio e montam a resposta. |
| `services/` | Autenticação, criação de usuários, *seed* do administrador e processamento dos arquivos de importação. |
| `models/` | *Structs* GORM que descrevem as tabelas, os relacionamentos e os índices únicos. |
| `pkg/database/` | Abertura e compartilhamento da conexão com o PostgreSQL. |
| `config/` | Carregamento das variáveis de ambiente via Viper (`.env` ou ambiente do sistema). |

O CORS é configurado diretamente em `cmd/server/main.go`, com lista branca de origens (`http://localhost:5173` e a URL do frontend em produção).

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
│   ├── cmd/server/main.go            # Ponto de entrada: config, AutoMigrate, seed, CORS, rotas
│   ├── config/config.go              # Carregamento de variáveis de ambiente (Viper)
│   ├── internal/
│   │   ├── controllers/
│   │   │   ├── auth_controller.go       # login, /me, cadastro de usuário
│   │   │   ├── user_controller.go       # listagem, edição e exclusão de usuários
│   │   │   ├── import_controller.go     # upload da planilha
│   │   │   ├── report_controller.go     # semestres, registros, cursos, alunos
│   │   │   ├── indicators_controller.go # dados do painel de indicadores
│   │   │   ├── student_controller.go    # histórico individual
│   │   │   ├── action_controller.go     # ações de acompanhamento
│   │   │   ├── discipline_controller.go # CRUD de disciplinas
│   │   │   └── study_plan_controller.go # plano de integralização
│   │   ├── middlewares/auth_middleware.go
│   │   ├── models/                   # user, course, semester, student,
│   │   │                             # academic_record, student_action,
│   │   │                             # discipline, study_plan
│   │   ├── routes/routes.go
│   │   └── services/
│   │       ├── auth_service.go       # login, criação de usuário, seed do admin
│   │       └── import_service.go     # leitura de CSV/XLSX e upsert dos registros
│   ├── pkg/database/postgres.go
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
│   │   ├── components/Header.jsx     # cabeçalho, seletor de semestre e menu
│   │   ├── context/                  # AuthContext, SemesterContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx              # painel de módulos
│   │   │   ├── Profile.jsx
│   │   │   ├── ImportData.jsx
│   │   │   ├── UsersList.jsx
│   │   │   ├── RegisterUser.jsx
│   │   │   ├── StudentProfile.jsx    # histórico individual
│   │   │   ├── StudentActions.jsx
│   │   │   ├── StudyPlan.jsx
│   │   │   ├── Disciplines.jsx
│   │   │   └── Reports/
│   │   │       ├── AcademicReport.jsx
│   │   │       ├── StudentsReport.jsx
│   │   │       ├── CoursesReport.jsx
│   │   │       └── IndicatorsReport.jsx
│   │   ├── services/api.js           # instância Axios + interceptador do token
│   │   ├── theme.js                  # tema MUI (claro/escuro)
│   │   ├── App.jsx                   # provedores e rotas
│   │   └── main.jsx
│   ├── .env                          # não versionado
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── diagrama_arquitetura.html         # diagramas usados na monografia
├── diagrama_casos_de_uso.html
├── diagrama_er.html
├── ADAManagement_TCC.txt             # notas técnicas de apoio à redação
└── tcc_matheus.pdf                   # monografia
```

---

## Modelo de dados

Todas as tabelas herdam de `gorm.Model`, portanto possuem `id`, `created_at`, `updated_at` e `deleted_at` (exclusão lógica). O esquema é criado e sincronizado por `AutoMigrate` na inicialização do servidor.

```
users
  id · name · email (único) · password (hash BCrypt) · role ('admin' | 'user')

courses
  id · code (inteiro, único) · name · coordinator

semesters
  id · code (único, ex.: "2025/2")

students
  id · registration (único) · name · entry_year · entry_period · quota_type
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
```

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

O cabeçalho é localizado por nome de coluna, sem diferenciar maiúsculas/minúsculas e ignorando espaços nas extremidades. Colunas ausentes resultam em campo vazio ou zero — **exceto** `PERIODO_BASE_ENQUADRAMENTO` e `MATR_ALUNO`, que são obrigatórias e, se faltarem, abortam a importação com erro.

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

**Processamento de cada linha**

1. Curso localizado ou criado por `COD_CURSO`; nome e coordenador são atualizados quando mudam.
2. Semestre localizado ou criado por `PERIODO_BASE_ENQUADRAMENTO`.
3. Aluno localizado por matrícula ou inicializado; dados cadastrais e vínculo com o curso são gravados.
4. Registro acadêmico localizado por `(student_id, semester_id)` ou inicializado, e então salvo — inserindo ou atualizando conforme o caso.

O índice único `idx_student_semester` garante, no próprio banco, que não existam dois registros para o mesmo aluno no mesmo semestre.

---

## Regras de negócio

| ID | Regra | Onde é aplicada |
|---|---|---|
| RN01 | O usuário de `ID = 1` (Admin Master) não pode ser excluído nem rebaixado. | `user_controller.go` (HTTP 403) e desabilitado na interface |
| RN02 | **Aluno crítico:** status `Em regularidade` **e** (`locks > 1` **ou** `semesters_no_hours > 1`) — alunos ainda classificados como regulares, mas já com sinais de retenção. | `indicators_controller.go` e `?mode=critical` no relatório acadêmico |
| RN03 | **Próximo da formatura:** status `Em regularidade` **e** `pending_obligatory <= 6` disciplinas obrigatórias. | `indicators_controller.go` e `?max_pending=6` no relatório acadêmico |
| RN04 | Importação com estratégia *upsert* pela chave natural `matrícula + semestre`; nenhuma duplicata é gerada. | `import_service.go` + índice único |
| RN05 | Não é permitido registrar ação de acompanhamento para aluno com status `Em regularidade`. | `action_controller.go` (HTTP 403) e botão desabilitado na interface |
| RN06 | Semestres, cursos e alunos inexistentes são criados automaticamente durante a importação. | `import_service.go` |
| RN07 | Senhas armazenadas exclusivamente como hash BCrypt, no cadastro e na atualização. | `auth_service.go`, `user_controller.go` |
| RN08 | Token JWT válido por 24 horas; expirado, exige novo login. | `auth_service.go`, `auth_middleware.go` |
| RN09 | Plano de integralização só pode ser criado para registro com status `PAE` ou `PIC`. | `study_plan_controller.go` (HTTP 403) |
| RN10 | No máximo um plano de integralização por aluno e semestre; a segunda tentativa de criação retorna conflito e direciona para a atualização. | `study_plan_controller.go` (HTTP 409) + índice único |
| RN11 | A atualização do plano **substitui integralmente** a lista de disciplinas associadas. | `study_plan_controller.go` |
| RN12 | Descrição da ação de acompanhamento limitada a 500 caracteres. | `action_controller.go` e `StudentActions.jsx` |
| RN13 | Código de disciplina é único. | `discipline_controller.go` (HTTP 409) + índice único |
| RN14 | Ações de acompanhamento e planos de integralização são sempre vinculados a um semestre letivo. | Modelos e controllers correspondentes |

---

## Rotas da interface

| Rota | Tela |
|---|---|
| `/` | Login |
| `/home` | Painel de módulos |
| `/profile` | Meu perfil |
| `/import` | Importação de dados (módulo exibido para `admin`) |
| `/users` | Gestão de usuários (módulo exibido para `admin`) |
| `/register-user` | Cadastro de novo usuário (módulo exibido para `admin`) |
| `/report/records` · `/reports/records` | Relatório acadêmico |
| `/report/students` | Alunos ativos |
| `/report/courses` | Cursos cadastrados |
| `/reports/indicators` | Painel de indicadores |
| `/students/:registration` | Histórico individual do aluno |
| `/students/:registration/actions` | Ações de acompanhamento |
| `/students/:registration/plan` | Plano de integralização curricular |
| `/disciplines` | Disciplinas |

Todas as rotas, exceto `/`, exigem sessão ativa (`PrivateRoute`).

---

## API REST

Base: `<BACKEND_URL>/api`. Com exceção de `POST /login`, todas as rotas exigem o cabeçalho `Authorization: Bearer <token>`.

### Autenticação e usuários

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `POST` | `/login` | Público | corpo: `email`, `password` | Retorna o token JWT e os dados do usuário |
| `GET` | `/me` | Autenticado | — | Dados do usuário do token |
| `POST` | `/register` | **Admin** | corpo: `name`, `email`, `password`, `role?` | Cria usuário (`role` padrão: `user`) |
| `GET` | `/users` | Autenticado | `name`, `email`, `role` | Lista usuários (sem o hash da senha) |
| `PUT` | `/users/:id` | Autenticado | corpo: `name?`, `email?`, `password?`, `role?` | Atualiza usuário; só `admin` altera `role` |
| `DELETE` | `/users/:id` | Autenticado | — | Remove usuário (`ID = 1` bloqueado) |

### Importação e dados de referência

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `POST` | `/upload` | Autenticado | `multipart/form-data`, campo `file` | Importa planilha CSV/XLSX |
| `GET` | `/semesters` | Autenticado | — | Semestres em ordem decrescente de código |
| `GET` | `/reports/courses` | Autenticado | `code`, `name` | Cursos cadastrados |

### Relatórios e indicadores

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `GET` | `/reports/records` | Autenticado | `semester_id`, `mode=critical`, `max_pending`, `registration`, `student_name`, `course_name`, `status` | Relatório acadêmico com aluno, curso e semestre pré-carregados |
| `GET` | `/reports/students` | Autenticado | `semester_id`, `registration`, `name`, `entry_year`, `quota_type` | Alunos (com `semester_id`, apenas os que têm registro no semestre) |
| `GET` | `/reports/dashboard` | Autenticado | `semester_id` **(obrigatório)** | Distribuição por status, alunos críticos e próximos da formatura |
| `GET` | `/students/:registration/history` | Autenticado | — | `{ student, history }` — histórico ordenado por semestre |

### Acompanhamento discente

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `GET` | `/students/:registration/actions` | Autenticado | `semester_id` **(obrigatório)** | Ações do aluno no semestre, mais recentes primeiro |
| `POST` | `/students/:registration/actions` | Autenticado | corpo: `semester_id`, `action_date`, `description`, `response_date?` | Registra ação (403 se o aluno estiver em regularidade) |
| `PUT` | `/actions/:id` | Autenticado | corpo: `action_date?`, `description?`, `response_date?` | Atualiza ação |
| `DELETE` | `/actions/:id` | Autenticado | — | Remove ação |

### Disciplinas e plano de integralização

| Método | Rota | Acesso | Parâmetros | Descrição |
|---|---|---|---|---|
| `GET` | `/disciplines` | Autenticado | — | Disciplinas em ordem alfabética |
| `POST` | `/disciplines` | Autenticado | corpo: `code`, `name` | Cria disciplina (409 se o código já existir) |
| `PUT` | `/disciplines/:id` | Autenticado | corpo: `code?`, `name?` | Atualiza disciplina |
| `DELETE` | `/disciplines/:id` | Autenticado | — | Remove disciplina |
| `GET` | `/students/:registration/plan` | Autenticado | `semester_id` **(obrigatório)** | Plano do aluno no semestre (404 se não existir) |
| `POST` | `/students/:registration/plan` | Autenticado | corpo: `semester_id`, `discipline_ids[]` | Cria plano (403 fora de PAE/PIC, 409 se já existir) |
| `PUT` | `/students/:registration/plan` | Autenticado | corpo: `semester_id`, `discipline_ids[]` | Substitui as disciplinas do plano |

> A coluna **Acesso** descreve o que o servidor verifica hoje. A restrição das funções administrativas ao perfil `admin` é feita, nas demais rotas, pela interface — veja [Limitações conhecidas](#limitações-conhecidas).

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

- o `AutoMigrate` cria/atualiza todas as tabelas;
- `EnsureAdmin()` cria o usuário administrador definido no `.env`, caso ainda não exista.

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

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | DSN do PostgreSQL, ex.: `postgres://usuario:senha@host:5432/banco?sslmode=require` |
| `JWT_SECRET` | Segredo usado para assinar os tokens (HS256) |
| `ADMIN_EMAIL` | E-mail do administrador semeado na primeira execução |
| `ADMIN_PASSWORD` | Senha inicial desse administrador |
| `ADMIN_NAME` | Nome exibido para esse administrador |
| `PORT` | Porta do servidor (padrão `8080` quando vazia) |

### Frontend — `frontend/.env`

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base do backend **sem** `/api` — o sufixo é acrescentado em `services/api.js`. Padrão: `http://localhost:8080` |

---

## Deploy

Todos os componentes são hospedados no Render, com implantação automática a cada *push* na branch principal do repositório GitHub.

| Componente | Serviço no Render | Configuração esperada |
|---|---|---|
| Frontend | Static Site | *Build*: `npm install && npm run build` · Publicação: `dist` · `public/_redirects` mantém o roteamento da SPA (`/* /index.html 200`) · Variável `VITE_API_URL` apontando para o backend |
| Backend | Web Service (Go) | *Build*: `go build -o app ./cmd/server` · Variáveis de ambiente da seção anterior · Porta fornecida pela plataforma em `PORT` |
| Banco | PostgreSQL gerenciado | Conexão por SSL sobre a rede privada interna; sem exposição pública |

> Ao publicar o frontend em um domínio novo, inclua a URL na lista branca de CORS em `cmd/server/main.go` — caso contrário o navegador bloqueia as requisições.

---

## Limitações conhecidas

Registradas aqui por transparência; parte delas já aparece na monografia como trabalhos futuros.

1. **Autorização por papel no servidor.** Somente `POST /api/register` verifica explicitamente `role == "admin"`; a edição de usuários acaba restrita a administradores como efeito colateral da checagem descrita no item 2. As demais rotas de escrita — importação de planilhas, exclusão de usuários, ações de acompanhamento, disciplinas e planos de integralização — exigem apenas um token válido. A separação entre perfis é feita na interface, que oculta os módulos administrativos. Estender a verificação de papel às rotas de escrita é o próximo passo natural de segurança.
2. **Identificação do requisitante no contexto Gin.** O middleware grava `userID` como `float64` (tipo natural do *claim* JSON) e os controllers o leem com `c.GetUint`, que devolve `0`. Como consequência, as verificações de "não alterar/excluir a si mesmo" em `user_controller.go` não têm efeito prático, e um usuário com papel `user` recebe 403 ao tentar salvar o próprio perfil.
3. **Progresso da importação.** O envio do arquivo é medido de fato (0–40%); o restante é uma estimativa animada no cliente até a resposta do servidor. O backend processa o arquivo de forma síncrona, sem informar progresso real nem o total de linhas importadas.
4. **Status do aluno na tela de ações.** `StudentActions.jsx` procura o campo `records` na resposta do histórico, que devolve `history`; por isso o *chip* de status não é exibido nessa tela.
5. **Filtro inicial em Alunos Ativos.** O campo de ano de ingresso já vem preenchido com o ano corrente e é aplicado na primeira consulta — para ver todos os alunos, é preciso limpar o campo e buscar novamente.
6. **Sem paginação.** Relatórios e listagens retornam o conjunto completo de registros do semestre.
7. **Sem testes automatizados.** A verificação foi funcional, conduzida pela interface a partir dos casos de uso (seção 4.2.2 da monografia).
8. **Mensagem de log desatualizada.** `pkg/database/postgres.go` ainda registra "PostgreSQL (Aiven)" na conexão, resquício de uma hospedagem anterior do banco.
9. **LGPD.** Foram adotadas minimização de dados (matrícula como identificador), armazenamento irreversível de senhas e acesso restrito a usuários autenticados. Políticas formais de retenção e de tratamento continuam pendentes.

---

## Documentação do TCC no repositório

| Arquivo | Conteúdo |
|---|---|
| [`tcc_matheus.pdf`](tcc_matheus.pdf) | Monografia completa: fundamentação, metodologia, requisitos, casos de uso, resultados e apêndices (dicionário de dados e casos de uso) |
| [`diagrama_arquitetura.html`](diagrama_arquitetura.html) | Diagrama de camadas da arquitetura |
| [`diagrama_casos_de_uso.html`](diagrama_casos_de_uso.html) | Diagramas de casos de uso por grupo funcional |
| [`diagrama_er.html`](diagrama_er.html) | Modelo do banco de dados |
| [`ADAManagement_TCC.txt`](ADAManagement_TCC.txt) | Notas técnicas de apoio à redação da monografia |

---

## Autor

**Matheus Eliziário Nardi** — Bacharelado em Ciência da Computação, UFES / Campus de Alegre.
Orientação: Prof. Dr. Marcelo Otone Aguiar.
