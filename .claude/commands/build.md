---
allowed-tools: Bash
description: Construye y empaqueta el ejecutable de Azure Hours Calculator
argument-hint: Sin argumentos requeridos
---

# Build - Crear Ejecutable

Construye y empaqueta Azure Hours Calculator como aplicación distribuible para macOS (.app, .dmg).

## Estado actual del build:

!`ls -la build/ 2>/dev/null || echo "Directorio build/ no existe aún"`

## Espacio disponible en disco:

!`df -h . | tail -1 | awk '{print "Disponible: " $4}'`

## Comando a ejecutar

!`./package-scripts.sh build`

## Qué hace este comando:

- Construye la aplicación React optimizada para producción
- Empaqueta con Electron Builder
- Genera archivo .app para macOS
- Crea instalador .dmg (si está configurado)
- Optimiza el bundle para distribución
- El resultado se guarda en dist/
