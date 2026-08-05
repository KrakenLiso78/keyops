# Instrucciones para Codex — KeyOps

## Git

- Al finalizar una tarea que modifique archivos, revisa `git status --short` y el diff.
- Haz un commit con los cambios relacionados exclusivamente con la tarea actual.
- Usa mensajes de commit claros siguiendo Conventional Commits, por ejemplo: `docs: update KeyOps design assets`.
- Si hay cambios ajenos o el alcance no está claro, no los incluyas y pide confirmación.
- No ejecutes `git push`, no crees pull requests ni modifiques la rama remota salvo que el usuario lo solicite explícitamente.
- No uses `git add -A` ni incluyas archivos no relacionados sin confirmación.
