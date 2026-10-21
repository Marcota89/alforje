# Alforje

Jogo de mochila e fusão no navegador: organize itens numa grade, funda iguais até o nível Lendário e vença lutas automáticas em 10 paradas.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` | Página do jogo, gerada por `tools/build.cjs` a partir de `tools/head.html` |
| `js/data.js` | Tabelas: itens, classes, paradas, inimigos, bênçãos e textos |
| `js/sim.js` | Mochila, inimigos e simulação de combate determinística (roda também no servidor) |
| `js/cloud.js` | Conta de convidado e chamadas ao Supabase |
| `js/main.js` | Interface, loja, animação e menus |
| `js/config.js` | Endereço e chave pública (anon) do projeto Supabase |
| `supabase/migrations/` | Tabelas e regras de acesso |
| `supabase/functions/alforje-submit/` | Função que refaz as lutas antes de gravar placar e fantasmas |
| `test/test-sim.cjs` | Testes da simulação e da validação |

## Comandos

```bash
node tools/build.cjs
```

```bash
node test/test-sim.cjs
```

A função do servidor usa cópias de `js/data.js` e `js/sim.js`: ao mudar esses arquivos, publique a função de novo para o placar continuar conferindo as lutas do mesmo jeito que o jogo.
