---
allowed-tools: Bash
description: Inicia modo desarrollo web del Azure Hours Calculator
argument-hint: Sin argumentos requeridos
---

# Dev - Modo Desarrollo Web

Inicia el servidor de desarrollo web para Azure Hours Calculator. Ideal para desarrollo y testing de la interfaz en el navegador.

## Estado actual del proyecto:
!`git status --porcelain`

## Comando a ejecutar
!`./package-scripts.sh dev`

## Qué hace este comando:
- Inicia el servidor React en modo desarrollo
- Abre automáticamente el navegador en http://localhost:3000
- Habilita hot-reloading para cambios en tiempo real
- Permite debugging de la interfaz web