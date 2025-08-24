---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
argument-hint: [mensaje opcional]
description: Crea un commit con los cambios actuales del proyecto Azure Hours Calculator
model: claude-3-5-sonnet-20241022
---

# Commit - Azure Hours Calculator

Crea un commit inteligente analizando los cambios actuales en el proyecto.

## Contexto del Repositorio

- **Estado actual**: !`git status --porcelain`
- **Cambios staged**: !`git diff --cached --stat`
- **Cambios unstaged**: !`git diff --stat`
- **Rama actual**: !`git branch --show-current`
- **Últimos commits**: !`git log --oneline -5`

## Tu Tarea

1. **Analizar todos los cambios** (staged y unstaged) en el contexto del proyecto Azure Hours Calculator
2. **Agregar archivos relevantes** al staging area si es necesario
3. **Crear un commit** con mensaje descriptivo que siga el patrón del proyecto:
   - Usar español para el mensaje principal
   - Incluir contexto específico del proyecto (React, Electron, TypeScript, etc.)
   - Seguir el estilo de los commits anteriores
4. **No incluir firma estándar**:

   ```
   🤖 Generated with [Claude Code](https://claude.ai/code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

## Mensaje Personalizado

Si se proporciona un argumento, úsalo como base para el mensaje: $ARGUMENTS

## Notas Importantes

- Solo hacer commit si hay cambios válidos
- NO hacer push automáticamente
- Verificar que no se incluyan archivos sensibles (.env, tokens, etc.)
- Respetar el .gitignore existente
