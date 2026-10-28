# PROJECT SPEC --- Quick Translator

## Aplicativo mobile de tradução rápida para Android e iOS

**Papel da IA:** atue como engenheiro de software mobile experiente.
Implemente o aplicativo funcional descrito abaixo; não entregue apenas
telas estáticas ou um plano.

## 0. Instruções obrigatórias ao Codex

1.  Inspecione o repositório, as versões instaladas, scripts e estado do
    Git antes de alterar arquivos.
2.  Se estiver vazio, crie um projeto Expo com template estável atual.
    Use `npx expo install` para módulos Expo compatíveis com o SDK. Não
    force versões incompatíveis.
3.  Crie e mantenha `TASKS.md` com etapas e progresso. Planeje
    brevemente e depois prossiga com a implementação; não pare apenas no
    planejamento.
4.  Implemente em incrementos, executando TypeScript, lint, testes e
    verificações Expo disponíveis. Corrija falhas antes de avançar.
5.  Não remova arquivos existentes sem necessidade. Não crie botões
    decorativos, funcionalidades falsas ou dados simulados apresentados
    como reais.
6.  Não inclua segredos, tokens ou chaves privadas no código, bundle
    mobile, `.env` versionado ou `EXPO_PUBLIC_*`.
7.  Se um serviço externo ou dispositivo não estiver disponível,
    documente a limitação e não afirme que foi validado.
8.  Ao concluir, informe arquivos importantes, funcionalidades, comandos
    executados, testes realmente realizados, limitações e instruções
    Android/iOS.

## 1. Visão do produto

Quick Translator é um app para traduzir textos rapidamente em viagens,
estudos e trabalho. O fluxo principal: escolher idiomas, digitar/colar
texto, traduzir, ouvir pronúncia, copiar ou salvar.

O app deve funcionar offline para consultar histórico e frases salvas.
**Não prometa tradução de novos textos offline** sem implementar e
validar um mecanismo local real.

Princípios: rapidez, privacidade, acessibilidade, responsividade,
arquitetura modular e comportamento previsível em falhas de rede.

## 2. Stack

-   React Native + Expo.
-   TypeScript com `strict: true`.
-   Expo Router para navegação, se compatível com o projeto/template.
-   SQLite com `expo-sqlite` ou solução equivalente compatível com o SDK
    instalado.
-   `expo-speech` para text-to-speech do sistema.
-   AsyncStorage somente para preferências pequenas, se necessário.
-   API REST gratuita de tradução para o MVP.
-   ESLint, Prettier e testes unitários/de componentes compatíveis com
    as versões instaladas.
-   React Native Testing Library e Jest ou a combinação suportada pelo
    template atual.

Antes de adicionar dependências, verifique compatibilidade, manutenção e
necessidade. Use `npx expo install` para módulos Expo. Não introduza
Redux/Zustand ou bibliotecas de rede/estado redundantes sem
justificativa.

## 3. API de tradução gratuita

### Provider inicial sugerido: MyMemory Translation API

Documentação oficial de limites:
https://mymemory.translated.net/doc/usagelimits.php

A documentação informa limite gratuito anônimo de 5.000 caracteres/dia e
até 50.000 caracteres/dia quando se fornece um e-mail válido no
parâmetro `de`. **Confirme os limites e parâmetros atuais antes de
implementar**, registre a data da verificação no README e não trate a
cota como ilimitada. O app não precisa solicitar e-mail no MVP.

-   Use o endpoint oficial documentado e valide o formato atual da
    requisição/resposta.
-   Qualidade, cobertura e disponibilidade podem variar.
-   Trate limites, timeouts, erros HTTP, resposta vazia e payload
    inesperado.
-   Não envie e-mail, histórico ou favoritos ao provedor.
-   Não exponha chave secreta no app. Se outro provedor exigir segredo,
    será necessário um backend proxy seguro; não embuta a chave no
    bundle.

### Provider alternativo: LibreTranslate

