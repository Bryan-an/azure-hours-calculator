# 📚 Documentación TSDoc - Azure Hours Calculator

Esta guía explica cómo usar TSDoc para documentar el código en el proyecto Azure Hours Calculator.

## 🎯 **¿Qué es TSDoc?**

TSDoc es una especificación para escribir comentarios de documentación en TypeScript. Se integra perfectamente con el sistema de tipos de TypeScript y evita la duplicación de información.

## 🚀 **Scripts Disponibles**

```bash
# Generar documentación
npm run docs

# Generar documentación en modo watch (actualización automática)
npm run docs:serve

# Limpiar documentación generada
npm run docs:clean
```

## 📝 **Convenciones de Documentación**

### **Etiquetas TSDoc Principales**

#### **@param** - Documentar parámetros

```typescript
/**
 * @param startDate - Fecha de inicio de la tarea
 * @param estimatedHours - Horas estimadas de trabajo
 */
function calculateEndDate(startDate: Date, estimatedHours: number): Date;
```

#### **@returns** - Documentar valor de retorno

```typescript
/**
 * @returns Resultado del cálculo con fecha final y estadísticas
 */
function calculateEndDate(): CalculationResult;
```

#### **@example** - Proporcionar ejemplos de uso

````typescript
/**
 * @example
 * Uso básico:
 * ```typescript
 * const result = calculateEndDate(new Date(), 8);
 * console.log(result.endDate);
 * ```
 */
````

#### **@public/@private/@internal** - Visibilidad

```typescript
/**
 * Función pública disponible en la API
 * @public
 */
export function publicFunction() {}

/**
 * Función interna no documentada en la API pública
 * @internal
 */
function internalFunction() {}
```

#### **@deprecated** - Marcar funciones obsoletas

```typescript
/**
 * @deprecated Use {@link newFunction} instead
 */
function oldFunction() {}
```

#### **@see** - Referencias a documentación relacionada

```typescript
/**
 * @see {@link DateCalculationsUtil.calculateEndDate} for the main calculation method
 */
```

### **Documentación de Clases**

````typescript
/**
 * Utilidades para cálculos de fechas y tiempos laborales
 *
 * Esta clase proporciona funcionalidades para:
 * - Calcular fechas de finalización considerando horarios laborales
 * - Manejar exclusiones de festivos y reuniones
 * - Formatear fechas para visualización
 *
 * @example
 * ```typescript
 * const result = DateCalculationsUtil.calculateEndDate({
 *   startDate: new Date(),
 *   estimatedHours: 16,
 *   schedule: workSchedule
 * });
 * ```
 *
 * @public
 */
export class DateCalculationsUtil {
  /**
   * Convierte tiempo en formato "HH:mm" a minutos totales
   *
   * @param timeString - Tiempo en formato "HH:mm" (ej: "09:30")
   * @returns Número total de minutos desde medianoche
   *
   * @example
   * ```typescript
   * const minutes = DateCalculationsUtil.parseTimeToMinutes("09:30");
   * console.log(minutes); // 570
   * ```
   *
   * @public
   */
  static parseTimeToMinutes(timeString: string): number {
    // implementación...
  }
}
````

### **Documentación de Interfaces**

````typescript
/**
 * Configuración del horario laboral para cálculos de tiempo
 *
 * @example
 * ```typescript
 * const schedule: WorkSchedule = {
 *   startTime: '09:00',
 *   endTime: '18:00',
 *   lunchStart: '12:00',
 *   lunchEnd: '13:00',
 *   workDays: [1, 2, 3, 4, 5] // Monday to Friday
 * };
 * ```
 *
 * @public
 */
export interface WorkSchedule {
  /** Hora de inicio del día laboral en formato "HH:mm" */
  startTime: string;

  /** Hora de fin del día laboral en formato "HH:mm" */
  endTime: string;

  /** Hora de inicio del almuerzo en formato "HH:mm" */
  lunchStart: string;

  /** Hora de fin del almuerzo en formato "HH:mm" */
  lunchEnd: string;

  /** Días laborales (0=Domingo, 1=Lunes, ..., 6=Sábado) */
  workDays: number[];
}
````

### **Documentación de Hooks React**

````typescript
/**
 * Hook para manejar cálculos de tiempo de tareas
 *
 * Proporciona funcionalidad para calcular fechas de finalización
 * y manejar configuraciones de horario laboral.
 *
 * @param initialSchedule - Configuración inicial del horario
 * @returns Objeto con métodos y estado para cálculos de tiempo
 *
 * @example
 * ```typescript
 * function TaskComponent() {
 *   const { calculateTaskEnd, schedule, updateSchedule } = useTaskCalculation({
 *     startTime: '09:00',
 *     endTime: '18:00',
 *     workDays: [1, 2, 3, 4, 5]
 *   });
 *
 *   const handleCalculate = () => {
 *     const result = calculateTaskEnd(new Date(), 16);
 *     console.log(`Task ends: ${result.endDate}`);
 *   };
 *
 *   return <button onClick={handleCalculate}>Calculate</button>;
 * }
 * ```
 *
 * @public
 */
export function useTaskCalculation(initialSchedule: WorkSchedule) {
  // implementación...
}
````

## 🎨 **Ejemplos por Tipo de Función**

### **Funciones Utilitarias**

````typescript
/**
 * Formatea una fecha para visualización considerando la configuración regional
 *
 * @param date - Fecha a formatear
 * @returns Cadena formateada con fecha y hora
 *
 * @example
 * ```typescript
 * const formatted = formatDateForDisplay(new Date('2024-01-15T14:30:00'));
 * console.log(formatted); // "01/15/2024 2:30 PM" or "15/01/2024 14:30"
 * ```
 *
 * @public
 */
