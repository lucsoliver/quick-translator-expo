# Quick Translator — tarefas e validações

## Progresso

- [x] Auditar a especificação da raiz, ambiente, repositório e dependências existentes.
- [x] Alinhar módulos ao Expo SDK 57; configurar Expo Router, TypeScript strict, ESLint e testes.
- [x] Implementar seleção pesquisável de idiomas, UI de tradução, MyMemory, timeout, erros, cópia, pronúncia e reuso.
- [x] Implementar SQLite v1, cache, histórico com limite, snapshots de favoritos e coleções.
- [x] Preservar histórico/cache existentes com migração única de AsyncStorage para SQLite.
- [x] Implementar tema sistema/claro/escuro, idiomas padrão, busca, exclusão, importação/exportação JSON e privacidade.
- [x] Documentar execução, provider, cotas, limitações e checklist em README.
- [ ] Validar fluxos manuais em dispositivo/emulador Android e iOS; sem dispositivo disponível nesta execução.
- [ ] Exercitar SQLite/migração, arquivos e voz em runtime nativo; a suíte automatizada cobre o adapter HTTP.

## Auditoria inicial

- O diretório já continha um app Expo e lockfile, mas não tinha Git, `node_modules` ou README.
- Node 26.5.0 e npm 11.17.0. Stack inicial: Expo SDK 57, React 19.2.3 e React Native 0.86.3.
- A UI inicial oferecia português/inglês, LibreTranslate e AsyncStorage, sem favoritos/coleções/configurações completas.
- Documentação oficial MyMemory consultada em 28/10/2026: GET `/get`, `q` até 500 bytes, `langpair` ISO/RFC 3066, cota anônima de 5.000 caracteres/dia ou até 50.000/dia mediante email válido. O app não solicita nem envia email.

## Validações finais

- [x] Dependências instaladas e alinhadas com `npx expo install --fix` sem `--force`.
- [x] `npx expo install --check` — dependências em dia para SDK 57.
- [x] `npm run typecheck` — passou.
- [x] `npm run lint` — passou sem avisos/erros.
- [x] `npm test` — 4 testes passaram: formato e parsing HTTP, texto/idioma inválido, limite/resposta inválida e falha de rede.
- [x] Solicitação de teste real ao MyMemory com o texto não pessoal `Hello`, par `en|pt`: HTTP 200 e tradução retornada. O resultado usou variante regional PT-PT.
- [x] `npx expo config --type public` — reconheceu Android, iOS e configuração Expo Router.
- [x] `npx expo export --platform android` — bundle Hermes gerado.
- [x] `npx expo export --platform ios` — bundle Hermes gerado; isso não equivale a compilação/execução em dispositivo iOS.
- [x] `npm audit --omit=dev` — nenhuma vulnerabilidade em dependências de produção. O audit completo sinalizou 12 vulnerabilidades transitivas/de desenvolvimento; não foi aplicado `audit fix --force`.
- [x] Busca de padrões de chaves conhecidas nos arquivos da aplicação não encontrou credenciais; não há `.env` versionado.

## Limitações conhecidas

- Sem execução em dispositivo/emulador Android ou iOS.
- Persistência/migração SQLite, compartilhamento de arquivos, áudio, leitor de tela e temas não foram exercitados em runtime nativo.
- Não foram produzidas screenshots reais; o checklist manual aguarda dispositivo.
- A tradução de novos textos é online; histórico e favoritos persistidos ficam disponíveis offline.