Documentação: https://docs.libretranslate.com/

LibreTranslate é open source, mas a instância pública oficial pode
exigir chave e uso de produção pode ser pago. Hospedar uma instância
própria pode ter custos de infraestrutura. Não dependa de espelhos
públicos aleatórios sem verificar confiabilidade, privacidade e termos.

Implemente uma camada `TranslationProvider` independente da UI para
trocar o provedor sem reescrever telas. Não aceite endpoints arbitrários
informados por usuários. Exija HTTPS em produção.

### Contrato de domínio sugerido

``` ts
type TranslateInput = {
  text: string;
  sourceLanguage: string; // "auto" somente se suportado
  targetLanguage: string;
};

type TranslationResult = {
  translatedText: string;
  detectedSourceLanguage?: string;
  provider: string;
  translatedAt: string;
};

interface TranslationProvider {
  translate(input: TranslateInput, signal?: AbortSignal): Promise<TranslationResult>;
  getSupportedLanguages(): Promise<LanguageOption[]>;
}
```

Ajuste o contrato ao provider real. Não alegue detecção automática se o
serviço não suportar. Normalize erros externos em erros internos
tipados.

### Privacidade e rede

-   Informar claramente que o texto enviado será processado pelo serviço
    externo.
-   Não enviar dados que não sejam necessários à tradução.
-   Não registrar texto original/traduzido em logs, analytics ou
    relatórios de crash.
-   Timeout, cancelamento quando possível e retry limitado somente para
    falhas transitórias.
-   Limitar tamanho de entrada e mostrar contador.
-   Evitar chamadas duplicadas por toques repetidos.
-   Não repetir automaticamente solicitações canceladas.
-   Não prometer criptografia ponta a ponta nem privacidade além do que
    o provider garante.

## 4. Funcionalidades obrigatórias

### 4.1 Tradução principal

-   Campo para digitar ou colar texto.
-   Seletor de idioma de origem e destino, com pesquisa por idioma.
-   Origem automática apenas se suportada pelo provider.
-   Trocar idiomas com um toque e comportamento definido para origem
    automática.
-   Limpar texto, contador de caracteres e validação de texto vazio.
-   Botão traduzir com loading e proteção contra duplo toque.
-   Exibir resultado em área distinta.
-   Copiar resultado, ouvir pronúncia e salvar em favoritos.
-   Reutilizar o resultado como novo texto de origem.
-   Mensagens claras para offline, timeout, limite de uso, idioma
    indisponível e resposta inválida.
-   Preservar o texto original quando a tradução falhar.
-   Teclado não pode cobrir ações importantes.

### 4.2 Idiomas

-   Lista tipada com códigos aceitos pelo provider.
-   Nome amigável no idioma da interface.
-   Pesquisa por nome.
-   Idiomas recentes/favoritos e último par usado persistidos.
-   Não mostrar idiomas não suportados pelo provider ativo.
-   Mapear códigos do provider para locales de speech e tratar
    incompatibilidades.

### 4.3 Pronúncia

-   Usar `expo-speech` para falar texto original ou traduzido.
-   Botões separados para cada texto.
-   Usar locale de voz compatível quando disponível; fallback para voz
    padrão.
-   Interromper a fala atual antes de iniciar outra.
-   Tratar voz ausente/erro sem fechar a tela.
-   Não armazenar arquivos de áudio no MVP.
-   Documentar limitações do sistema. Em dispositivos iOS físicos,
    `expo-speech` pode não produzir som com o modo silencioso ativado.

### 4.4 Histórico

-   Salvar traduções concluídas automaticamente após sucesso.
-   Guardar texto original, tradução, idiomas, provider e data.
-   Mais recentes primeiro; pesquisa em ambos os textos.
-   Filtrar por idioma, abrir detalhe e repetir tradução.
-   Excluir item e limpar tudo com confirmação.
-   Persistir após reinício.
-   Definir limite de retenção razoável e documentado.
-   Nunca registrar conteúdo em console de produção.

