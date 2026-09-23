# Folgapp - Otimizador de Folgas

Folgapp e um site 100% frontend para sugerir o melhor periodo de ferias/folga considerando feriados nacionais brasileiros, dias semanais que ja sao folga e datas extras informadas manualmente pelo usuario.

O projeto foi criado para ser simples de hospedar como site estatico. Nao usa React, Vite, npm, backend, banco de dados ou dependencias externas.

## Objetivo do Produto

O usuario informa:

- quantidade de dias de ferias/folga disponiveis;
- data minima de inicio;
- data maxima final;
- quais dias da semana ja sao folga, com domingo marcado por padrao;
- datas extras manuais que devem contar como feriado/folga.

O app testa todas as datas possiveis dentro da janela e escolhe a sugestao que gera o maior bloco consecutivo de descanso. O criterio principal e sempre maximizar o descanso total, mesmo que a melhor data de inicio caia em um dia que ja seria folga.

## Regras de Feriados

Por padrao, o app considera apenas feriados nacionais brasileiros garantidos:

- Confraternizacao Universal
- Paixao de Cristo, calculada pela data da Pascoa
- Tiradentes
- Dia do Trabalho
- Independencia do Brasil
- Nossa Senhora Aparecida
- Finados
- Proclamacao da Republica
- Dia Nacional de Zumbi e da Consciencia Negra
- Natal

Pontos facultativos como Carnaval e Corpus Christi nao entram por padrao. Para esses casos, o usuario deve adicionar a data manualmente em "Datas extras".

## Estrutura

```text
index.html                         Tela principal do app
styles.css                         Estilos da UI
src/app.js                         Logica de interface e renderizacao
src/holidayOptimizer.js            Logica pura do otimizador e feriados
tests/holidayOptimizer.test.js     Testes da logica principal
scripts/build-mobile.ps1           Gera mobile.html autocontido
tests/build-mobile.test.ps1        Testa o empacotamento mobile
.gitignore                         Ignora backups *.rar
```

## Como Rodar Localmente

Como e um site estatico, basta abrir `index.html` no navegador.

Nao ha `npm install` nem servidor obrigatorio.

## Como Testar

Verificar sintaxe dos scripts:

```powershell
node --check src\app.js
node --check src\holidayOptimizer.js
```

Rodar testes da logica:

```powershell
node tests\holidayOptimizer.test.js
```

Rodar teste do empacotador mobile:

```powershell
powershell -ExecutionPolicy Bypass -File .\tests\build-mobile.test.ps1
```

## Gerar mobile.html

Para gerar uma versao em arquivo unico, pensada para abrir facilmente no celular:

```powershell
.\scripts\build-mobile.ps1
```

Esse comando gera `mobile.html` na raiz do projeto.

O arquivo `mobile.html` e gerado pelo script, mas esta versionado para facilitar hospedagem/compartilhamento como arquivo unico. Nao edite `mobile.html` diretamente; quando `index.html`, `styles.css`, `src/app.js` ou `src/holidayOptimizer.js` mudarem, rode o script novamente e commite o arquivo gerado.

O script embute:

- CSS local referenciado por `<link rel="stylesheet" ...>`;
- JavaScript local referenciado por `<script src="...">`;
- imagens locais em `src="..."` de `img` e `source`;
- arquivos locais em `url(...)` dentro do CSS.

URLs remotas, `data:`, `mailto:`, `tel:` e ancoras sao preservadas.

## Hospedagem

O projeto pode ser hospedado como site estatico. Exemplos adequados:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- qualquer servidor que sirva arquivos estaticos

Para hospedagem web normal, publique os arquivos fonte (`index.html`, `styles.css`, `src/...`). Para compartilhar um arquivo unico manualmente, gere e use `mobile.html`.

## Estado do Git e Arquivos Gerados

O repositorio local ja foi inicializado com Git.

Arquivos ignorados importantes:

```gitignore
*.rar
```

`folgapp-bkp-0.rar` e backup local e nao deve entrar no Git.

## Observacoes Para Outras IAs

- Preserve a simplicidade do projeto: HTML, CSS e JavaScript puro.
- Evite adicionar npm/build tool sem necessidade explicita do usuario.
- A fonte de verdade da regra de calculo deve continuar em `src/holidayOptimizer.js`.
- Ao alterar regra de calculo, adicione ou ajuste testes em `tests/holidayOptimizer.test.js`.
- Ao alterar empacotamento mobile, ajuste `tests/build-mobile.test.ps1`.
- O resultado principal do produto nao e comparar cenarios; e apresentar a melhor opcao geral pelo maior bloco consecutivo de descanso.
- `mobile.html` e artefato gerado e versionado neste projeto. Nao edite diretamente; regenere com `scripts/build-mobile.ps1`.

