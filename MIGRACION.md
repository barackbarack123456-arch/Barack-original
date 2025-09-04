# Plan de Migración a Nueva Cuenta de Firebase

Este documento describe los pasos para migrar este proyecto a una nueva cuenta de Google y un nuevo proyecto de Firebase.

Este plan asume que **no es necesario migrar los datos existentes** (usuarios, documentos de Firestore, etc.) y que se puede comenzar con una instalación limpia en el nuevo proyecto.

---

## Fase 1: Tareas del Propietario del Proyecto (Usuario)

Estas son las tareas que debes realizar tú antes de que yo pueda continuar con la parte técnica.

1.  **Crear Nueva Cuenta de Google:**
    *   Crea la nueva cuenta de Google que será la propietaria del nuevo proyecto.

2.  **Crear Nuevo Proyecto de Firebase:**
    *   Inicia sesión en la [consola de Firebase](https://console.firebase.google.com/) con tu **nueva** cuenta de Google.
    *   Crea un proyecto de Firebase completamente nuevo. Este proyecto tendrá un nuevo ID de proyecto.

3.  **Activar el Plan de Facturación "Blaze":**
    *   Dentro de la configuración de tu nuevo proyecto de Firebase, busca la opción para cambiar el plan de precios.
    *   Actualiza el proyecto del plan gratuito "Spark" al plan de pago por uso "Blaze".
    *   **Motivo:** Esto es obligatorio para que las Cloud Functions puedan realizar llamadas a servicios externos como la API de Telegram.

---

## Fase 2: Tareas de Reconfiguración y Despliegue (Jules)

Una vez que hayas completado la Fase 1, avísame y yo me encargaré de los siguientes pasos.

1.  **Conectar el Código al Nuevo Proyecto:**
    *   Tomaré el código existente.
    *   Usaré los comandos de Firebase CLI (`firebase use --add`) para desvincularlo del proyecto antiguo y conectarlo a tu nuevo proyecto de Firebase.

2.  **Desplegar Todos los Recursos:**
    *   Ejecutaré el comando `firebase deploy` para desplegar todos los recursos del proyecto en tu nueva cuenta:
        *   Cloud Functions
        *   Reglas de seguridad de Firestore
        *   Índices de Firestore
        *   Archivos de Hosting

3.  **Ejecutar el Seed (si es necesario):**
    *   Si me proporcionas las instrucciones, ejecutaré el script de "seed" para crear el usuario o los datos iniciales que necesites.

4.  **Resolución de Problemas:**
    *   Cualquier problema que surja durante este proceso de despliegue, lo investigaré y resolveré.

---

**Una vez que la Fase 1 esté lista, solo tienes que avisarme para comenzar con la Fase 2.**