### 4.5 Favoritos e frases offline

-   Favoritar/desfavoritar traduções.
-   Tela de favoritos acessível sem internet.
-   Pesquisar favoritos.
-   Coleções como Viagem, Trabalho e Estudo; criar, renomear e excluir.
-   Explicar o efeito de apagar uma coleção e evitar exclusão acidental.
-   Copiar original/tradução e ouvir pronúncia de frases salvas quando
    houver voz.
-   Favoritos devem continuar disponíveis offline.
-   Diferenciar "frase salva offline" de "tradução de texto novo
    offline".

### 4.6 Preferências

-   Tema claro, escuro ou seguir sistema.
-   Idiomas padrão e preferido.
-   Limpar histórico.
-   Exportar dados locais para JSON.
-   Importar JSON validado, mostrar prévia da quantidade de itens e
    pedir confirmação antes de mesclar/substituir.
-   Tela Sobre com versão, provider, link para privacidade e limitações.
-   Sem login no MVP.

### 4.7 Estados obrigatórios

Loading, erro recuperável, lista vazia, busca sem resultados, offline,
limite excedido, idioma indisponível, texto inválido, persistência com
falha e sucesso. Use feedback contextual; confirme ações destrutivas
relevantes. Nenhum botão pode ser puramente decorativo.

## 5. Design, responsividade e acessibilidade

Crie uma interface original, profissional e moderna; não copie
exatamente Google Translate ou DeepL.

-   Minimalista, hierarquia tipográfica clara e área de tradução como
    foco.
-   Tokens de design centralizados: cores, espaçamento, tipografia,
    bordas e elevação.
-   Tema claro/escuro, contraste adequado e ícones com labels quando
    necessário.
-   Adaptar-se a telas pequenas/grandes, densidades e tamanhos de fonte
    do sistema.
-   Safe areas, teclado e scroll devem funcionar corretamente.
-   Evitar larguras/alturas rígidas e testar diferentes tamanhos de
    tela.
-   Respeitar padrões de navegação, gestos de voltar e áreas de toque de
    Android/iOS.
-   Labels, roles, ordem de leitura e foco acessíveis.
-   Compatibilidade com VoiceOver e TalkBack nos fluxos principais.
-   Não depender apenas de cor; respeitar `prefers-reduced-motion`
    quando aplicável.
-   Não afirmar testes em iOS físico se não foram realizados.

## 6. Arquitetura sugerida

Ajuste a estrutura ao template Expo e siga o padrão oficial do Expo
Router caso seja usado.

``` text
src/
  app/                       # rotas/layouts, se o template assim organizar
  components/
    ui/                      # botões, campos, cards, feedback
    layout/
  features/
    translate/
      components/
      hooks/
      screens/
    history/
      components/
      screens/
    favorites/
      components/
      screens/
    collections/
      screens/
    settings/
      screens/
  domain/
    languages/
    translations/
    errors/
  services/
    translation/
      providers/
      translation-provider.ts
      translation-service.ts
    speech/
    clipboard/
    export/
  database/
    migrations/
    repositories/
    schema/
  theme/
    tokens.ts
    themes.ts
  utils/
  types/
```

### Regras

-   Telas não chamam `fetch` diretamente.
-   Componentes de UI não acessam SQLite diretamente.
-   Lógica de domínio testável sem renderizar a UI.
-   Repositories para histórico, favoritos, coleções e preferências.
-   Provider adapter para tradução e normalização de erros.
-   Migrations para evoluir schema sem perder dados.
-   Queries SQL parametrizadas e transações para operações compostas.
-   Separar estado local, lógica de domínio e dependências globais.
-   Não concentrar tudo em um Context global, hook gigante ou componente
    monolítico.
-   Evitar abstrações genéricas sem uso real.
-   Não adicionar biblioteca global de estado sem justificativa
    concreta.

## 7. Dados locais

Use SQLite para entidades estruturadas e defina schema tipado,
constraints, índices e migrations.

