# Gestión PRO - App de Gestión de Producción

**Gestión PRO** es una aplicación web completa diseñada para la gestión integral de procesos de producción industrial. Permite administrar productos, semiterminados, insumos, clientes, proveedores y otras entidades clave del negocio. Su funcionalidad central es la capacidad de construir y visualizar las complejas relaciones jerárquicas entre componentes a través de "árboles de producto" dinámicos.

La aplicación está construida con HTML, CSS y JavaScript puro, y utiliza **Firebase** como backend para la autenticación, base de datos en tiempo real (Cloud Firestore) y hosting.

## Flujo de Trabajo y Colaboración

Este proyecto sigue un flujo de trabajo colaborativo en el que el desarrollador principal dirige el proyecto y un asistente de IA se encarga de la implementación de código bajo instrucciones específicas. El proceso es el siguiente:

1.  **Requerimiento/Idea:** El desarrollador expone una necesidad, un bug o una nueva funcionalidad.
2.  **Análisis y Propuesta:** El asistente de IA analiza el código, propone una o varias soluciones detalladas, explicando el impacto y la complejidad.
3.  **Decisión:** El desarrollador, como director del proyecto, decide qué solución implementar.
4.  **Implementación:** Siguiendo las directrices del desarrollador, el asistente de IA se encarga de la implementación técnica, modificando todos los archivos necesarios del proyecto (`index.html`, `main.js`, `style.css`, etc.) para llevar a cabo la tarea.
5.  **Validación y Deploy:** El desarrollador revisa y valida todos los cambios antes de realizar el deploy.

Este método asegura que la dirección estratégica y la visión del producto permanezcan con el desarrollador, mientras que el asistente de IA se enfoca en la implementación y ejecución técnica para acelerar el desarrollo.

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

## Panel de Administración del Dashboard

El dashboard incluye un panel de administración con herramientas potentes para gestionar el estado de la base de datos. Estas acciones son delicadas y deben usarse con precaución.

-   **Limpiar y Cargar Datos:** Esta es la acción de reinicio principal. Borra todas las colecciones de datos (productos, insumos, etc.) **excepto los usuarios** y luego carga el conjunto de datos de demostración. Es ideal para restaurar el entorno a un estado conocido.
-   **Borrar Solo Datos:** Una opción más segura que la anterior. Borra todas las colecciones de datos pero **deja intacta la colección de usuarios**. Útil para limpiar el entorno de trabajo sin afectar las cuentas existentes.
-   **Borrar Otros Usuarios:** Esta es una acción delicada. Elimina **únicamente** los documentos de la colección `usuarios`, preservando siempre al usuario administrador principal.

### Usuario Administrador Principal

Para facilitar las pruebas y la gestión, existe un usuario "Dios" con privilegios de administrador.

-   **Email:** `god@barackmercosul.com`
-   **Contraseña:** `123456`

## Entorno de Desarrollo y CLI

Esta sección contiene información técnica para desarrolladores sobre cómo interactuar con el backend de Firebase a través de la línea de comandos (CLI).

### Información del Proyecto

- **ID del Proyecto de Firebase:** `barack2-0-f81a6`

### Uso de Firebase CLI en Entornos No Interactivos

Para ejecutar comandos de Firebase CLI en un entorno no interactivo (como un servidor de integración continua o un entorno de desarrollo remoto como este), es necesario autenticarse usando una **cuenta de servicio (service account)**.

#### Pasos para la autenticación:

1.  **Generar una clave de cuenta de servicio:**
    *   Ve a la [consola de Google Cloud para las cuentas de servicio de tu proyecto](https://console.cloud.google.com/iam-admin/serviceaccounts?project=barack2-0-f81a6).
    *   Crea una nueva cuenta de servicio o usa una existente.
    *   Asegúrate de que la cuenta de servicio tenga los permisos necesarios. El rol de **"Editor" (Editor)** es una buena opción para tener permisos amplios.
    *   Genera una clave en formato **JSON** para la cuenta de servicio y descarga el archivo.

2.  **Configurar la variable de entorno:**
    *   Guarda el archivo JSON de la clave en un lugar seguro dentro del entorno.
    *   Establece la variable de entorno `GOOGLE_APPLICATION_CREDENTIALS` para que apunte a la ruta de tu archivo de clave JSON.
      ```bash
      export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/tu/serviceAccountKey.json"
      ```

Una vez configurada esta variable, Firebase CLI se autenticará automáticamente usando esta cuenta de servicio.

### Comandos Útiles

#### Borrar todas las colecciones de Firestore

Para borrar todas las colecciones y empezar desde cero, puedes usar el siguiente comando. **¡ADVERTENCIA! Esta acción es irreversible.**

```bash
# Primero, asegúrate de haber iniciado sesión o de haber configurado la cuenta de servicio
firebase firestore:delete --all-collections --force --project barack2-0-f81a6
```

#### Nota sobre la ejecución de Firebase CLI

En algunos entornos, el comando `firebase` puede no estar en el `PATH` del sistema, incluso después de instalar `firebase-tools` globalmente. Si esto ocurre, es necesario encontrar la ruta completa al ejecutable y usar `node` para invocarlo.

**Ejemplo de cómo encontrar y ejecutar el comando:**
1.  **Instalar `firebase-tools`:**
    ```bash
    npm install -g firebase-tools
    ```
2.  **Encontrar el directorio raíz de npm:**
    ```bash
    npm root -g
    ```
3.  **Construir y ejecutar la ruta completa:**
    ```bash
    # Ejemplo de ruta, puede variar en tu sistema
    node <npm_root_g_output>/firebase-tools/lib/bin/firebase.js <comando>
    ```

## A Note on AGENTS.md

You may notice a file named `AGENTS.md` in this repository. This file is specifically for providing instructions and guidelines to AI assistants (like Jules) who collaborate on this project. It contains technical conventions and lessons learned to make AI collaboration more efficient. For general project documentation, please continue to refer to this `README.md` file.
