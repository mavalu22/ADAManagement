# ADAManagement — Sistema de Acompanhamento Discente

> Plataforma fullstack de monitoramento acadêmico desenvolvida para a UFES (Universidade Federal do Espírito Santo), com foco no acompanhamento da situação acadêmica dos alunos pelos coordenadores de curso.

---

## Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Modelos de Dados](#modelos-de-dados)
- [Regras de Negócio](#regras-de-negócio)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Deploy](#deploy)

---

## Sobre o Projeto

O **ADAManagement** é uma aplicação web desenvolvida como Trabalho de Conclusão de Curso (TCC) do curso de Ciência da Computação da UFES. O sistema centraliza o acompanhamento acadêmico de alunos de graduação, permitindo que coordenadores e administradores identifiquem rapidamente estudantes em situação de risco, visualizem o histórico de evolução e registrem intervenções de acompanhamento.

**Problema resolvido:** O acompanhamento discente na UFES era feito de forma manual, com planilhas isoladas e sem visão consolidada. O ADAManagement importa os dados diretamente das planilhas institucionais e oferece relatórios filtráveis, gráficos de evolução e um histórico de ações por aluno.

**Usuários do sistema:**
- **Admin Master** — Superusuário único (ID=1). Gerencia usuários, importa dados e tem acesso total. Não pode ser excluído nem rebaixado.
- **Admin** — Pode importar dados, visualizar todos os relatórios e registrar ações de acompanhamento.
- **Usuário Comum** — Acesso somente leitura aos relatórios e históricos.

---

## Funcionalidades

### Autenticação e Controle de Acesso
- Login com e-mail e senha (JWT + BCrypt)
- Token Bearer com expiração de 24 horas
- Controle de acesso por papel (RBAC): `admin` e `user`
- Middleware de autenticação aplicado em todas as rotas protegidas
- Validação de sessão via endpoint `/api/me`

### Gerenciamento de Usuários (Admin Master)
- Listagem de todos os usuários cadastrados
- Criação de novos usuários com definição de papel
- Edição de nome, e-mail, senha e papel
- Exclusão de usuários (com proteção do Admin Master)
- Promoção/rebaixamento de papel entre `admin` e `user`

### Importação de Dados Acadêmicos
- Upload de arquivos `.csv` (delimitado por `;`) e `.xlsx`
- Formato compatível com as planilhas institucionais da UFES (colunas em português)
- Criação automática de semestres, cursos e alunos não cadastrados
- Estratégia **upsert** por chave natural: atualiza sem duplicar registros
- Barra de progresso em tempo real durante o upload
- Colunas esperadas: `Matrícula`, `Nome`, `Curso`, `Semestre`, `Status`, `CH Pendente Obrigatória`, `Nº de Bloqueios`, `Semestres sem Matrícula`, entre outras

### Dashboard de Indicadores
- Gráfico de pizza com distribuição de alunos por status acadêmico
- Cards de totais: alunos cadastrados, semestres importados, cursos
- Clique nas fatias do gráfico filtra diretamente o relatório acadêmico
- Indicadores de alunos críticos e próximos da formatura

### Relatório Acadêmico
- Tabela completa com situação de cada aluno no semestre selecionado
- Filtros combinados: curso, status, nome, matrícula
- Modos especiais:
  - **Alunos Críticos:** locks > 1 OU semestres sem matrícula > 1
  - **Próximos de Formatura:** CH pendente obrigatória ≤ 6

### Base de Alunos
- Listagem de todos os alunos com filtros por cota e ano de ingresso
- Acesso ao perfil completo de cada aluno

### Histórico Individual do Aluno
- Gráfico de evolução da CH pendente ao longo dos semestres
- Timeline de status acadêmico por semestre
- Histórico de ações de acompanhamento registradas

### Ações de Acompanhamento
- Registro de intervenções por aluno (texto livre + data)
- Edição e exclusão de ações já registradas
- Restrição: alunos "Em regularidade" não permitem criação de novas ações
- Histórico cronológico por aluno

### Cursos e Coordenações
- Listagem de todos os cursos importados
- Visualização de alunos por curso

### Configurações Globais
- **Seleção de semestre letivo:** altera o contexto de todos os relatórios
- **Tema claro/escuro:** alternância persistida no `localStorage`
- **Edição de perfil:** nome, e-mail e senha do usuário logado

---

## Arquitetura

O sistema segue uma arquitetura de três camadas:

```
┌─────────────────────────────────────────────────┐
│              FRONTEND (SPA)                      │
│  React 18 + Vite + MUI v5 + Recharts + Axios    │
│  Hospedado em: frontend-ada.onrender.com         │
└────────────────────┬────────────────────────────┘
                     │  HTTP REST / JSON
                     │  Bearer Token (JWT)
┌────────────────────▼────────────────────────────┐
│              BACKEND (REST API)                  │
│  Go 1.24 + Gin + GORM + JWT + BCrypt            │
│  Hospedado em: ada-backend.onrender.com          │
│                                                  │
│  Routes → Middlewares → Controllers → Services   │
│                        ↓                         │
│                     Models (GORM)                │
└────────────────────┬────────────────────────────┘
                     │  ORM / SQL (pgx)
┌────────────────────▼────────────────────────────┐
│              BANCO DE DADOS                      │
│  PostgreSQL — Aiven Cloud (managed)              │
└─────────────────────────────────────────────────┘
```

**Padrão de camadas no Backend:**
- `routes/` — Definição de rotas e associação de middlewares
- `middlewares/` — Autenticação JWT, CORS
- `controllers/` — Handlers HTTP (recebe requisição, valida, chama service)
- `services/` — Lógica de negócio e acesso ao banco via GORM
- `models/` — Structs GORM com relacionamentos e validações

**Gerenciamento de estado no Frontend:**
- `AuthContext` — Usuário logado, token JWT, funções de login/logout
- `SemesterContext` — Semestre letivo selecionado globalmente
- `ThemeContext` — Preferência de tema (claro/escuro)

---

## Tecnologias

### Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| Go | 1.24 | Linguagem principal — performance, tipagem forte, compilação nativa |
| Gin | v1.9.1 | Framework HTTP — roteamento, middleware, binding de JSON |
| GORM | v1.31.1 | ORM — mapeamento objeto-relacional, migrations automáticas |
| PostgreSQL (pgx) | v5.8.0 | Driver PostgreSQL de alta performance |
| golang-jwt/jwt | v5.2.0 | Geração e validação de tokens JWT (HS256) |
| golang.org/x/crypto | v0.47.0 | BCrypt para hash de senhas |
| Viper | v1.21.0 | Leitura de variáveis de ambiente via `.env` |
| Excelize | v2.10.0 | Parsing de arquivos `.xlsx` (planilhas Excel) |
| gin-contrib/cors | v1.7.0 | Middleware CORS com whitelist de origens |

### Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.2.0 | Biblioteca UI — componentes reativos, Context API |
| Vite | 5.1.5 | Bundler e dev server — HMR instantâneo, build otimizado |
| Material UI (MUI) | v5.15.11 | Biblioteca de componentes — design system completo |
| Emotion | — | CSS-in-JS, engine de estilo do MUI |
| React Router | v6.22.3 | Roteamento client-side (SPA) |
| Axios | v1.6.7 | HTTP client com interceptadores para token Bearer |
| Recharts | v3.6.0 | Gráficos (pizza, linha) baseados em SVG/D3 |
| React Toastify | v10.0.4 | Notificações toast de feedback ao usuário |

### Infraestrutura

| Serviço | Uso |
|---|---|
| Render.com | Hospedagem do backend (Web Service Go) e frontend (Static Site) |
| Aiven | PostgreSQL gerenciado na nuvem com SSL obrigatório |
| GitHub | Controle de versão e integração com deploy automático do Render |

---

## Modelos de Dados

```
users
  id (PK), name, email (UNIQUE), password_hash, role, created_at, updated_at

courses
  id (PK), code (UNIQUE), name, created_at, updated_at

semesters
  id (PK), code (UNIQUE, ex: "2024/2"), created_at, updated_at

students
  id (PK), registration (UNIQUE), name, entry_year, quota, course_id (FK → courses)
  created_at, updated_at

academic_records
  id (PK), student_id (FK → students), semester_id (FK → semesters)
  status, pending_obligatory, locks, semesters_no_hours, created_at, updated_at
  UNIQUE(student_id, semester_id)

student_actions
  id (PK), student_id (FK → students), semester_id (FK → semesters)
  description, action_date, created_by (FK → users), created_at, updated_at
```

**Status acadêmicos possíveis:**
- `Em regularidade`
- `PAE` (Plano de Acompanhamento Estudantil)
- `PIC` (Período de Integralização Curricular)
- `Bloqueio de matrícula`
- `Desligamento`

---

## Regras de Negócio

| Regra | Descrição |
|---|---|
| Proteção do Admin Master | Usuário com ID=1 não pode ser excluído, rebaixado ou ter seu papel alterado |
| Aluno Crítico | `locks > 1` OU `semesters_no_hours > 1` |
| Próximo da Formatura | `pending_obligatory <= 6` |
| Importação Upsert | Registros existentes são atualizados; não há duplicação por (matrícula, semestre) |
| Restrição de Ação | Não é possível criar ação para aluno com status "Em regularidade" |
| Criação de Entidades | Semestres, cursos e alunos novos são criados automaticamente durante a importação |

---

## Estrutura do Projeto

```
ADAManagement/
├── backend/
│   ├── cmd/server/
│   │   └── main.go              # Entry point — inicializa DB, config, rotas
│   ├── config/
│   │   └── config.go            # Leitura de variáveis de ambiente (Viper)
│   ├── internal/
│   │   ├── controllers/         # Handlers HTTP
│   │   │   ├── auth_controller.go
│   │   │   ├── user_controller.go
│   │   │   ├── upload_controller.go
│   │   │   ├── report_controller.go
│   │   │   └── action_controller.go
│   │   ├── middlewares/
│   │   │   ├── auth_middleware.go   # Validação JWT
│   │   │   └── cors.go
│   │   ├── models/              # Structs GORM
│   │   │   ├── user.go
│   │   │   ├── course.go
│   │   │   ├── semester.go
│   │   │   ├── student.go
│   │   │   ├── academic_record.go
│   │   │   └── student_action.go
│   │   ├── routes/
│   │   │   └── routes.go        # Definição de rotas
│   │   └── services/            # Lógica de negócio
│   │       ├── auth_service.go
│   │       ├── user_service.go
│   │       ├── import_service.go
│   │       └── report_service.go
│   ├── .env                     # NÃO versionado
│   ├── go.mod
│   └── go.sum
│
└── frontend/
    ├── public/
    │   └── _redirects           # Regra SPA para Render (/* → /index.html 200)
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx      # Estado de autenticação global
    │   │   ├── SemesterContext.jsx  # Semestre letivo selecionado
    │   │   └── ThemeContext.jsx     # Tema claro/escuro
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Home.jsx             # Dashboard de indicadores
    │   │   ├── Profile.jsx
    │   │   ├── ImportData.jsx
    │   │   ├── UsersList.jsx
    │   │   ├── RegisterUser.jsx
    │   │   ├── StudentProfile.jsx   # Histórico individual
    │   │   ├── StudentActions.jsx
    │   │   └── Reports/
    │   │       ├── AcademicReport.jsx
    │   │       ├── StudentsReport.jsx
    │   │       ├── CoursesReport.jsx
    │   │       └── IndicatorsReport.jsx
    │   ├── services/
    │   │   └── api.js               # Instância Axios com interceptador de token
    │   ├── theme.js                 # Tema MUI (light/dark)
    │   ├── App.jsx                  # Roteamento principal + Providers
    │   └── main.jsx
    ├── .env                         # NÃO versionado
    ├── package.json
    └── vite.config.js
```

---

## Como Rodar Localmente

### Pré-requisitos

- [Go 1.24+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- Instância PostgreSQL acessível (local ou Aiven)

### 1. Backend

```bash
cd backend

# Crie o arquivo .env (veja a seção Variáveis de Ambiente)
go mod tidy
go run cmd/server/main.go
```

O servidor iniciará em `http://localhost:8080`.
Na primeira execução, as tabelas são criadas via AutoMigrate e o Admin Master é semeado automaticamente.

### 2. Frontend

```bash
cd frontend

npm install
# Crie o arquivo .env (veja a seção Variáveis de Ambiente)
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## Variáveis de Ambiente

### Backend — `backend/.env`

```env
DATABASE_URL=postgres://usuario:senha@host:porta/banco?sslmode=require
JWT_SECRET=sua_chave_secreta_aqui
ADMIN_EMAIL=admin@ufes.br
ADMIN_PASSWORD=senha_do_admin
ADMIN_NAME=Admin Master
PORT=8080
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8080
```

> Em produção, `VITE_API_URL` deve apontar para a URL do backend no Render.

---

## Endpoints da API

Todas as rotas (exceto `/api/login`) requerem o header:
```
Authorization: Bearer <token>
```

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/login` | Público | Autenticação — retorna JWT |
| GET | `/api/me` | Autenticado | Dados do usuário logado |
| POST | `/api/register` | Admin | Cadastrar novo usuário |
| GET | `/api/users` | Admin | Listar todos os usuários |
| PUT | `/api/users/:id` | Admin | Editar usuário |
| DELETE | `/api/users/:id` | Admin | Excluir usuário |
| POST | `/api/upload` | Admin | Importar planilha CSV/XLSX |
| GET | `/api/semesters` | Autenticado | Listar semestres disponíveis |
| GET | `/api/reports/records` | Autenticado | Relatório acadêmico (com filtros) |
| GET | `/api/reports/students` | Autenticado | Base de alunos (com filtros) |
| GET | `/api/reports/courses` | Autenticado | Listagem de cursos |
| GET | `/api/reports/dashboard` | Autenticado | Indicadores do dashboard |
| GET | `/api/students/:registration/history` | Autenticado | Histórico do aluno |
| GET | `/api/students/:registration/actions` | Autenticado | Ações de acompanhamento |
| POST | `/api/students/:registration/actions` | Admin | Registrar nova ação |
| PUT | `/api/actions/:id` | Admin | Editar ação |
| DELETE | `/api/actions/:id` | Admin | Excluir ação |

---

## Deploy

O projeto é hospedado inteiramente no **Render.com** com deploy automático via GitHub.

| Serviço | Plataforma | URL |
|---|---|---|
| Backend | Render Web Service (Go) | `https://ada-backend.onrender.com` |
| Frontend | Render Static Site | `https://frontend-ada.onrender.com` |
| Banco de Dados | Aiven PostgreSQL | Gerenciado na nuvem |

> O arquivo `frontend/public/_redirects` contém a regra `/* /index.html 200`, necessária para que o roteamento client-side do React funcione ao recarregar ou acessar diretamente uma rota no Render.

---

## Autor

Desenvolvido por **Matheus** como Trabalho de Conclusão de Curso — Ciência da Computação, UFES.