Entidades mínimas: - `translations`: id, source_text, translated_text,
source_language, target_language, provider, created_at. -
`favorite_translations`: id, translation_id ou snapshot independente,
created_at. - `collections`: id, name, created_at, updated_at. -
`collection_items`: collection_id, translation_id e chave única
composta. - Preferências: tema, último par de idiomas, idiomas
favoritos. - Versão de schema/migrations.

Documente se favoritos referenciam traduções do histórico ou guardam um
snapshot. Apagar o histórico não deve apagar favoritos inesperadamente.
Use IDs estáveis, transações, validação e tratamento de falhas. Não
concatene entrada do usuário em SQL. Não apague dados durante migrações.

## 8. Segurança

-   Nenhuma chave privada no código, `app.json`, `app.config.*`, `.env`
    versionado ou `EXPO_PUBLIC_*`.
-   `.env.example` apenas para valores públicos não secretos;
    `.gitignore` adequado.
-   Não aceitar endpoints arbitrários inseridos pelo usuário.
-   HTTPS para serviços remotos em produção.
-   Validar e limitar entradas e respostas da API.
-   Tratar respostas como texto simples, nunca HTML executável.
-   Validar schema, tipos, tamanho e quantidade de itens no JSON
    importado.
-   Não usar `eval` ou desserialização insegura.
-   Não registrar conteúdo pessoal em logs.
-   Pedir somente permissões necessárias; o MVP não precisa de câmera,
    localização ou contatos.
-   Se um provider exigir segredo, mover a chamada para backend com rate
    limiting, validação e gestão segura de segredo.
-   Explicar no README que o texto enviado é compartilhado com o
    provider e sujeito à política dele.

## 9. Erros e resiliência

Criar erros internos como `NETWORK_ERROR`, `TIMEOUT`, `RATE_LIMITED`,
`UNSUPPORTED_LANGUAGE`, `INVALID_INPUT`, `PROVIDER_ERROR`,
`INVALID_PROVIDER_RESPONSE`, `STORAGE_ERROR` e
`IMPORT_VALIDATION_ERROR`.

-   Mensagens ao usuário claras, sem stack traces nem payloads técnicos.
-   Tratar HTTP não-2xx e respostas 2xx malformadas.
-   Retry limitado apenas para falhas transitórias; nunca repetir erros
    de validação ou rate limit sem respeitar a indicação do provider.
-   Preservar texto de entrada em falhas.
-   Diferenciar falha de tradução de falha ao salvar histórico.
-   Se tradução funcionar e persistência falhar, permitir tentar salvar
    novamente.
-   Offline: histórico/favoritos funcionam; tradução remota é
    desabilitada com explicação.
-   Não usar fixtures como fallback silencioso para tradução real.

## 10. Performance e código

-   TypeScript strict; evitar `any` e `@ts-ignore` injustificados.
-   `FlatList` para listas potencialmente grandes.
-   Debounce na busca quando necessário.
-   Limitar retenção do histórico ou permitir limpeza.
-   Funções de parsing/validação puras e testáveis.
-   Nomes claros, imports limpos, sem código morto ou logs de debug.
-   Não usar `useMemo`/`useCallback` indiscriminadamente; otimizar por
    necessidade observável.
-   Manter componentes reutilizáveis sem criar design system exagerado.

## 11. Testes

### Unitários

-   Texto vazio/limites; troca de idiomas e origem automática.
-   Mapeamento de idiomas para speech.
-   Normalização de erros e parsing de resposta.
-   Validação de import/export JSON.
-   Regras de favoritos, coleções e retenção.

### Integração

-   Provider mockado e erros de rede.
-   Persistência de histórico, favoritos e coleções.
-   Falha de banco; tradução concluída mas falha ao salvar.
-   Importação inválida sem corromper dados.
-   Preferências após reinício lógico.

### UI

