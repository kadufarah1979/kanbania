QA review. Siga as regras do CODEX.md.

REGRAS:
- Avaliar diff da branch task/{TASK_ID} contra main
- Verificar criterios de aceite do card
- Se GATES falharam, reprovar automaticamente
- Aprovar: mover card para done, commit kanban
- Reprovar: mover card para in-progress com pendencias detalhadas (arquivo:linha), commit kanban
- NAO rode testes — os GATES ja foram executados
