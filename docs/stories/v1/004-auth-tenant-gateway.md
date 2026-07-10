# Story 004 — Auth via Better-Auth do gateway

**Prioridade:** P0
**Escopo:** v1
**Depende de:** 001, 003

## Contexto
`AuthContext` atual tem 200+ linhas: `onAuthStateChange`, `loadProfileAndRole` (2 queries),
`checkActive` chamando edge function, `beforeunload` fazendo PATCH no profile. Tudo isso
sai. Better-Auth via `auth` do gateway resolve em 5 chamadas.

## Objetivo
Novo `src/lib/auth.tsx` (contexto + hook) baseado em `auth.me/signIn/signUp/signOut` do
gateway. Papel (`admin`/`manager`/`rep`) vem no `me()`.

## Fora de escopo
- Convite de usuário (feature do gateway, não do template).
- 2FA, reset de senha via email (Better-Auth resolve, UI padrão vem do scaffold).
- Status online/offline (some).

## Regras aplicáveis (Importantdoc)
- §B3 — Auth via `auth`, nunca implemente auth próprio.
- §B8 — Papéis admin/manager/rep; 1º user do tenant = admin (automático); demais = rep.
- §B4 — sem tabela `profiles`.

## Design / Arquitetura
- `src/lib/auth.tsx` — `AuthProvider`, `useAuth()`, `RequireAuth`, `RoleGate`.
  Vem do scaffold `wiki` (adaptável em `editable.allow`, mas segue o contrato).
- `src/screens/LoginScreen.tsx` — do scaffold. Substitui `src/pages/Auth.tsx` + `LoginForm`
  + `SignupForm` + `AnimatedAuthForm`. Se quisermos manter a estética "Viver de IA",
  refatoramos por dentro respeitando o contrato de `auth.signIn`.
- Rotas protegidas: `<Route element={<RequireAuth />}> ... </Route>`.

## Exemplo (antes → depois)

**Antes — `AuthContext.tsx`:**
```ts
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
const [{ data: profile }, { data: roleRow }] = await Promise.all([
  supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
]);
```

**Depois — `src/lib/auth.tsx`:**
```ts
const { user } = await auth.signIn({ email, password });
const me = await auth.me();  // { user: {...}, role: 'admin' | 'manager' | 'rep' }
setSession({ user: me.user, role: me.role });
```

## Tarefas
- [ ] Deletar `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`.
- [ ] Copiar `src/lib/auth.tsx` do scaffold (se ainda não veio no 001).
- [ ] Refazer `src/screens/LoginScreen.tsx` com identidade "Viver de IA".
- [ ] Reescrever `RoleGate` para consumir `useAuth().role`.
- [ ] Remover todo uso de `is_active`, `is_approved`, `onboarding_completed` no app.
- [ ] Ajustar `AppShell` para mostrar nome/avatar de `me.user`.

## Definition of Done
- [ ] DoD padrão cumprido.
- [ ] Login e signup funcionam contra um gateway local (`VITE_GATEWAY_URL=http://localhost:8787`).
- [ ] `useAuth().role` retorna string do Better-Auth.
- [ ] `<RoleGate roles={['admin','manager']}>` esconde botão para `rep`.

## Riscos
- Se o gateway não devolver `role` em `me()`, story fica bloqueado — validar antes com
  o dono do gateway.
