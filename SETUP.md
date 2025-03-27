# Configuração do StashKeeper Pro

Este guia fornece instruções passo a passo para configurar e executar o StashKeeper Pro localmente, conectado ao Supabase.

## Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn ou bun
- Conta no Supabase (gratuita ou paga)

## Passo 1: Configurar o Supabase

1. Acesse [Supabase](https://supabase.com/) e faça login ou crie uma conta
2. Crie um novo projeto
3. Anote a URL do projeto e a chave anônima (anon key) para uso posterior

## Passo 2: Configurar o banco de dados

1. No painel do Supabase, vá para a seção SQL Editor
2. Execute o script SQL para criar a função necessária:
   - Abra o arquivo `src/sql/create_function_get_user_id_by_email.sql`
   - Copie o conteúdo e execute no SQL Editor do Supabase

## Passo 3: Configurar a Edge Function

1. No painel do Supabase, vá para a seção Edge Functions
2. Crie uma nova função chamada `update-user-role`
3. Copie o conteúdo do arquivo `supabase/functions/update-user-role/index.ts` para a função
4. Configure as variáveis de ambiente necessárias para a função:
   - Clique na função criada
   - Vá para a aba "Settings"
   - Adicione as seguintes variáveis de ambiente:
     - `SUPABASE_URL`: A URL do seu projeto Supabase (a mesma usada no arquivo .env)
     - `SUPABASE_SERVICE_ROLE_KEY`: A chave de serviço do seu projeto Supabase (encontrada em Project Settings > API > service_role key)
5. Implante a função

## Passo 4: Configurar o ambiente local

1. Clone o repositório
2. Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

Substitua `sua_url_do_supabase` e `sua_chave_anon_do_supabase` pelos valores obtidos no Passo 1.

## Passo 5: Instalar dependências e executar o projeto

```bash
# Instalar dependências
npm install
# ou
yarn install
# ou
bun install

# Executar o projeto em modo de desenvolvimento
npm run dev
# ou
yarn dev
# ou
bun dev
```

O aplicativo estará disponível em http://localhost:8080

## Passo 6: Configurar um usuário administrador

Para configurar um usuário como administrador:

1. Registre-se ou faça login no aplicativo
2. Acesse a página de administração
3. Clique em "Tornar-me Administrador"

Alternativamente, você pode definir outro usuário como administrador inserindo o email na página de administração.

## Estrutura do banco de dados

O StashKeeper Pro utiliza as seguintes tabelas no Supabase:

- `products`: Armazena informações sobre produtos
- `categories`: Armazena categorias de produtos
- `movements`: Registra movimentações de entrada e saída de produtos

Se essas tabelas não existirem no seu projeto Supabase, você precisará criá-las manualmente usando o SQL Editor.

## Solução de problemas

- **Erro de conexão com o Supabase**: Verifique se as variáveis de ambiente estão configuradas corretamente
- **Erro ao definir usuário como administrador**: Verifique se a função SQL e a Edge Function foram configuradas corretamente
- **Tabelas não encontradas**: Verifique se as tabelas necessárias foram criadas no Supabase