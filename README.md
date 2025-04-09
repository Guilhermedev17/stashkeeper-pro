# StashKeeper Pro

Sistema de gerenciamento de estoque e controle de inventário.

## Visão Geral

StashKeeper Pro é uma aplicação completa para gerenciar estoques, controlar inventário, categorizar produtos e monitorar movimentações.

## Desenvolvimento

### Executando o projeto

Para executar o projeto localmente, siga estas etapas:

1. Clone o repositório
   ```bash
   git clone https://github.com/Guilhermedev17/stashkeeper-pro.git
   ```

2. Instale as dependências
   ```bash
   cd stashkeeper-pro
   npm install
   ```

3. Inicie o servidor de desenvolvimento
   ```bash
   npm run dev
   ```

### Estrutura do Projeto

O projeto é construído usando React com TypeScript e utiliza várias bibliotecas para fornecer uma experiência moderna.

#### Tecnologias principais

- **React**: Framework UI
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework de estilo
- **Supabase**: Backend como serviço
- **Vite**: Bundler e servidor de desenvolvimento

#### Integrações

- **Banco de dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Armazenamento**: Supabase Storage

## Deploy

Você pode fazer o deploy desta aplicação em qualquer provedor que suporte aplicações React/Vite.

### Hospedagem Sugerida

- **Vercel**: Excelente para aplicações React
- **Netlify**: Suporte a CI/CD integrado
- **GitHub Pages**: Para hospedagem simples

## Licença

Este projeto está licenciado sob a licença MIT.

## Novidades na versão atual

### Atualização Automática de Estoque

Foi implementado um trigger no banco de dados que atualiza automaticamente a quantidade em estoque dos produtos quando movimentações são registradas, atualizadas ou excluídas. Esta funcionalidade garante maior consistência dos dados, mesmo em operações concorrentes.

Para mais detalhes sobre esta implementação, consulte a [documentação específica](docs/atualizar_quantidade_produtos.md).

## Funcionalidades

- Controle completo de estoque
- Gerenciamento de produtos, categorias e movimentações
- Histórico detalhado de movimentações
- Alertas para produtos com estoque baixo
- Relatórios e estatísticas
- Conversão automática entre unidades de medida (kg↔g, l↔ml, m↔cm)
- Interface de usuário intuitiva e responsiva

## Conversão Automática de Unidades

O sistema suporta conversão automática entre diferentes unidades de medida, facilitando o registro de movimentações:

- **Unidades de Peso**: Conversão automática entre kg e g (1kg = 1000g)
- **Unidades de Volume**: Conversão automática entre l e ml (1l = 1000ml)
- **Unidades de Comprimento**: Conversão automática entre m e cm (1m = 100cm)

Esta funcionalidade permite registrar movimentações em qualquer unidade compatível, independentemente da unidade configurada para o produto. O sistema se encarrega de converter as quantidades automaticamente.

Para mais detalhes, consulte a [documentação de conversão de unidades](docs/UNIT_CONVERSION_README.md).
