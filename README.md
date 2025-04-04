# StashKeeper Pro

<div align="center">
  <img src="public/logo.svg" alt="StashKeeper Pro Logo" width="120" height="120" />
  <h3>Sistema Avançado de Gerenciamento de Estoque</h3>
</div>

## 📋 Visão Geral

StashKeeper Pro é uma solução completa para gestão de inventário, produtos e colaboradores. Desenvolvida para pequenas e médias empresas, a aplicação oferece uma interface moderna, responsiva e intuitiva para controle total do seu estoque.

![Dashboard](public/dashboard.png)

## ✨ Principais Funcionalidades

### Gerenciamento de Produtos
- Cadastro detalhado com código, nome, descrição, categoria e níveis de estoque
- Alertas automáticos para produtos com estoque baixo ou crítico
- Filtros avançados para localização rápida de itens
- Visualização em tabela moderna com múltiplas opções de interação
- Seleção múltipla para operações em lote

### Movimentações de Estoque
- Registro de entradas e saídas com detalhamento
- Histórico completo de movimentações por produto
- Relatórios de consumo e reposição

### Gestão de Categorias
- Organização hierárquica de produtos
- Estatísticas por categoria
- Filtros rápidos baseados em categorias

### Importação e Exportação
- Integração com planilhas Excel para importação em massa
- Exportação de dados para análise externa
- Importador inteligente com pré-visualização e validação

### Gestão de Colaboradores
- Controle de acesso por usuário
- Histórico de ações por colaborador
- Importação em lote de colaboradores

### UI/UX Avançado
- Design responsivo para desktop, tablet e mobile
- Tema claro/escuro com detecção automática
- Animações suaves para melhor experiência do usuário
- Notificações interativas e toast messages

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Tipagem estática para desenvolvimento mais seguro
- **Vite** - Build tool ultrarrápida para desenvolvimento moderno
- **TailwindCSS** - Framework CSS utility-first para estilização rápida
- **Shadcn UI** - Componentes acessíveis e estilizáveis
- **React Router** - Roteamento client-side
- **React Hook Form** - Gerenciamento de formulários com validação
- **Lucide React** - Ícones modernos e consistentes
- **XLSX** - Manipulação de arquivos Excel
- **Recharts** - Biblioteca de gráficos responsivos

### Backend
- **Supabase** - Plataforma open source para:
  - **PostgreSQL** - Banco de dados relacional
  - **Authentication** - Sistema de autenticação segura
  - **Storage** - Armazenamento de arquivos
  - **Realtime** - Atualizações em tempo real

### Ferramentas de Desenvolvimento
- **ESLint** - Linting de código
- **TypeScript** - Verificação de tipos estáticos
- **Git** - Controle de versão
- **Vercel** - Plataforma de deploy

## 🚀 Instalação e Uso

### Pré-requisitos
- Node.js 18 ou superior
- npm ou yarn

### Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/Guilhermedev17/stashkeeper-pro.git
cd stashkeeper-pro

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env.local com o seguinte conteúdo:
# VITE_SUPABASE_URL=seu-url-do-supabase
# VITE_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

### Build para Produção

```bash
# Compilar para produção
npm run build

# Visualizar a build localmente
npm run preview
```

### Deploy

O StashKeeper Pro pode ser facilmente implantado em serviços como Vercel, Netlify ou qualquer host que suporte aplicações React:

```bash
# Deploy na Vercel
npm run deploy
```

## 📱 Compatibilidade

- ✅ Desktop (Windows, macOS, Linux)
- ✅ Tablets (iOS, Android)
- ✅ Smartphones (iOS, Android)
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)

## 🔒 Segurança

- Autenticação segura via Supabase Auth
- Controle de acesso baseado em funções
- Validação de dados no cliente e servidor
- Proteção contra ataques comuns (XSS, CSRF)

## 📘 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

## 👥 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📞 Contato e Suporte

- **Desenvolvedor**: Guilherme
- **GitHub**: [@Guilhermedev17](https://github.com/Guilhermedev17)
- **Email**: [contato@stashkeeper.com](mailto:contato@stashkeeper.com)

---

<div align="center">
  <p>Desenvolvido com ❤️ no Brasil</p>
  <p>Copyright © 2024 StashKeeper Pro</p>
</div>
