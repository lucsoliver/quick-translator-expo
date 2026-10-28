# Quick Translator

Aplicativo React Native com Expo para traduções rápidas entre idiomas, histórico local e frases favoritas que continuam consultáveis sem internet.

## Recursos

- Tradução online por MyMemory Translation API, com escolha e busca de idiomas.
- Cache local para evitar repetir solicitações já respondidas.
- Histórico SQLite com pesquisa, reuso e retenção de até 100 itens.
- Favoritos independentes do histórico e coleções locais.
- Pronúncia do texto original e traduzido com `expo-speech`.
- Tema claro, escuro ou conforme o sistema; exportação e importação JSON validadas.
- Migração única do histórico/cache da versão anterior em AsyncStorage para SQLite.

Favoritos e histórico funcionam offline. A tradução de novos textos exige conexão com a internet.

## Requisitos e execução

- Node.js 20 ou mais recente e npm.
- Android Studio/Android SDK para compilar e executar Android localmente.
- macOS com Xcode para compilar e executar iOS localmente.

```sh
npm ci
npm start
```

Use Expo Go compatível com o SDK 57 ou um development build. Para compilar e abrir um emulador/dispositivo conectado:

```sh
npm run android
npm run ios
```

O comando iOS só pode ser executado em macOS com Xcode. `npx expo export --platform android` valida o bundle JavaScript, mas não substitui uma compilação nativa nem um teste em dispositivo.

## Verificações

```sh
npm run typecheck
npm run lint
npm test
npx expo install --check
```

Os testes automatizados exercitam o adapter MyMemory: formato da requisição, parsing de sucesso, entrada inválida, idiomas inválidos, limite, resposta inválida e falha de rede. A persistência SQLite, permissões e áudio ainda precisam de validação manual em Android e iOS.

## Tradução, cotas e privacidade

Verificado em **28 de outubro de 2026** na documentação oficial do MyMemory. O app chama `https://api.mymemory.translated.net/get`, passando `q` (até 500 bytes) e `langpair`; não envia email, chave, histórico nem favoritos. A cota anônima documentada é de 5.000 caracteres por dia. A documentação descreve até 50.000 por dia quando um email válido é informado; o app não coleta nem envia email. O uso não é ilimitado e o provedor pode variar disponibilidade, cobertura, qualidade e correspondência regional do português. [Especificação da API](https://mymemory.translated.net/doc/spec.php) · [Limites de uso](https://mymemory.translated.net/doc/usagelimits.php) · [Termos do serviço](https://mymemory.translated.net/terms-and-conditions).

O texto original e o par de idiomas são enviados ao provedor por HTTPS para realizar a tradução. Revise a política e os termos do MyMemory antes de enviar conteúdo sensível. O app não registra texto em logs e não oferece tradução local de textos novos.

## Dados locais

SQLite contém histórico, cache, snapshots de favoritos, coleções, associações e preferências. Os favoritos são snapshots independentes; apagar o histórico não apaga frases favoritas. Apagar uma coleção remove apenas a organização e mantém os favoritos. O histórico mantém até 100 traduções recentes; o cache mantém até 500 pares.

Na primeira abertura após atualizar a versão que usava AsyncStorage, o histórico/cache legado é validado e copiado para SQLite em uma transação; as chaves antigas só são removidas após a migração concluída. A exportação cria JSON pelo menu de compartilhamento. A importação valida conteúdo e quantidade, mostra a prévia e requer confirmação para mesclar ou substituir.

## Voz e limitações

`expo-speech` usa as vozes instaladas no sistema; disponibilidade e pronúncia variam por plataforma e idioma. Em dispositivos iOS, o modo silencioso pode impedir o áudio. O app não solicita microfone, câmera, localização ou contatos. Não há login, modelo de tradução offline, sincronização, nem integração com Galaxy Fit3.

## Checklist de validação manual

Ainda não executado em dispositivo/emulador. Ao validar Android e iOS, conferir:

- [ ] Teclado e campo de texto em tela pequena, fontes ampliadas e áreas seguras.
- [ ] Tema claro/escuro/sistema e leitor de tela (TalkBack/VoiceOver).
- [ ] Tradução sem conexão, resposta inválida e limite do provider.
- [ ] Voz ausente, interrupção de fala e modo silencioso no iOS.
- [ ] Persistência após reinício, atualização/migração e consulta offline.
- [ ] Exportação, importação inválida, mesclagem/substituição e coleções.

Capturas Android/iOS serão adicionadas após a validação manual nesses dispositivos; o ambiente usado para esta implementação não forneceu emulador ou dispositivo para produzir screenshots reais.
