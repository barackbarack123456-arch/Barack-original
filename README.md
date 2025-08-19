# Gestión PRO - App de Gestión de Producción

**Gestión PRO** es una aplicación web completa diseñada para la gestión integral de procesos de producción industrial. Permite administrar productos, subproductos, insumos, clientes, proveedores y otras entidades clave del negocio. Su funcionalidad central es la capacidad de construir y visualizar las complejas relaciones jerárquicas entre componentes a través de "árboles de producto" dinámicos.

La aplicación está construida con HTML, CSS y JavaScript puro, y utiliza **Firebase** como backend para la autenticación, base de datos en tiempo real (Cloud Firestore) y hosting.

## Flujo de Trabajo y Colaboración

Este proyecto sigue un flujo de trabajo colaborativo en el que el desarrollador principal dirige el proyecto y un asistente de IA se encarga de la implementación de código bajo instrucciones específicas. El proceso es el siguiente:

1.  **Requerimiento/Idea:** El desarrollador expone una necesidad, un bug o una nueva funcionalidad.
2.  **Análisis y Propuesta:** El asistente de IA analiza el código, propone una o varias soluciones detalladas, explicando el impacto y la complejidad.
3.  **Decisión:** El desarrollador, como director del proyecto, decide qué solución implementar.
4.  **Implementación:** Siguiendo las instrucciones del desarrollador, el asistente de IA modifica los archivos de código que le son asignados (como `README.md` o `firestore.rules`). El desarrollador se encarga de las modificaciones en `index.html` y `main.js`.
5.  **Validación y Deploy:** El desarrollador revisa y valida todos los cambios antes de realizar el deploy.

Este método asegura que el control creativo y técnico permanezca con el desarrollador, mientras se aprovecha la velocidad y capacidad de análisis del asistente para tareas específicas.

## Mejoras Clave Implementadas

El proyecto ha evolucionado desde un prototipo hasta convertirse en una aplicación robusta y escalable, con un enfoque en la integridad de los datos, la experiencia de usuario y una arquitectura de software sólida.

### 1. Arquitectura y Backend
- **Refactorización Inicial:** Se migró de un código monolítico a una estructura clara con archivos `index.html`, `style.css` y `main.js`.
- **Integración con Firebase:** Se implementó un backend completo con Firebase Hosting, Authentication y Cloud Firestore.
- **Seguridad:** Se establecieron reglas en Firestore para que solo los usuarios autenticados puedan acceder y modificar los datos.

### 2. Gestión de Datos y Robustez del Sistema
- **Modelo de Datos Centralizado:** La aplicación utiliza un estado global (`appState`) que se mantiene sincronizado en tiempo real con Firestore, proporcionando una única fuente de verdad.
- **Datos Siempre Actualizados (Single Source of Truth):** Se eliminó la duplicación de datos en los árboles de producto. Ahora, los nodos del árbol solo almacenan un ID de referencia (`refId`), y toda la información se obtiene en tiempo real desde los mapas de datos.
- **Transacciones y Bloqueo Pesimista:** Se utilizan transacciones de Firestore para operaciones críticas y un sistema de bloqueo de documentos para prevenir que dos usuarios editen el mismo ítem simultáneamente.

### 3. Funcionalidad y Experiencia de Usuario (UX)
- **Gestión Completa de Entidades (CRUD):** Se implementó la funcionalidad completa para crear, leer, actualizar y eliminar todas las entidades del sistema.
- **Selectores de Búsqueda Inteligentes:** Se reemplazaron los campos de texto libre por modales de búsqueda controlados, eliminando errores de tipeo y estandarizando la entrada de datos.
- **Gestión Avanzada de Árboles de Producto:** Interfaz con Drag and Drop para construir y modificar las estructuras jerárquicas de los productos.
- **Vista Sinóptica Mejorada:** Una vista interactiva para explorar la estructura completa de todos los productos, con edición de cantidades en contexto y diferenciación visual de componentes.
- **Exportación de BOM a PDF Profesional:** Se ha implementado una función de exportación que genera un listado de materiales (BOM) en formato PDF tabular. El reporte se presenta en formato horizontal e incluye columnas detalladas para Nivel, Descripción, Código, Cantidad y Unidad de Medida.
- **Próximamente: Flujograma de Procesos:** Se está implementando una nueva vista dedicada que leerá la información de los árboles de producto para generar automáticamente un flujograma visual del proceso de fabricación completo.
