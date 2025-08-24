#!/bin/bash

# Azure Hours Calculator - Scripts de Instalación y Ejecución
# Para macOS

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [[ ! -f "package.json" ]]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# Función para verificar Node.js
check_node() {
    print_status "Verificando Node.js..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado."
        print_status "Instalando Node.js con Homebrew..."
        
        if ! command -v brew &> /dev/null; then
            print_error "Homebrew no está instalado. Por favor instala Node.js manualmente desde https://nodejs.org/"
            exit 1
        fi
        
        brew install node
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js instalado: $NODE_VERSION"
    
    NPM_VERSION=$(npm --version)
    print_success "npm instalado: $NPM_VERSION"
}

# Función para instalar dependencias
install_dependencies() {
    print_status "Instalando dependencias del proyecto..."
    
    if npm install --legacy-peer-deps; then
        print_success "Dependencias instaladas correctamente"
    else
        print_error "Error al instalar dependencias"
        print_status "Intentando limpiar caché y reinstalar..."
        
        npm cache clean --force
        rm -rf node_modules
        npm install --legacy-peer-deps
        
        if [[ $? -eq 0 ]]; then
            print_success "Dependencias instaladas correctamente después de limpiar caché"
        else
            print_error "No se pudieron instalar las dependencias"
            exit 1
        fi
    fi
}

# Función para construir la aplicación
build_app() {
    print_status "Construyendo la aplicación..."
    
    if npm run build; then
        print_success "Aplicación construida exitosamente"
    else
        print_error "Error al construir la aplicación"
        exit 1
    fi
}

# Función para ejecutar en modo desarrollo
run_dev() {
    print_status "Iniciando aplicación en modo desarrollo..."
    print_warning "Presiona Ctrl+C para detener"
    npm start
}

# Función para ejecutar con Electron
run_electron() {
    print_status "Iniciando aplicación de escritorio..."
    print_warning "Presiona Ctrl+C para detener"
    npm run electron-dev
}

# Función para construir ejecutable
build_executable() {
    print_status "Construyendo aplicación ejecutable..."
    
    if npm run build-electron; then
        print_success "Aplicación ejecutable creada en la carpeta 'dist/'"
        
        if [[ -d "dist" ]]; then
            print_status "Archivos generados:"
            ls -la dist/
        fi
    else
        print_error "Error al crear la aplicación ejecutable"
        exit 1
    fi
}

# Función de configuración inicial
setup() {
    print_status "=== Configuración Inicial de Azure Hours Calculator ==="
    
    check_node
    install_dependencies
    build_app
    
    print_success "=== Configuración completada ==="
    print_status "Puedes ejecutar la aplicación con:"
    echo "  ./package-scripts.sh dev      # Modo desarrollo (navegador)"
    echo "  ./package-scripts.sh electron # Aplicación de escritorio"
    echo "  ./package-scripts.sh build    # Crear ejecutable"
}

# Función de ayuda
show_help() {
    echo "Azure Hours Calculator - Scripts de Gestión"
    echo ""
    echo "Uso: ./package-scripts.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  setup     - Configuración inicial completa"
    echo "  dev       - Ejecutar en modo desarrollo (navegador)"
    echo "  electron  - Ejecutar como aplicación de escritorio"
    echo "  build     - Crear aplicación ejecutable"
    echo "  install   - Solo instalar dependencias"
    echo "  test      - Probar que todo funciona correctamente"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./package-scripts.sh setup"
    echo "  ./package-scripts.sh dev"
    echo "  ./package-scripts.sh electron"
}

# Función de prueba
test_setup() {
    print_status "=== Probando configuración ==="
    
    check_node
    
    print_status "Verificando dependencias..."
    if [[ -d "node_modules" ]]; then
        print_success "Dependencias encontradas"
    else
        print_warning "Dependencias no encontradas. Ejecutando instalación..."
        install_dependencies
    fi
    
    print_status "Probando construcción..."
    if npm run build &> /dev/null; then
        print_success "La aplicación se construye correctamente"
    else
        print_error "Error en la construcción"
        exit 1
    fi
    
    print_success "=== Todas las pruebas pasaron ==="
}

# Hacer el script ejecutable cuando se corra por primera vez
if [[ ! -x "$0" ]]; then
    chmod +x "$0"
fi

# Procesamiento de argumentos
case "${1:-help}" in
    "setup")
        setup
        ;;
    "dev")
        run_dev
        ;;
    "electron")
        run_electron
        ;;
    "build")
        build_executable
        ;;
    "install")
        check_node
        install_dependencies
        ;;
    "test")
        test_setup
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Comando desconocido: $1"
        show_help
        exit 1
        ;;
esac