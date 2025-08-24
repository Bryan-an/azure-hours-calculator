---
allowed-tools: Bash
description: Inicia aplicación de escritorio Electron
argument-hint: Sin argumentos requeridos
---

# Electron - Aplicación de Escritorio

Inicia Azure Hours Calculator como aplicación nativa de escritorio usando Electron con ventana frameless personalizada para macOS.

## Estado actual del proyecto:

!`git status --porcelain`

## Verificar proceso principal de Electron:

!`head -20 public/electron.js | grep -E "(frame|titleBar)"`

## Comando a ejecutar

!`./package-scripts.sh electron`

## Qué hace este comando:

- Compila la aplicación React
- Inicia Electron con la ventana frameless configurada
- Habilita titleBarOverlay nativo de macOS
- Carga la aplicación en ventana de escritorio personalizada
- Permite testing de funcionalidades específicas de Electron
