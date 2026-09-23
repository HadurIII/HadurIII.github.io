# Sugestões para o Folgapp

1. Explicar melhor “dias perdidos” e “dias ganhos”
   - Usar tooltip ou texto pequeno discreto, porque são métricas úteis mas não óbvias de primeira.

2. Adicionar “copiar sugestão”
   - Um botão para copiar algo como: `Sugestão: férias de 22/12/2026 a 03/01/2027, descanso total de X dias.`
   - Útil para mandar no WhatsApp ou salvar.

3. Permitir salvar cenários
   - Exemplos: “meu trabalho”, “escala da minha esposa”, “com sábados”, “sem sábados”.
   - Pode ser feito apenas com `localStorage`.

4. Adicionar opção de considerar férias em dias úteis apenas
   - Não como modo principal, mas como comparação secundária/explicativa.
   - Exemplo: “se você só gastar férias em dias trabalhados, a melhor opção seria...”.
   - Só vale fazer se ficar claro na UI, porque pode confundir.

5. Melhorar a experiência mobile
   - Revisar espaçamento, tamanho dos cards e legibilidade do bloco de dias.
   - O site provavelmente será bastante usado no celular.

6. Preparar SEO e compartilhamento
   - Adicionar `meta description`, título mais buscável, favicon e preview para WhatsApp/Discord.
   - Considerar nome público como “Folgapp”.

7. URL com parâmetros
   - Gerar links compartilháveis com os dados preenchidos.
   - Exemplo: `?dias=13&inicio=2026-10-01&fim=2027-12-31&folgas=0,6`.

Sugestão mais imediata: tooltip/ajuda curta nas métricas + botão de copiar sugestão. É pequeno, melhora muito a compreensão e não bagunça a proposta simples do site.
