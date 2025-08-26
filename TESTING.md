# 🧪 Testing Guide

Esta guía explica cómo utilizar las herramientas de testing configuradas en el proyecto Azure Hours Calculator.

## 📦 Herramientas Configuradas

- **Vitest**: Framework de testing rápido y moderno
- **React Testing Library**: Para testing de componentes React
- **MSW (Mock Service Worker)**: Para mocking de APIs
- **@testing-library/user-event**: Para simular interacciones de usuario
- **jsdom**: Entorno de navegador simulado

## 🚀 Scripts Disponibles

```bash
# Ejecutar tests en modo watch (recomendado para desarrollo)
npm run test:vitest

# Ejecutar tests una vez
npm run test:vitest:run

# Ejecutar tests con interfaz gráfica
npm run test:vitest:ui

# Ejecutar tests con reporte de cobertura
npm run test:coverage
```

## 📁 Estructura de Pruebas

```
src/
├── __tests__/          # Configuración global de tests
│   ├── setup.ts        # Setup global
│   └── server.ts       # Configuración MSW
├── utils/
│   └── __tests__/      # Pruebas para utilities
│       └── *.test.ts
├── services/
│   └── __tests__/      # Pruebas para services
│       └── *.test.ts
├── hooks/
│   └── __tests__/      # Pruebas para hooks
│       └── *.test.ts
└── components/
    └── __tests__/      # Pruebas para components
        └── *.test.tsx
```

## ✍️ Escribiendo Pruebas

### Utilities (Funciones Puras)

```typescript
// src/utils/__tests__/example.test.ts
import { describe, it, expect } from 'vitest';
import { myUtilFunction } from '../myUtil';

describe('myUtilFunction', () => {
  it('should return expected result', () => {
    expect(myUtilFunction('input')).toBe('expected');
  });
});
```

### Hooks

```typescript
// src/hooks/__tests__/example.test.ts
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe('initial');
  });
});
```

### Componentes

```typescript
// src/components/__tests__/example.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## 🎭 Mocking con MSW

Los handlers de MSW están configurados en `src/__tests__/server.ts`. Para agregar nuevos mocks:

```typescript
// En server.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Agregar nuevo handler
  http.get('/api/new-endpoint', () => {
    return HttpResponse.json({ data: 'mock response' });
  }),
];
```

## 📊 Cobertura de Código

El objetivo de cobertura por tipo de archivo:

- **Utilities**: 80%+ (funciones puras, fáciles de testear)
- **Services**: 80%+ (lógica de negocio crítica)
- **Hooks**: 70%+ (lógica reutilizable)
- **Components**: 60%+ (más complejos por UI)

### Ver Reporte de Cobertura

```bash
# Generar reporte de cobertura
npm run test:coverage

# El reporte HTML se genera en coverage/index.html
open coverage/index.html
```

## 🔧 Configuración

### vitest.config.ts

Configuración principal de Vitest con:

- Entorno jsdom para simular navegador
- Setup files para configuración global
- Alias para imports más limpios
- Exclusiones de cobertura

### src/**tests**/setup.ts

Configuración global que incluye:

- Extensiones de Jest DOM
- Mocks para APIs del navegador (matchMedia, ResizeObserver)
- Mocks para localStorage/sessionStorage
- Configuración de MSW

## 🎯 Estrategia de Testing

### Fase 1: Fundamentos

1. ✅ Setup del entorno de testing
2. ✅ Pruebas para `dateCalculations.ts`
3. 🔄 Pruebas para otros utilities
4. 🔄 Pruebas básicas para services

### Fase 2: Core Logic

1. 🔄 Tests para `holidayService.ts`
2. 🔄 Tests para stores principales
3. 🔄 Setup CI/CD para tests

### Fase 3: Business Logic

1. 🔄 Tests para hooks críticos
2. 🔄 Tests para componentes principales
3. 🔄 Performance testing

### Fase 4: Integration & Polish

1. 🔄 Integration tests
2. 🔄 E2E tests básicos
3. 🔄 Coverage completo

## 📚 Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## ⚡ Tips de Desarrollo

1. **Usa el modo watch**: `npm run test:vitest` para feedback inmediato
2. **Escribe tests pequeños**: Una funcionalidad por test
3. **Usa describe blocks**: Para organizar tests relacionados
4. **Mock external dependencies**: Mantén tests aislados
5. **Test edge cases**: No solo happy paths
6. **Keep tests DRY**: Usa setup functions para código repetido
