# 🌱 Desenvolvimento Frontend - Guia Prático

## Arquitetura Pensada

```
User Flow:
Login → Dashboard (lista plantas) → Click Planta → Expandir Detalhes + Fotos
```

## Como Adicionar Novas Funcionalidades

### 1. Novo Endpoint da API

Adicione em `src/services/api.ts`:

```typescript
// Exemplo: Adicionar método para atualizar planta
async updatePlanta(id: number, dados: any): Promise<Planta> {
  const response = await this.axiosInstance.put(`/plantas/${id}`, dados);
  return response.data;
}
```

### 2. Novo Componente

```typescript
// src/components/NovoComponente.tsx
import './NovoComponente.css';

interface Props {
  // suas props
}

export function NovoComponente({ }: Props) {
  return (
    <div className="novo-componente">
      {/* conteúdo */}
    </div>
  );
}
```

### 3. Adicionar Tipo TypeScript

Em `src/types/index.ts`:

```typescript
export interface NovoTipo {
  id: number;
  nome: string;
  // seus campos
}
```

### 4. Usar Hook de Autenticação

```typescript
import { useAuth } from '../hooks/useAuth';

function MeuComponente() {
  const { usuario, logout } = useAuth();
  // seu componente
}
```

## Estrutura de CSS

Cada componente tem seu próprio arquivo CSS seguindo padrão BEM:

```css
.componente {}
.componente-header {}
.componente-item {}
.componente-item.ativo {}
```

## Estados de Carregamento

Padrão usado:
```typescript
const [carregando, setCarregando] = useState(false);
const [erro, setErro] = useState('');
const [dados, setDados] = useState(null);
```

## Autenticação

O sistema usa `localStorage` para persistir:
- `usuario`: dados do usuário logado
- `credentials`: login e senha (base64 no axios)

Ao fazer logout, ambos são removidos.

## Paginação

Implementada usando os campos do Spring Data:
- `page`: número da página (0-indexed)
- `size`: quantidade de itens
- Response inclui `totalPages`, `totalElements`, `content`

## Melhorias Sugeridas

### Curto Prazo
- [ ] Adicionar criar/editar planta
- [ ] Upload de fotos
- [ ] Deletar planta
- [ ] Modal com confirmação

### Médio Prazo
- [ ] Listagem de aditivos principal
- [ ] CRUD de aditivos
- [ ] Dashboard com gráficos
- [ ] Socket.io para atualizações em tempo real

### Longo Prazo
- [ ] Dark mode
- [ ] PWA (offline)
- [ ] Notificações
- [ ] Integração com dispositivos IoT

## Debugging

### CORS Issues
Se tiver erro de CORS, verifique na API:
```java
@CrossOrigin(origins = "http://localhost:3000")
```

### API não conecta
1. Verifique se está rodando em `http://localhost:8080`
2. Cheque logs da API
3. Tente acessar um endpoint direto no navegador

### Imagens não carregam
- Verifique tipo MIME nos headers
- Cheque tamanho da imagem
- Veja console do navegador para erros 404

## Padrões de Código

### Nomear variáveis
```typescript
// ✅ Bom
const usuarioAutenticado = usuario !== null;
const listaPlantasCarregada = !carregando;

// ❌ Evitar
const u = usuario;
const loading = carregando;
```

### Tratamento de erros
```typescript
try {
  await apiService.getPlantaCompleta(id);
} catch (err: any) {
  setErro(err.response?.data?.message || 'Erro ao carregar');
}
```

## Build & Deploy

### Produção
```bash
npm run build
# Arquivos em dist/
```

### Servir com servidor Python (teste rápido)
```bash
cd dist
python -m http.server 3000
```

### Docker
Adicionar `Dockerfile` se needed:
```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm i && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

**Happy coding! 🌿**
