---
allowed-tools: Bash
description: Prueba la configuración del proyecto Azure Hours Calculator
argument-hint: Sin argumentos requeridos
---

# Test - Probar Configuración

Ejecuta pruebas de configuración y validación del entorno de desarrollo para Azure Hours Calculator.

## Información del sistema:

!`node --version && npm --version && echo "Electron: $(npx electron --version 2>/dev/null || echo 'No disponible')"`

## Verificar dependencias críticas:

!`npm list --depth=0 2>/dev/null | grep -E "(react|electron|typescript)" || echo "Verificando dependencias..."`

## Comando a ejecutar

!`./package-scripts.sh test`

## Qué hace este comando:

- Verifica instalación de Node.js y npm
- Valida dependencias críticas (React, Electron, TypeScript)
- Prueba compilación básica
- Verifica configuraciones de build
- Reporta estado del entorno de desarrollo
