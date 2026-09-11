# Histórico de versões

Este arquivo é atualizado automaticamente por `./tekvosoft release`.

As versões seguem o formato `MAIOR.MENOR.CORREÇÃO`:

| Parte | Quando muda | Exemplo |
|---|---|---|
| **correção** | conserto de bug, sem mudança de comportamento | `1.2.3` → `1.2.4` |
| **menor** | recurso novo, compatível com o que já existia | `1.2.3` → `1.3.0` |
| **maior** | mudança que exige atenção ao atualizar | `1.2.3` → `2.0.0` |
## 1.0.0 — 2026-09-11

- Compila o frontend nativamente em vez de sob emulação
- Versão 1.0.0
- Documenta o versionamento e corrige a consulta de versões
- Adiciona versionamento com tags, releases e rollback
- Evita resumo duplicado ao instalar
- Resolve conflito de portas sozinho e documenta os instaladores
- Adiciona instaladores de um comando para produção e desenvolvimento
- Mantém artefatos de build fora da árvore de código e poupa builds do CI
- Reestrutura o projeto como repositório único e renomeia para Tekvosoft
- remove empty line
- feat(translations): add companies manager translations for multiple languages
- feat(messages): add support for interactive messages and payment link translations
- fix(nginx): update Content-Disposition handling for backend public files
- fix(errors): standardize internal error messages across backend and frontend
- fix(tokenAuth): improve authorization error handling and consistency
- fix(dependencies): update libzapitu-rf to version 1.0.0-alpha.26
- fix(QrcodeModal): update QR code handling based on session status
- fix(auth): clear userId from localStorage on 401 error response
- fix(frontend): use i18n locale for plan value formatting
- fix(backend): prevent cross-connection group contact leaks

