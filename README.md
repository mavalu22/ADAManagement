# AdaManagement - Sistema de Acompanhamento Acadêmico

![UFES Logo](https://alegre.ufes.br/sites/all/themes/padrao_ufes/logo.png)

> Sistema fullstack de gerenciamento acadêmico desenvolvido para a UFES, focado em controle de usuários, permissões e integridade de dados.

## 🚀 Sobre o Projeto

O **AdaManagement** é uma plataforma moderna construída sob a arquitetura de Monorepo. O objetivo é fornecer uma interface limpa e responsiva para administração de professores e alunos, com um backend robusto e performático.

### Principais Funcionalidades

* **Autenticação JWT:** Login seguro com tokens expiráveis.
* **Controle de Acesso (RBAC):** Diferenciação entre `Admin` e `User`.
* **Gestão de Usuários:** Admins podem criar, listar, remover e promover usuários.
* **Proteção de Integridade:** O "Admin Master" (ID 1) não pode ser excluído ou rebaixado.
* **Auto-Seed:** O sistema recria o ambiente de desenvolvimento e o Admin padrão a cada reinicialização (configurável).

## 🛠️ Tecnologias Utilizadas

### Backend (API)
* **Linguagem:** Go (Golang) 1.23+
* **Framework:** Gin Gonic (Alta performance HTTP)
* **Banco de Dados:** SQLite (com driver Pure Go `glebarez`)
* **ORM:** GORM
* **Auth:** Golang-JWT & Bcrypt

### Frontend (UI)
* **Framework:** React + Vite
* **Componentes:** Material UI (MUI v5)
* **HTTP Client:** Axios
* **Notificações:** React Toastify
* **Rotas:** React Router Dom

---

## 📦 Como Rodar o Projeto

### Pré-requisitos
* [Go](https://go.dev/dl/) instalado.
* [Node.js](https://nodejs.org/) instalado.
* Git.

### 1. Configuração do Backend

Entre na pasta do backend, crie o arquivo de configuração e instale as dependências:

```bash
    cd backend

    # Crie o arquivo .env com as configurações abaixo
    # (Veja a seção "Configuração de Ambiente" abaixo)

    # Instale as dependências
    go mod tidy

    # Rode o servidor
    go run cmd/server/main.go
```

O servidor iniciará em http://localhost:8080. Nota: Na primeira execução, o banco de dados será criado automaticamente.

### 2. Configuração do Frontend

Abra um novo terminal, entre na pasta do frontend e instale as dependências:

```bash
    cd frontend

    # Instalar pacotes
    npm install

    # Rodar em modo desenvolvimento
    npm run dev
```