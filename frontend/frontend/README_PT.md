# Cultivo Inteligente - Frontend

## 🌱 Sobre

Um frontend React moderno para gerenciar e visualizar suas plantas de cultivo inteligente.

## 🎯 Funcionalidades

- **Login**: Autenticação com Basic Auth
- **Dashboard**: Visualização de todas as plantas
- **Expandível 1**: Dados gerais da planta (altura, largura, tamanho do vaso, etc)
- **Expandível 2**: Galeria de fotos da planta
- **Aditivos**: Listagem de aditivos utilizados na planta
- **Design Clean**: Interface intuitiva com tema verde/natural

## 🚀 Quick Start

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- API rodando em `http://localhost:8080`

### Instalação

```bash
cd frontend
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

### Build

```bash
npm run build
npm run preview
```

## 📁 Estrutura

```
src/
├── components/          # Componentes reutilizáveis
│   └── PlantaCard.tsx   # Card com accordion de planta
├── pages/               # Páginas da aplicação
│   ├── Login.tsx        # Página de login
│   └── Dashboard.tsx    # Dashboard principal
├── services/            # Serviços e chamadas HTTP
│   └── api.ts          # Cliente HTTP com Basic Auth
├── context/             # Context API
│   └── AuthContext.tsx  # Contexto de autenticação
├── hooks/               # Custom hooks
│   └── useAuth.ts       # Hook de autenticação
├── types/               # Tipos TypeScript
│   └── index.ts         # Definições de tipos
├── App.tsx              # Componente raiz
├── main.tsx             # Entry point
└── index.css           # Estilos globais
```

## 🎨 Design

- **Tema**: Verde e roxo (jardim/natureza)
- **Componentes**: Accordion/Expandível
- **Responsivo**: Mobile-first
- **CSS**: Puro (sem bibliotecas externas)

## 🔐 Autenticação

Usa Basic Auth igual à API:
- Login e senha são enviados como base64 no header `Authorization`
- Credenciais são salvas no localStorage
- Sessão é restaurada no reload

## 📝 Fluxo

1. **Login** → insere login/senha
2. **Dashboard** → lista de plantas
3. **Expandir Planta** → carrega detalhes e aditivos
4. **Ver Fotos** → expande galeria de imagens

## 🔧 Configuração

### Alterar URL da API

Em `src/services/api.ts`:
```typescript
const API_URL = 'http://seu-servidor:porta';
```

### Alterar cores

Em `src/pages/Login.css` e `src/pages/Dashboard.css`:
- Ajustar gradientes
- Alterar cores de destaque (verde `#22c55e`)
- Customizar paleta de cores

## 📦 Dependências

- **React 18**: Framework UI
- **TypeScript**: Tipagem estática
- **Axios**: Cliente HTTP
- **Vite**: Build tool (dev server rápido)

## 🐛 Troubleshooting

### "Cannot GET /plantas"
- Certifique-se de que a API está rodando em `http://localhost:8080`
- Verifique CORS na API

### "401 Unauthorized"
- Login/senha incorretos
- Verifique credenciais no localStorage

### Imagens não carregam
- Verifique se o endpoint `/plantas/{id}/fotos/{id}/imagem` existe
- Cheque CORS para blob responses

## 📚 Próximas melhorias

- [ ] Adicionar novo usuário
- [ ] Criar nova planta
- [ ] Upload de fotos
- [ ] Edição de dados da planta
- [ ] Dados em tempo real (WebSocket)
- [ ] Temas escuro/claro
- [ ] PWA (offline support)
- [ ] Deploy automático

---

**Desenvolvido com ❤️ para Cultivo Inteligente**