export function formatDateForDisplay(date: Date): string;
````

### **Funciones de APIs/Services**

````typescript
/**
 * Obtiene eventos del calendario de Google para un rango de fechas específico
 *
 * @param calendarId - ID del calendario de Google
 * @param startDate - Fecha de inicio del rango
 * @param endDate - Fecha de fin del rango
 * @param accessToken - Token de acceso válido de Google OAuth
 *
 * @returns Promise con la lista de eventos del calendario
 *
 * @throws {@link GoogleCalendarError} Cuando hay errores de autenticación o API
 *
 * @example
 * ```typescript
 * try {
 *   const events = await getCalendarEvents(
 *     'primary',
 *     new Date('2024-01-01'),
 *     new Date('2024-01-31'),
 *     accessToken
 *   );
 *   console.log(`Found ${events.length} events`);
 * } catch (error) {
 *   console.error('Failed to fetch events:', error);
 * }
 * ```
 *
 * @public
 */
export async function getCalendarEvents(
  calendarId: string,
  startDate: Date,
  endDate: Date,
  accessToken: string
): Promise<Meeting[]>;
````

## 🛠️ **Herramientas y Validación**

### **ESLint TSDoc Plugin**

El proyecto está configurado con `eslint-plugin-tsdoc` que valida la sintaxis de los comentarios TSDoc:

```typescript
// ❌ Esto generará un warning de ESLint
/**
 * @param invalidParam - Este parámetro no existe en la función
 */
function myFunction(realParam: string): void {}

// ✅ Esto es correcto
/**
 * @param realParam - Este parámetro sí existe
 */
function myFunction(realParam: string): void {}
```

### **TypeDoc Configuration**

La configuración en `typedoc.json` está optimizada para el proyecto:

```json
{
  "entryPoints": [
    "src/utils/dateCalculations.ts",
    "src/utils/electronUtils.ts",
    "src/services/googleCalendarService.ts"
  ],
  "out": "docs",
  "excludePrivate": true,
  "excludeInternal": true
}
```

## 📋 **Checklist para Documentar**

### **Funciones/Métodos**

- [ ] Descripción clara del propósito
- [ ] Documentar todos los parámetros con `@param`
- [ ] Documentar el valor de retorno con `@returns`
- [ ] Incluir al menos un ejemplo con `@example`
- [ ] Marcar visibilidad con `@public`/`@internal`
- [ ] Documentar errores posibles con `@throws`

### **Clases**

- [ ] Descripción general de la clase
- [ ] Listar funcionalidades principales
- [ ] Ejemplo de uso completo
- [ ] Documentar constructor si es complejo

### **Interfaces/Types**

- [ ] Descripción del propósito del tipo
- [ ] Documentar propiedades importantes
- [ ] Ejemplo de uso del tipo
- [ ] Explicar relaciones con otros tipos

## 🎯 **Mejores Prácticas**

### **✅ Hacer**

1. **Ser específico y claro**

   ```typescript
   /**
    * Calcula la fecha de finalización considerando horarios laborales y exclusiones
    * @param startDate - Fecha y hora exacta de inicio del trabajo
    */
   ```

2. **Proporcionar ejemplos útiles**

   ````typescript
   /**
    * @example
    * Para un proyecto de 2 semanas:
    * ```typescript
    * const result = calculateEndDate({
    *   startDate: new Date('2024-01-15T09:00:00'),
    *   estimatedHours: 80,
    *   schedule: standardWorkWeek
    * });
    * ```
    */
   ````

3. **Documentar casos edge**
   ```typescript
   /**
    * @param workDays - Días laborales (0=Domingo, 6=Sábado). Array vacío resultará en error
    */
   ```

### **❌ Evitar**

1. **Documentación redundante**

   ```typescript
   // ❌ Redundante con el tipo
   /**
    * @param date - Una fecha de tipo Date
    */
   function format(date: Date): string;

   // ✅ Mejor
   /**
    * @param date - Fecha a formatear para visualización
    */
   function format(date: Date): string;
   ```

2. **Ejemplos no funcionales**

   ````typescript
   // ❌ Ejemplo incompleto
   /**
    * @example
    * ```typescript
    * calculateEndDate(date, hours)
    * ```
    */

   // ✅ Ejemplo completo y ejecutable
   /**
    * @example
    * ```typescript
    * const result = calculateEndDate({
    *   startDate: new Date('2024-01-15T09:00:00'),
    *   estimatedHours: 8,
    *   schedule: mySchedule
    * });
    * console.log(result.endDate);
    * ```
    */
   ````

## 🚀 **Generación de Documentación**

1. **Generar documentación estática:**

   ```bash
   npm run docs
   ```

2. **Ver la documentación:**
   Abrir `docs/index.html` en el navegador

3. **Desarrollo con auto-reload:**
   ```bash
   npm run docs:serve
   ```

## 📊 **Estado Actual del Proyecto**

### **Archivos Documentados**

- ✅ `src/utils/dateCalculations.ts` (parcialmente)
- 🔄 `src/utils/electronUtils.ts` (pendiente)
- 🔄 `src/services/googleCalendarService.ts` (pendiente)

### **Próximos Pasos**

1. Documentar todas las funciones públicas en `dateCalculations.ts`
2. Agregar documentación a `electronUtils.ts`
3. Documentar hooks principales
4. Documentar interfaces en `types/index.ts`

## 🔗 **Enlaces Útiles**

- [TSDoc Specification](https://tsdoc.org/)
- [TypeDoc Documentation](https://typedoc.org/guides/overview/)
- [TSDoc Playground](https://www.typescriptlang.org/play) (para probar sintaxis)

---

**Nota:** Esta documentación se actualiza conforme se añaden nuevas funcionalidades al proyecto.