-   Loading e proteção contra duplo toque.
-   Erro preserva texto de entrada.
-   Copiar/favoritar/falar com APIs mockadas.
-   Estados vazios e busca sem resultados.
-   Labels acessíveis nos controles principais.

### Validação manual

Documentar checklist Android/iOS, teclado em tela pequena, tema,
offline, rate limit, voz indisponível e persistência após reiniciar.
Executar somente o que o ambiente permitir e relatar precisamente os
resultados.

## 12. Navegação e telas

No mínimo: 1. **Traduzir** --- tela principal. 2. **Histórico** ---
lista, pesquisa e detalhe. 3. **Favoritos** --- frases e coleções. 4.
**Configurações** --- tema, idiomas, dados locais, provider e
privacidade. 5. **Sobre** --- versão, documentação, provider e
limitações.

Use navegação mobile apropriada (por exemplo, tabs inferiores para áreas
principais e stack para detalhes). Rotas inválidas devem ter fallback.
Não apagar texto digitado ao alternar de tela inesperadamente.

## 13. Definition of Done

-   [ ] App inicia no Android e projeto está configurado para iOS.
-   [ ] Tradução real integrada ou bloqueio externo documentado; nunca
    simular sucesso.
-   [ ] Seleção de idiomas, texto, loading e erros funcionam.
-   [ ] Texto permanece após falha.
-   [ ] Copiar e pronúncia funcionam quando suportados.
-   [ ] Histórico, favoritos e coleções persistem.
-   [ ] Favoritos/histórico disponíveis offline.
-   [ ] Busca, tema e preferências funcionam.
-   [ ] Import/export JSON validado.
-   [ ] Interface adaptável e controles acessíveis.
-   [ ] Nenhuma chave privada no bundle/repositório.
-   [ ] TypeScript, lint e testes configurados passam ou pendências
    estão documentadas.
-   [ ] README cobre instalação, execução, API/cotas, privacidade,
    testes e limitações.
-   [ ] Não há botões sem ação nem dados demonstrativos apresentados
    como reais.

## 14. Entregáveis

-   App React Native + Expo + TypeScript funcional.
-   Provider de tradução isolado.
-   SQLite com migrations.
-   Histórico, idiomas favoritos, favoritos de tradução, coleções,
    pronúncia e modo offline para dados salvos.
-   Tratamento de erros e testes para regras críticas.
-   `README.md` com screenshots, stack, instalação, comandos, provider,
    cotas, privacidade, limitações e checklist de validação.
-   `TASKS.md` atualizado.
-   `.gitignore` correto e `.env.example` somente se necessário.
-   Nenhuma credencial real.

## 15. Fora do escopo inicial

-   Login, sincronização em nuvem, pagamentos.
-   Tradução de voz em tempo real ou por câmera.
-   Modelo totalmente offline para novos textos.
-   Garantia de API gratuita ilimitada.
-   Pronúncia idêntica em todos os dispositivos.

Podem ser sugeridos como evolução futura, mas não devem bloquear o MVP.

## 16. Ordem de implementação

1.  **Auditoria e fundação:** inspecionar projeto; configurar Expo,
    TypeScript, lint, testes, navegação e tokens; validar inicialização.
2.  **Interface principal:** tradução, seletores, estados e
    acessibilidade.
3.  **Provider:** confirmar documentação/cotas atuais; implementar
    adapter, validação, timeout e erros; teste real controlado se houver
    conectividade.
4.  **Persistência:** schema, migrations, repositories, histórico,
    favoritos e coleções; testar reinicialização.
5.  **Pronúncia e preferências:** `expo-speech`, idiomas favoritos, tema
    e configurações.
6.  **Import/export e acabamento:** validação JSON, busca,
    responsividade e acessibilidade.
7.  **Verificação final:** executar TypeScript, lint, testes e
    verificações Expo disponíveis; corrigir falhas; finalizar README e
    TASKS.

**Comece agora pela Etapa 1. Inspecione o projeto e continue até
entregar a aplicação funcional. Não se limite a fornecer instruções ou
um plano.**
