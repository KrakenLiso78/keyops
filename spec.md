# KeyOps — Especificación de feature: Gestión autónoma de credenciales API

**Proyecto**: KeyOps  
**Rama**: `[001-gestion-credenciales-api]`  
**Creado**: 17 de julio de 2026  
**Estado**: Borrador actualizado para MVP web persistente\
**Entradas**: `Lean Canvas Full · Gestión autónoma de credenciales API · Escuadrón 04.docx` y `docs/product/historias-de-usuario-keyops.docx`

> **Especificación paraguas**: este documento conserva el alcance global y la trazabilidad histórica de las 14 historias originales. La planificación nueva se realiza por las features independientes del mapa `specs/README.md`. No debe utilizarse esta especificación paraguas para generar un nuevo plan o nuevas tareas.

## 1. Contexto y objetivo

La plataforma de notificaciones legales conecta instituciones que, a su vez, pueden tener muchas aplicaciones integradas. Cada aplicación necesita credenciales y un rol que delimita los servicios de la API que puede utilizar. Actualmente, la emisión, entrega y renovación de esas credenciales depende de un miembro del equipo técnico con acceso directo a los sistemas internos. Esto convierte una operación repetitiva en un cuello de botella, especialmente para las instituciones con más de 20 aplicaciones y varias renovaciones mensuales.

Esta feature define KeyOps, un BackOffice interno que permita a analistas autorizados consultar y gestionar el ciclo de vida ordinario de las credenciales de una aplicación, manteniendo el control, los permisos y la supervisión técnica necesarios. El piloto se orienta inicialmente a los analistas que atienden las tres instituciones de mayor volumen.

El resultado de negocio buscado es reducir el tiempo de ciclo de emisión o renovación: desde que una solicitud está completa hasta que la credencial queda disponible para la institución. El piloto también debe permitir comparar el coste operativo por credencial antes y después de usar KeyOps.

### 1.1 Usuarios y responsabilidades

| Usuario o parte interesada                   | Necesidad y responsabilidad                                                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Propietario de la plataforma                 | Patrocina la solución, asume el coste y valida que reduzca carga operativa y riesgo.                                                                              |
| Analista autorizado                          | Opera el flujo habitual: consulta, emisión, descarga, regeneración y acciones permitidas sobre credenciales. Actualmente no emite credenciales.                   |
| Analista senior                              | Puede realizar todas las acciones del analista y revocar credenciales.                                                                                            |
| Administrador de KeyOps                      | Pertenece al equipo técnico del propietario. Gestiona usuarios y permisos, resuelve excepciones y mantiene la supervisión; actualmente realiza la emisión manual. |
| Auditor                                      | Consulta la trazabilidad de las operaciones.                                                                                                                      |
| Responsable de integración de la institución | Recibe y utiliza credenciales válidas para integrar su aplicación. No se contempla como usuario directo de KeyOps en este MVP.                                    |

### 1.2 Alcance del MVP

El entregable del próximo Sprint es una aplicación web publicada, optimizada para su uso desde un navegador móvil. El MVP cubre el acceso de usuarios internos autorizados, la consulta de aplicaciones y credenciales del caso de estudio, la gestión controlada de las acciones esenciales del ciclo de vida en dos ambientes claramente diferenciados y el registro trazable de las operaciones relevantes.

El MVP utiliza un conjunto representativo y persistente de instituciones, aplicaciones y roles preparado para el caso de estudio. No depende de que los sistemas corporativos estén disponibles ni modifica datos reales de esos sistemas.

El candidato funcional del caso de estudio debe conservar y compartir los datos operativos no secretos entre cierres de la aplicación y nuevas sesiones autorizadas. Los datos aislados que se reinician al comenzar una demostración pueden utilizarse para pruebas, pero no constituyen evidencia de que una historia con cambios de estado esté superada.

### 1.3 Decisiones de alcance adoptadas

- La primera versión no gestiona fechas de caducidad, alertas ni renovaciones preventivas.
- Las instituciones, aplicaciones y roles proceden durante este Sprint de datos representativos persistentes. Su sincronización con el catálogo corporativo se difiere.
- Pruebas y producción se representan como ambientes de demostración separados. El usuario selecciona el ambiente activo y la misma matriz de permisos se aplica en ambos, pero ninguna acción afecta a sistemas reales.
- Una operación confirmada debe conservar su resultado al cerrar y volver a abrir la aplicación, iniciar una sesión nueva o consultar el mismo recurso desde otro usuario autorizado.
- El candidato de caso de estudio utiliza credenciales y materiales de entrega sintéticos. Este nivel permite validar el comportamiento y la persistencia, pero no acredita emisión de secretos reales, revocación efectiva en sistemas productivos ni conservación inmutable durante cinco años.
- La meta de esta iteración es validar 12 de las 14 historias existentes en el MVP web: todas las historias P1 y las historias US-09, US-10 y US-12. US-11 y US-14 quedan fuera del MVP y no deben aparecer como capacidades disponibles.

### 1.4 Definición de MVP web completamente funcional

El MVP se considera completamente funcional cuando cumple simultáneamente estas condiciones:

- Está publicado y puede utilizarse desde un navegador móvil sin instalar una aplicación nativa.
- Las 12 historias incluidas en el Sprint funcionan de extremo a extremo con datos persistentes y compartidos.
- Todas las acciones visibles producen el resultado descrito o un error controlado; no existen botones decorativos, pantallas sin recorrido funcional ni confirmaciones basadas únicamente en cambios locales de pantalla.
- Cerrar la aplicación o iniciar otra sesión no reinicia los datos confirmados.
- Las credenciales, entregas y ambientes de demostración se identifican claramente como sintéticos y no conceden acceso a servicios reales.
- La ejecución ordinaria no requiere una conexión operativa con sistemas corporativos ni software de pago.

Esta definición acredita un producto web funcional dentro de su alcance declarado. No acredita todavía preparación para un piloto con credenciales o datos productivos.

### 1.5 Fuera del alcance del MVP web del próximo Sprint

| Capacidad diferida | Comportamiento disponible en el MVP | Motivo y condición futura |
| ------------------ | ----------------------------------- | ------------------------- |
| Integración con los sistemas corporativos de instituciones, aplicaciones y roles | Datos representativos persistentes, suficientes para consultar y ejecutar los flujos incluidos | Evita depender de contratos y entornos externos. La integración se abordará antes de operar con datos reales. |
| Emisión, rotación, suspensión o revocación efectiva de credenciales en servicios reales | Ciclo de vida completo sobre credenciales sintéticas, con estados y versiones persistentes | Permite validar el flujo sin otorgar acceso real. La conexión con el servicio de credenciales será necesaria antes del piloto. |
| Autenticación corporativa y aprovisionamiento automático de usuarios | Usuarios internos predefinidos con perfiles y permisos verificables | Mantiene el control de acceso del MVP sin incorporar todavía identidad corporativa. |
| Entrega real de secretos mediante ZIP cifrado, contraseña separada y canales corporativos | Artefacto sintético descargable mediante un código de demostración de un solo uso | Valida el recorrido sin asumir protección criptográfica ni operación externa. La entrega real se exigirá antes del piloto. |
| Efectos sobre ambientes reales de pruebas o producción | Dos ambientes de demostración claramente etiquetados y aislados | Conserva la separación de contexto sin riesgo para sistemas reales. |
| Auditoría resistente a modificación por administradores y conservación garantizada durante cinco años | Historial funcional, persistente, de solo adición y restringido por perfil | La garantía de inmutabilidad y retención sigue siendo obligatoria para el piloto, pero no forma parte de la aceptación de este Sprint. |
| Consulta de consumo real de las aplicaciones (US-11) | La historia no aparece como capacidad disponible | Depende de una fuente externa de consumo y no es necesaria para demostrar el ciclo de vida de credenciales. |
| Gestión desde la interfaz de usuarios y perfiles (US-14) | Conjunto predefinido de usuarios y perfiles para validar permisos | Se difiere para evitar un módulo administrativo adicional durante el caso de estudio. |
| Aplicaciones nativas, publicación en tiendas, funcionamiento sin conexión y notificaciones | Aplicación web móvil que requiere conectividad | No son necesarias para validar el valor principal del MVP. |
| Fechas de caducidad, alertas y renovaciones preventivas | No se ofrecen en el MVP | Ya estaban excluidas de la primera versión y no son necesarias para el flujo ordinario seleccionado. |
| Medición completa del piloto de tres meses | Se conserva la definición de las métricas, pero no se exige evidencia longitudinal en este Sprint | Requiere uso real y un período de observación posterior a la publicación del MVP. |

## 2. Objetivos y no objetivos

### Objetivos

- Dar autonomía segura a los analistas para resolver operaciones habituales sin depender de la disponibilidad del equipo técnico.
- Mantener una relación visible entre institución, aplicación, ambiente, rol y credenciales.
- Reducir el tiempo de ciclo de emisión o renovación de credenciales en el piloto.
- Conservar evidencia suficiente de quién hizo cada operación, sobre qué aplicación y con qué resultado.
- Conservar el estado operativo confirmado entre sesiones y hacerlo visible de forma coherente a todos los usuarios autorizados.
- Aumentar la cobertura funcional demostrable sin rebajar los criterios de aceptación ni depender de software de pago adicional.
- Permitir al propietario medir adopción, satisfacción y ahorro operativo antes de ampliar el despliegue.

### No objetivos

- Construir un portal de autoservicio para responsables de integración externos.
- Definir la arquitectura, la integración técnica, el almacenamiento, los mecanismos criptográficos o la implementación de autenticación.
- Sustituir todos los controles y excepciones que actualmente gestiona el equipo técnico.
- Integrarse durante este Sprint con los sistemas corporativos de catálogo, identidad, credenciales, entrega o consumo.
- Operar sobre credenciales, instituciones, aplicaciones o ambientes reales.
- Publicar aplicaciones nativas o admitir operaciones sin conexión.
- Gestionar fechas de caducidad, alertas automáticas o renovaciones programadas.
- Crear, modificar o eliminar instituciones, aplicaciones o roles del catálogo externo.
- Incorporar analítica avanzada o monitorización en tiempo real del uso de la API.
- Definir precios, facturación o ingresos directos: el caso económico es de eficiencia interna.
- Considerar el candidato de caso de estudio como prueba de emisión de secretos reales, revocación productiva, auditoría resistente a administradores o retención efectiva durante cinco años.

## 3. Requisitos funcionales

Salvo que se identifiquen como **diferidos**, los requisitos de esta sección forman parte del MVP web. Los requisitos relativos a credenciales, entregas y ambientes se validan en el MVP con elementos sintéticos claramente identificados; sus efectos sobre sistemas reales corresponden al piloto posterior.

- **FR-001**: KeyOps DEBE permitir el acceso únicamente a usuarios internos autorizados y mostrarles solo las acciones permitidas por su perfil.
- **FR-002**: KeyOps DEBE rechazar los accesos de usuarios inexistentes, deshabilitados o no autorizados e informar del rechazo sin revelar información sensible.
- **FR-003**: El sistema DEBE ofrecer un inventario paginado de aplicaciones y sus credenciales, con institución, aplicación, ambiente, estado y fecha del último cambio.
- **FR-004**: El inventario DEBE ofrecer una búsqueda única, limitada al ambiente activo y a los datos autorizados, que encuentre coincidencias por institución, aplicación, identificador de aplicación, usuario registrado en el historial de la credencial, contacto técnico, solicitud o ticket, Client ID, rol de API, estado e IP declarada. La búsqueda DEBE ignorar diferencias entre mayúsculas, minúsculas y acentos, permitir filtrar por estado y ordenar los resultados, y NO DEBE incluir Client Secrets, OTP, contraseñas ni enlaces de entrega.
- **FR-005**: El sistema DEBE mostrar el detalle de una aplicación con su institución, ambiente, rol, contacto técnico, IP declaradas, datos de solicitud, historial de estados e información de credenciales.
- **FR-006**: El detalle DEBE identificar el Client ID cuando exista y NO DEBE mostrar el Client Secret.
- **FR-007**: Un analista autorizado DEBE poder generar, entregar y activar credenciales para una aplicación que no tenga credenciales activas en una misma operación, dejando el resultado trazado.
- **FR-008**: La entrega del MVP DEBE ofrecer un artefacto sintético descargable mediante un código de demostración de un solo uso válido durante dos minutos. El artefacto NO DEBE contener secretos reales. El ZIP cifrado, su contraseña separada y la entrega por canales corporativos quedan diferidos hasta el piloto.
- **FR-009**: Un analista autorizado DEBE poder regenerar credenciales activas; la nueva credencial queda activa y la versión anterior queda inmediatamente inactiva por rotación.
- **FR-010**: El sistema DEBE impedir que un fallo durante la generación o regeneración deje la aplicación en un estado incoherente; en una regeneración fallida, las credenciales vigentes deben conservarse.
- **FR-011**: Un analista autorizado DEBE poder suspender temporalmente una credencial activa y reactivarla cuando esté suspendida, registrando el motivo de cada acción.
- **FR-012**: Un usuario con el perfil autorizado para ello DEBE poder revocar de forma definitiva una credencial activa o suspendida, evitando su uso posterior.
- **FR-013**: Toda acción relevante de acceso, consulta sensible, emisión, descarga, regeneración, suspensión, reactivación, revocación o cambio de permisos DEBE generar un evento de auditoría con fecha y hora, usuario, operación, institución, aplicación, resultado e IP de origen.
- **FR-014**: El sistema DEBE permitir registrar y actualizar información operativa asociada a una gestión, incluyendo contacto técnico, motivo y número de solicitud o ticket.
- **FR-015**: El auditor, el administrador y el analista senior DEBEN poder consultar el historial de auditoría y filtrarlo por fechas, institución, aplicación y usuario.
- **FR-016**: Los analistas DEBEN poder solicitar una nueva entrega sintética de credenciales vigentes. Cada reenvío DEBE generar un artefacto nuevo y un código de demostración de un solo uso válido durante dos minutos, sin reutilizar el código anterior.
- **FR-017 [DIFERIDO]**: Cuando exista información de consumo real, el sistema DEBE mostrar mensajes enviados, servicios consumidos, IP utilizadas y fecha del último consumo de la aplicación.
- **FR-018**: El sistema DEBE ofrecer dos ambientes de demostración, pruebas y producción, mantenerlos claramente separados, identificarlos como no reales y mostrar solo la información y acciones del ambiente activo.
- **FR-019 [DIFERIDO]**: Un administrador DEBE poder gestionar los usuarios autorizados, sus perfiles y su estado de habilitación cuando esta capacidad se incorpore.
- **FR-020**: El sistema DEBE conservar los cambios confirmados sobre credenciales, versiones, estados, información de gestión, usuarios autorizados, permisos y eventos de auditoría cuando se cierre la aplicación o finalice la sesión.
- **FR-021**: El estado no secreto resultante de un cambio confirmado DEBE ser visible en una sesión posterior y para otro usuario autorizado con acceso al mismo recurso, sin depender del dispositivo o de la sesión que realizó la operación.
- **FR-022**: El sistema NO DEBE comunicar que una operación se completó hasta que su resultado haya quedado confirmado. Si no puede conservarlo, DEBE mantener el último estado confirmado, informar del fallo y permitir un nuevo intento.
- **FR-023**: Reintentar la misma solicitud después de una respuesta incierta NO DEBE crear una versión adicional de credencial, repetir una transición de estado ni duplicar otro efecto de negocio. Cada intento y su resultado DEBEN conservar trazabilidad.
- **FR-024**: Las consultas posteriores DEBEN reflejar el último estado confirmado y mantener separados los datos de pruebas y producción, incluso al cambiar de usuario o iniciar una sesión nueva.
- **FR-025**: El candidato funcional DEBE poder validar el comportamiento con credenciales y materiales de entrega sintéticos, identificando claramente que esa evidencia no acredita las garantías exigidas para un piloto con servicios reales.
- **FR-026**: La publicación y validación del MVP web persistente DEBE poder realizarse sin contratar licencias, suscripciones ni servicios de software de pago adicionales.
- **FR-027**: El MVP DEBE estar publicado como aplicación web utilizable desde un navegador móvil y permitir completar todos los flujos incluidos sin instalar una aplicación nativa.
- **FR-028**: Toda acción que aparezca disponible en el MVP DEBE ejecutar su comportamiento completo o devolver un error controlado. Las capacidades diferidas NO DEBEN presentarse como disponibles mediante botones, enlaces o pantallas sin funcionamiento.
- **FR-029**: El MVP DEBE incluir datos representativos persistentes de instituciones, aplicaciones, roles y usuarios suficientes para validar las 12 historias seleccionadas sin conectarse a sistemas corporativos.
- **FR-030**: El MVP DEBE identificar de forma visible que las credenciales, entregas y ambientes son de demostración y NO DEBE permitir confundirlos con datos o accesos reales.

## 4. Reglas de negocio y estados

### 4.1 Estados mínimos de una credencial

| Estado                | Significado                                                                                | Acciones esperadas                                                          |
| --------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Sin credenciales      | La aplicación no dispone de una credencial utilizable.                                     | Generar.                                                                    |
| Activa                | La credencial se ha emitido y dispone de una entrega. En el MVP representa una credencial sintética. | Solicitar una nueva entrega, regenerar, suspender o revocar según permisos. |
| Suspendida            | La credencial queda temporalmente inutilizable.                                            | Reactivar o revocar.                                                        |
| Inactiva por rotación | Versión anterior sustituida por una regeneración; deja de poder utilizarse inmediatamente. | Consulta histórica.                                                         |
| Revocada              | La credencial ha quedado definitivamente inutilizable.                                     | Consulta histórica; no descargar ni reactivar.                              |

La emisión, la generación de la entrega de demostración y la activación ocurren en una misma operación. En el MVP web, los estados describen el comportamiento de credenciales sintéticas y no conceden ni retiran acceso en servicios reales.

### 4.2 Reglas transversales

- Ninguna acción debe aplicarse a una aplicación inexistente o fuera del alcance del usuario.
- La regeneración no equivale a una segunda generación: exige que exista una credencial activa.
- No se puede suspender una credencial revocada ni revocar nuevamente una ya revocada.
- La suspensión, la reactivación y la revocación exigen que el usuario registre un motivo.
- Toda operación debe conservar su resultado, tanto si termina correctamente como si falla.
- El éxito solo se comunica cuando el cambio ha quedado confirmado; un fallo de conservación mantiene el último estado confirmado.
- Cerrar la aplicación, cerrar sesión o acceder desde otra sesión autorizada no reinicia los datos operativos confirmados.
- Repetir una solicitud tras una respuesta incierta no repite el efecto de negocio, aunque cada intento conserva su propia trazabilidad.
- Los usuarios autorizados para el mismo recurso deben observar el mismo estado confirmado dentro de su ambiente activo.
- La regeneración activa la nueva credencial e inactiva inmediatamente la versión anterior por rotación; no existe período de coexistencia.
- En el MVP, el usuario accede a un artefacto sintético con un código de demostración de un solo uso válido durante dos minutos. El ZIP cifrado, su contraseña separada y la entrega real por canales corporativos quedan diferidos.
- En el MVP, los eventos de auditoría se conservan de forma persistente, se añaden sin edición desde la aplicación y solo son consultables por auditor, administrador y analista senior.
- Antes de un piloto real, los eventos de auditoría deben ser resistentes a modificación por administradores y contar con conservación garantizada durante cinco años; estas garantías no forman parte de la aceptación del próximo Sprint.

### 4.3 Matriz de permisos

| Acción                              | Analista | Analista senior | Administrador | Auditor |
| ----------------------------------- | -------- | --------------- | ------------- | ------- |
| Consultar inventario y detalle      | Sí       | Sí              | Sí            | No      |
| Consultar uso (capacidad diferida)  | Sí       | Sí              | Sí            | No      |
| Generar, entregar y regenerar       | Sí       | Sí              | Sí            | No      |
| Suspender y reactivar               | Sí       | Sí              | Sí            | No      |
| Revocar                             | No       | Sí              | Sí            | No      |
| Registrar información de gestión    | Sí       | Sí              | Sí            | No      |
| Consultar auditoría                 | No       | Sí              | Sí            | Sí      |
| Gestionar usuarios y perfiles       | No       | No              | Sí            | No      |

La matriz anterior se aplica de igual forma en pruebas y en producción.

## 5. Historias de usuario, prioridad y pruebas

### Mapa de alcance por historia para el próximo Sprint

| Historias | Estado | Límite de validación del MVP web |
| --------- | ------ | -------------------------------- |
| US-01 | Incluida | Acceso con usuarios predefinidos y permisos efectivos; sin identidad corporativa. |
| US-02 y US-03 | Incluidas | Inventario y detalle sobre datos representativos persistentes; sin conexión con el catálogo corporativo. |
| US-04, US-05, US-06 y US-07 | Incluidas | Ciclo de vida completo sobre credenciales sintéticas; sin emisión, suspensión o revocación en servicios reales. |
| US-08 y US-12 | Incluidas | Registro y consulta de auditoría funcional persistente; sin acreditar inmutabilidad frente a administradores ni retención de cinco años. |
| US-09 | Incluida | Reentrega de un artefacto sintético con código de un solo uso; sin ZIP cifrado real ni canal corporativo. |
| US-10 | Incluida | Registro y actualización persistente del contexto de gestión. |
| US-13 | Incluida | Separación entre dos ambientes de demostración sin efectos externos. |
| US-11 | Fuera del MVP | No se muestra; requiere información de consumo de una fuente externa. |
| US-14 | Fuera del MVP | No se muestra; el Sprint utiliza usuarios y perfiles predefinidos. |

### Niveles de validación y criterio transversal

Una historia se considera **validada en el MVP web** cuando todos sus escenarios de aceptación se ejecutan en la aplicación publicada con datos compartidos y, si crea o modifica información, el resultado se comprueba después de cerrar la aplicación e iniciar una sesión nueva. Para esta validación se utilizan credenciales y materiales de entrega sintéticos, identificados de forma visible como demostración.

Una historia se considera **validada para piloto real** únicamente cuando, además de lo anterior, se han comprobado con los servicios reales las garantías que le correspondan: autorización efectiva, emisión o invalidación real de credenciales, OTP de un solo uso, entrega protegida y auditoría con las garantías de inmutabilidad y retención exigidas.

Los siguientes escenarios transversales se aplican a todas las historias que crean o modifican información:

```gherkin
Escenario: Conservación de un cambio confirmado entre sesiones
  Dado que un usuario autorizado completa una operación que modifica información
  Cuando cierra la aplicación e inicia una sesión nueva
  Entonces el sistema muestra el resultado confirmado de la operación
  Y otro usuario autorizado para el mismo recurso observa el mismo estado no secreto

Escenario: Fallo al conservar un cambio
  Dado que un usuario autorizado solicita una operación válida
  Cuando el sistema no puede conservar el resultado
  Entonces no comunica que la operación se completó
  Y mantiene el último estado confirmado
  Y registra el intento fallido en la auditoría

Escenario: Reintento después de una respuesta incierta
  Dado que un usuario no sabe si una solicitud anterior terminó correctamente
  Cuando repite la misma solicitud
  Entonces el sistema no duplica el efecto de negocio
  Y devuelve o muestra el único resultado confirmado
  Y conserva la trazabilidad de cada intento
```

La meta de esta iteración es validar en el MVP web las nueve historias P1 y las historias P2 US-09, US-10 y US-12: 12 de las 14 historias existentes. US-11 y US-14 quedan expresamente fuera del MVP y no deben aparecer como capacidades disponibles. Las integraciones y garantías diferidas de la sección 1.5 tampoco forman parte de la aceptación del Sprint.

### P1 - Incremento mínimo publicable

#### US-01 - Acceder a KeyOps según perfil

**Historia**: Como analista autorizado, quiero autenticarme en KeyOps para acceder únicamente a las funcionalidades permitidas según mi perfil.

**Por qué P1**: Sin acceso controlado no es seguro delegar operaciones de credenciales al equipo de analistas.

**Prueba independiente**: Se valida con un usuario autorizado, uno inexistente, uno deshabilitado y uno con permisos limitados; cada resultado deja trazabilidad.

**Criterios de aceptación**:

```gherkin
Escenario: Acceso de un analista autorizado
  Dado que el analista está autorizado y habilitado
  Cuando inicia sesión con credenciales válidas
  Entonces accede a KeyOps
  Y visualiza únicamente las funcionalidades permitidas por su perfil
  Y se registra el acceso en la auditoría

Escenario: Rechazo de usuario no autorizado
  Dado que la persona no está autorizada o está deshabilitada
  Cuando intenta iniciar sesión
  Entonces el sistema rechaza el acceso
  Y informa que el usuario no está autorizado o no está activo
  Y registra el intento en la auditoría
```

#### US-02 - Consultar el inventario de aplicaciones y credenciales

**Historia**: Como analista, quiero consultar, buscar y filtrar las aplicaciones y sus credenciales para localizar rápidamente la integración que debo gestionar.

**Por qué P1**: El inventario es el punto de entrada de las operaciones posteriores y evita consultas manuales a información dispersa.

**Prueba independiente**: Con un conjunto de aplicaciones en distintos estados y ambientes, se comprueba visualización paginada, búsqueda, filtros, ordenación y ausencia de resultados.

**Criterios de aceptación**:

```gherkin
Escenario: Consulta del inventario
  Dado que existen aplicaciones disponibles para el analista
  Cuando abre el inventario
  Entonces el sistema muestra los resultados paginados
  Y muestra institución, aplicación, ambiente, estado de credencial y fecha del último cambio
  Y permite ordenarlos por institución, aplicación y fecha de cambio

Escenario: Búsqueda por cualquier dato operativo autorizado
  Dado que el inventario contiene aplicaciones con distintos datos operativos
  Cuando el analista busca por aplicación, institución, usuario del historial, contacto técnico, solicitud, Client ID, rol, estado o IP declarada
  Entonces el sistema muestra únicamente los registros coincidentes del ambiente activo
  Y obtiene el mismo resultado aunque cambie mayúsculas, minúsculas o acentos

Escenario: Búsqueda y filtrado sin resultados
  Dado que el inventario contiene aplicaciones con distintos estados
  Cuando el analista introduce una búsqueda sin coincidencias y aplica filtros
  Entonces el sistema muestra únicamente los registros coincidentes
  Y si no hay coincidencias informa que no existen resultados
  Y mantiene disponibles los criterios de búsqueda

Escenario: Exclusión de datos sensibles en la búsqueda
  Dado que las credenciales disponen de datos sensibles de entrega
  Cuando el analista utiliza el buscador del inventario
  Entonces el buscador no consulta ni revela Client Secrets, OTP, contraseñas ni enlaces de entrega
```

#### US-03 - Consultar el detalle de una aplicación

**Historia**: Como analista, quiero visualizar el detalle de una aplicación para validar su configuración antes de actuar sobre sus credenciales.

**Por qué P1**: Las operaciones críticas deben hacerse sobre una aplicación, un rol y un ambiente comprobados.

**Prueba independiente**: Se prueba una aplicación existente, una inexistente y una aplicación con credenciales; el secreto nunca se expone en pantalla.

**Criterios de aceptación**:

```gherkin
Escenario: Consulta de detalle existente
  Dado que la aplicación existe y el analista puede consultarla
  Cuando solicita ver su detalle
  Entonces el sistema muestra institución, aplicación, ambiente, rol, contacto técnico, IP declaradas y datos de solicitud
  Y muestra el historial de estados y la información de credenciales disponible
  Y muestra el Client ID sin mostrar el Client Secret

Escenario: Consulta de aplicación inexistente
  Dado que la aplicación no existe o no está disponible para el analista
  Cuando solicita ver su detalle
  Entonces el sistema informa que la aplicación no fue encontrada
```

#### US-04 - Emitir, entregar y activar credenciales iniciales

**Historia**: Como analista autorizado, quiero emitir y poner a disposición de la institución las credenciales de una aplicación para habilitar el consumo de la API.

**Aplicación en el MVP**: El recorrido se completa con una credencial y una entrega sintéticas; no habilita consumo real de la API.

**Por qué P1**: Es la capacidad que elimina la espera actual al equipo técnico y materializa la propuesta de valor del producto.

**Prueba independiente**: Con una aplicación sin credenciales activas se emite una credencial sintética, se genera su artefacto descargable y su código de demostración, y se verifican activación y auditoría. Con una aplicación activa se exige regeneración.

**Criterios de aceptación**:

```gherkin
Escenario: Generación inicial exitosa
  Dado que la aplicación no tiene credenciales activas y el analista tiene permiso de emisión
  Cuando solicita generar credenciales
  Entonces el sistema crea y activa las credenciales de la aplicación
  Y genera un artefacto sintético descargable que no contiene secretos reales
  Y genera un código de demostración de un solo uso válido durante dos minutos para acceder al artefacto
  Y registra el resultado de la operación en la auditoría

Escenario: Intento de generación con credenciales activas
  Dado que la aplicación tiene credenciales activas
  Cuando el analista solicita generar credenciales
  Entonces el sistema no crea una segunda credencial activa
  Y informa que debe utilizar la regeneración

Escenario: Fallo de generación
  Dado que la aplicación no tiene credenciales activas
  Cuando la generación no puede completarse
  Entonces el sistema informa que la operación no se completó
  Y no cambia el estado de la aplicación ni de sus credenciales
  Y registra el resultado fallido en la auditoría
```

#### US-05 - Regenerar credenciales vigentes

**Historia**: Como analista autorizado, quiero regenerar las credenciales de una aplicación para reemplazarlas ante una necesidad operativa o de seguridad.

**Aplicación en el MVP**: La rotación se valida sobre versiones sintéticas persistentes y no sustituye credenciales de un servicio real.

**Por qué P1**: La regeneración evita generar credenciales duplicadas y permite resolver sustituciones operativas o de seguridad sin escalar al equipo técnico.

**Prueba independiente**: Se valida una regeneración correcta, el rechazo cuando no hay credenciales y la conservación de la versión vigente si ocurre un fallo.

**Criterios de aceptación**:

```gherkin
Escenario: Regeneración exitosa
  Dado que la aplicación tiene credenciales activas y el analista tiene permiso de regeneración
  Cuando solicita regenerarlas
  Entonces el sistema genera y activa una nueva versión de credenciales
  Y inactiva inmediatamente la versión anterior por rotación
  Y genera un nuevo artefacto sintético con un código de demostración de un solo uso válido durante dos minutos
  Y registra la operación en la auditoría

Escenario: Regeneración sin credenciales previas
  Dado que la aplicación no tiene credenciales
  Cuando el analista solicita regenerarlas
  Entonces el sistema informa que primero debe generar credenciales

Escenario: Fallo durante la regeneración
  Dado que la aplicación tiene credenciales activas
  Cuando la regeneración no puede completarse
  Entonces el sistema conserva las credenciales vigentes
  Y informa que la operación no se completó
  Y registra el resultado fallido en la auditoría
```

#### US-06 - Suspender y reactivar credenciales

**Historia**: Como analista autorizado, quiero suspender temporalmente una credencial y reactivarla para impedir el acceso a la API mientras se investiga un incidente o se realiza una revisión.

**Aplicación en el MVP**: La suspensión y reactivación impiden o permiten las operaciones posteriores dentro de la demostración, sin cambiar accesos reales.

**Por qué P1**: Permite responder rápidamente ante incidentes sin invalidar definitivamente una credencial que puede volver a ser válida.

**Prueba independiente**: Se comprueba la suspensión de una credencial activa, la reactivación de una suspendida y el rechazo de transiciones no válidas.

**Criterios de aceptación**:

```gherkin
Escenario: Suspensión de una credencial activa
  Dado que la credencial está activa y el analista tiene permiso para suspenderla
  Cuando registra el motivo y solicita la suspensión
  Entonces el sistema cambia el estado a suspendida
  Y deja la credencial temporalmente inutilizable
  Y registra la acción en la auditoría

Escenario: Reactivación de una credencial suspendida
  Dado que la credencial está suspendida y el analista tiene permiso para reactivarla
  Cuando registra el motivo y solicita la reactivación
  Entonces el sistema cambia el estado a activa
  Y registra la acción en la auditoría

Escenario: Operación no válida por estado
  Dado que la credencial está revocada
  Cuando el analista solicita suspenderla o reactivarla
  Entonces el sistema rechaza la operación
  Y explica que no es válida para el estado actual
```

#### US-07 - Revocar credenciales

**Historia**: Como analista senior autorizado, quiero revocar definitivamente una credencial para impedir que vuelva a utilizarse ante un incidente de seguridad o el cierre de una aplicación.

**Aplicación en el MVP**: La revocación bloquea definitivamente las operaciones posteriores sobre la credencial sintética, sin invalidar accesos reales.

**Por qué P1**: La revocación es un control crítico de seguridad y debe estar disponible sin depender de una operación manual externa.

**Prueba independiente**: Se valida la revocación desde estado activo y suspendido, el bloqueo posterior de uso y la no repetición de una revocación ya efectuada.

**Criterios de aceptación**:

```gherkin
Escenario: Revocación de credencial activa
  Dado que la credencial está activa y el analista senior tiene permiso de revocación
  Cuando registra el motivo y solicita revocarla
  Entonces el sistema cambia el estado a revocada
  Y impide el uso posterior de la credencial
  Y registra la operación en la auditoría

Escenario: Revocación de credencial suspendida
  Dado que la credencial está suspendida y el analista senior tiene permiso de revocación
  Cuando registra el motivo y solicita revocarla
  Entonces el sistema cambia el estado a revocada
  Y registra la operación en la auditoría

Escenario: Revocación repetida
  Dado que la credencial ya está revocada
  Cuando el analista solicita revocarla de nuevo
  Entonces el sistema no modifica la credencial
  Y comunica que ya se encuentra revocada
```

#### US-08 - Registrar automáticamente la auditoría

**Historia**: Como organización, quiero que las acciones relevantes de KeyOps queden registradas automáticamente para asegurar la trazabilidad y el cumplimiento de las políticas aplicables.

**Aplicación en el MVP**: Se valida la trazabilidad funcional persistente; la resistencia a administradores y la retención de cinco años se verifican después del MVP.

**Por qué P1**: La delegación de operaciones solo es segura si existe evidencia de las acciones exitosas y fallidas.

**Prueba independiente**: Se ejecuta una operación correcta y una fallida; en ambos casos se comprueba que existe un evento completo y consultable cuando el permiso aplica.

**Criterios de aceptación**:

```gherkin
Escenario: Registro de una operación exitosa
  Dado que un usuario autorizado ejecuta una acción relevante en KeyOps
  Cuando la operación finaliza correctamente
  Entonces el sistema registra fecha y hora, usuario, operación, institución, aplicación, resultado e IP de origen

Escenario: Registro de una operación fallida
  Dado que un usuario intenta ejecutar una acción relevante
  Cuando la operación finaliza con error o es rechazada
  Entonces el sistema registra el intento y su resultado
  Y conserva la causa disponible para la consulta autorizada
```

#### US-13 - Operar por ambiente

**Historia**: Como analista, quiero seleccionar el ambiente de trabajo para realizar operaciones únicamente sobre la información correspondiente.

**Por qué P1**: El MVP representa desde el inicio los contextos de pruebas y producción y debe evitar cualquier mezcla de información o acciones entre ambos, aunque ninguno tenga efectos sobre sistemas reales.

**Prueba independiente**: Con ambos ambientes de demostración disponibles, se comprueba que el cambio muestra solo datos del ambiente activo, que este es visible en toda operación y que ambos se identifican como no reales.

**Criterios de aceptación**:

```gherkin
Escenario: Cambio de ambiente
  Dado que el analista tiene disponibles los ambientes de demostración de pruebas y producción
  Cuando selecciona un ambiente de trabajo
  Entonces el sistema muestra únicamente la información de ese ambiente
  Y identifica claramente el ambiente activo
  Y lo identifica como un ambiente de demostración sin efectos externos
  Y aplica la misma matriz de permisos en ambos ambientes

Escenario: Ambiente sin aplicaciones
  Dado que el ambiente seleccionado no tiene aplicaciones disponibles
  Cuando el analista cambia a ese ambiente
  Entonces el sistema informa que no existen registros para el ambiente
```

### P2 - Capacidades de eficiencia, soporte y control

#### US-09 - Descargar o reenviar credenciales vigentes

**Historia**: Como analista, quiero solicitar una nueva descarga de credenciales vigentes para entregarlas otra vez a la institución cuando sea necesario.

**Aplicación en el MVP**: La descarga contiene únicamente material sintético y no utiliza un ZIP cifrado ni un canal corporativo.

**Por qué P2**: Aporta eficiencia a la operación diaria, pero depende de que la emisión ya funcione.

**Prueba independiente**: Se valida una nueva entrega de credenciales vigentes y el rechazo cuando no existen o están revocadas.

**Criterios de aceptación**:

```gherkin
Escenario: Nueva entrega de credenciales vigentes
  Dado que la aplicación tiene credenciales vigentes y el analista tiene permiso de descarga
  Cuando solicita una nueva descarga
  Entonces el sistema genera un nuevo artefacto sintético descargable
  Y genera un código de demostración nuevo, de un solo uso y válido durante dos minutos
  Y deja de aceptar el código anterior
  Y registra la descarga en la auditoría

Escenario: Solicitud de descarga no permitida
  Dado que la aplicación no tiene credenciales o estas están revocadas
  Cuando el analista solicita descargarlas
  Entonces el sistema rechaza la descarga
  Y explica si debe generar una credencial inicial o una nueva versión
```

#### US-10 - Registrar información asociada a una gestión

**Historia**: Como analista, quiero registrar y actualizar información complementaria de una gestión para conservar el contexto de las acciones realizadas.

**Por qué P2**: Facilita la coordinación y las revisiones sin bloquear la emisión de credenciales.

**Prueba independiente**: Se crea y actualiza un contacto, motivo y número de solicitud; se verifica que el motivo es obligatorio en las acciones que lo requieren.

**Criterios de aceptación**:

```gherkin
Escenario: Registro de información complementaria
  Dado que el analista consulta el detalle de una aplicación
  Cuando registra o actualiza el contacto técnico, el motivo o el número de solicitud
  Entonces el sistema guarda la información válida
  Y la muestra en consultas posteriores

Escenario: Falta de motivo obligatorio
  Dado que la acción seleccionada requiere un motivo
  Cuando el analista intenta completar la acción sin registrarlo
  Entonces el sistema informa que el motivo es obligatorio
  Y no completa la acción
```

#### US-11 - Consultar el uso de una aplicación

**Estado en el próximo Sprint**: Diferida y fuera del MVP web. No debe aparecer como capacidad disponible.

**Historia**: Como analista, quiero consultar el uso de las aplicaciones integradas para detectar anomalías y prestar soporte contextual.

**Por qué P2**: Mejora el soporte y el diagnóstico, pero el ciclo de vida de credenciales puede operar sin esta información.

**Prueba independiente**: Se prueba una aplicación con datos de uso, otra sin datos y un caso en que la información no está disponible.

**Criterios de aceptación**:

```gherkin
Escenario: Consulta de uso disponible
  Dado que existen registros de consumo de una aplicación
  Cuando el analista consulta su uso
  Entonces el sistema muestra mensajes enviados, servicios consumidos, IP utilizadas y fecha del último consumo disponibles

Escenario: Ausencia de datos de uso
  Dado que no hay registros de consumo disponibles para una aplicación
  Cuando el analista consulta su uso
  Entonces el sistema informa que no existen registros o que la consulta no está disponible
```

#### US-12 - Consultar la auditoría

**Historia**: Como auditor, administrador o analista senior, quiero consultar el historial de acciones sobre credenciales para verificar operaciones e investigar incidencias.

**Aplicación en el MVP**: La consulta cubre el historial funcional persistente del caso de estudio, sin certificar inmutabilidad administrativa ni retención de cinco años.

**Por qué P2**: La auditoría se registra desde P1; esta capacidad habilita su explotación operativa y de cumplimiento.

**Prueba independiente**: Con eventos de varias fechas, usuarios, instituciones y aplicaciones, se valida la ordenación, los filtros y la respuesta sin coincidencias.

**Criterios de aceptación**:

```gherkin
Escenario: Consulta de historial de auditoría
  Dado que existen eventos de auditoría visibles para el usuario
  Cuando consulta el historial
  Entonces el sistema muestra los eventos ordenados cronológicamente
  Y presenta los datos definidos para cada evento

Escenario: Filtrado de auditoría
  Dado que existen eventos de varias instituciones, aplicaciones, usuarios y fechas
  Cuando el usuario aplica uno o más filtros permitidos
  Entonces el sistema muestra únicamente los eventos coincidentes
  Y si no hay coincidencias informa que no existen registros
```

### P3 - Administración de usuarios

#### US-14 - Gestionar usuarios y perfiles autorizados

**Estado en el próximo Sprint**: Diferida y fuera del MVP web. Los usuarios y perfiles necesarios para demostrar permisos estarán predefinidos.

**Historia**: Como administrador, quiero gestionar usuarios autorizados, perfiles y su estado para controlar quién entra a KeyOps y qué operaciones puede realizar.

**Por qué P3**: Puede apoyarse inicialmente en un mecanismo corporativo existente; su necesidad aumenta al extender el uso más allá del piloto.

**Prueba independiente**: Un administrador registra, modifica y deshabilita usuarios; se verifica que no se duplican identidades y que los cambios afectan a los permisos.

**Criterios de aceptación**:

```gherkin
Escenario: Alta de un analista autorizado
  Dado que el administrador tiene permisos de gestión de usuarios
  Cuando registra un analista nuevo y le asigna un perfil
  Entonces el sistema crea el usuario autorizado
  Y aplica las acciones correspondientes al perfil asignado
  Y registra la operación en la auditoría

Escenario: Intento de alta duplicada
  Dado que el usuario ya está registrado
  Cuando el administrador intenta registrarlo de nuevo
  Entonces el sistema no crea un segundo usuario
  Y informa que el usuario ya existe
```

## 6. Requisitos no funcionales

- **Seguridad y permisos**: Las acciones y datos visibles deben respetar el perfil del usuario. El Client Secret no se muestra en consultas de detalle. Las acciones de alto impacto deben quedar restringidas a los perfiles aprobados.
- **Trazabilidad**: Los eventos de auditoría deben permitir reconstruir quién hizo qué, sobre qué institución, aplicación y credencial, cuándo, desde qué IP de origen y con qué resultado.
- **Integridad operativa**: Las operaciones fallidas no pueden dejar estados parciales o contradictorios. Las credenciales vigentes se preservan cuando falla una regeneración.
- **Persistencia compartida**: Los cambios confirmados deben sobrevivir al cierre de la aplicación y a nuevas sesiones, y ser coherentes para todos los usuarios autorizados del mismo ambiente.
- **Confirmación y reintento**: El sistema no debe mostrar éxito antes de conservar el resultado. Un reintento tras una respuesta incierta no debe duplicar el efecto de negocio.
- **Separación de ambientes**: La información de pruebas y producción no debe mezclarse ni permitir acciones sobre un ambiente distinto del visible para el usuario.
- **Usabilidad**: Un analista del piloto debe poder localizar una aplicación desde una única línea de búsqueda, conservar la consulta cuando no haya resultados y completar la operación permitida sin recurrir a un miembro técnico para el flujo ordinario.
- **Cumplimiento del MVP**: Los eventos de auditoría son persistentes, se añaden sin edición desde la aplicación y solo pueden ser consultados por auditor, administrador y analista senior. La resistencia a modificación por administradores y la conservación garantizada durante cinco años se exigen antes del piloto real, no para aceptar este Sprint.
- **Disponibilidad y rendimiento**: En el 95 % de los casos del piloto, el inventario y el detalle deben estar disponibles en menos de dos segundos, y la emisión o regeneración en menos de 30 segundos. Ante una operación fallida, el sistema conserva el estado anterior, registra el resultado y permite al usuario reintentarla.
- **Coste del caso de estudio**: El MVP web persistente debe poder desarrollarse, publicarse, ejecutarse y validarse sin licencias, suscripciones ni servicios de software de pago adicionales.
- **Alcance de la evidencia**: La validación con datos y credenciales sintéticos demuestra comportamiento y persistencia funcional, pero no sustituye la validación de seguridad, invalidación, inmutabilidad y retención exigida antes de un piloto real.
- **Publicación web móvil**: Los flujos incluidos deben poder completarse desde un navegador móvil mediante la versión publicada, sin instalación nativa y sin desplazamiento horizontal en los tamaños de pantalla objetivo.
- **Independencia de integraciones diferidas**: La indisponibilidad de los sistemas corporativos no debe impedir el uso ordinario del MVP ni provocar una sustitución silenciosa de datos persistentes por datos reiniciables.
- **Transparencia de demostración**: Toda credencial, entrega o ambiente sintético debe identificarse de forma visible para evitar que un usuario lo interprete como acceso o dato real.

## 7. Entidades clave

| Entidad               | Descripción y datos relevantes                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Institución           | Organización conectada a la plataforma; agrupa aplicaciones. En el MVP se representa mediante datos persistentes del caso de estudio.                           |
| Aplicación integrada  | Integración de una institución en un ambiente; incluye identificador, rol, contacto técnico, IP declaradas, solicitud y estados. En el MVP no modifica catálogos reales. |
| Rol de API            | Conjunto de servicios de API permitidos para una aplicación. En el MVP procede del conjunto representativo predefinido.                                        |
| Credencial            | Identidad de acceso asociada a una aplicación, con Client ID, secreto no visible, estado, ambiente y versión. En el MVP es sintética y no concede acceso real.   |
| Versión de credencial | Registro histórico de una emisión o regeneración, incluyendo su relación con la versión previa.                                                                |
| Entrega               | Artefacto asociado a una emisión, regeneración o reenvío. En el MVP solo contiene material sintético y se accede con un código de demostración de un solo uso válido durante dos minutos. El ZIP cifrado real queda diferido. |
| Ambiente              | Contexto operativo de pruebas o producción. En el MVP es un contexto de demostración sin efectos externos.                                                     |
| Usuario interno       | Persona autorizada a acceder a KeyOps. En el MVP pertenece al conjunto predefinido para el caso de estudio.                                                     |
| Perfil de usuario     | Conjunto de acciones permitidas para un usuario, por ejemplo analista, analista senior, administrador o auditor.                                               |
| Gestión               | Información operativa asociada a una acción: motivo, contacto técnico y solicitud o ticket.                                                                    |
| Evento de auditoría   | Evidencia persistente de una acción o intento, con actor, fecha y hora, objetivo, resultado e IP de origen. Las garantías de inmutabilidad y retención se validan después del MVP. |
| Registro de uso       | Información sobre mensajes, servicios, IP y último consumo de una aplicación; su consulta queda diferida fuera del MVP.                                         |

## 8. Criterios de éxito

### 8.1 Aceptación del MVP web del próximo Sprint

- **SC-009 - Cobertura funcional persistente**: Las 12 historias incluidas deben quedar validadas en la aplicación web publicada: todas las historias P1 y las historias US-09, US-10 y US-12, con evidencia repetible de cada escenario aplicable.
- **SC-010 - Conservación entre sesiones**: El 100 % de los cambios confirmados durante la validación de esas 12 historias debe seguir visible después de cerrar la aplicación e iniciar una sesión nueva, y debe ser observable por otro usuario autorizado para el mismo recurso.
- **SC-011 - Fallos y reintentos seguros**: En el 100 % de los casos de validación en que se fuerce un fallo de conservación, el sistema debe evitar un falso mensaje de éxito y mantener el estado anterior; al repetir la misma solicitud no debe aparecer más de un efecto de negocio.
- **SC-012 - Coste adicional de software**: El coste obligatorio de licencias, suscripciones y consumo de software para publicar, ejecutar y validar el MVP debe ser de 0 euros.
- **SC-013 - Acceso web móvil**: El MVP debe ser accesible mediante una URL publicada y permitir completar las 12 historias incluidas en dos tamaños representativos de navegador móvil, 390 × 844 y 360 × 800, sin instalación ni desplazamiento horizontal.
- **SC-014 - Flujos visibles completos**: El 100 % de los botones, enlaces y acciones mostrados como disponibles debe completar su comportamiento o devolver un error controlado; debe haber cero controles decorativos o pantallas sin recorrido funcional.
- **SC-015 - Alcance transparente**: El 100 % de las pantallas que muestran credenciales, entregas o ambientes sintéticos debe identificarlos como demostración, y US-11 y US-14 no deben aparecer como capacidades disponibles.
- **SC-016 - Independencia externa**: Las 12 historias incluidas deben poder validarse sin acceder a sistemas corporativos y sin crear, modificar, entregar o invalidar credenciales reales.

### 8.2 Medición del piloto posterior

Los siguientes criterios se conservan como objetivos del piloto real y no bloquean la aceptación del próximo Sprint:

- **SC-001 - Tiempo de ciclo**: Se medirá la reducción del tiempo mediano desde que la solicitud está completa hasta que la credencial queda disponible. Fórmula: `((tiempo mediano antes - tiempo mediano después) / tiempo mediano antes) x 100`. El piloto debe lograr una reducción de al menos el 50 %.
- **SC-002 - Comparabilidad**: Las métricas separarán altas de renovaciones, pruebas de producción y operaciones de complejidad equivalente. El período de referencia y el grupo de control deben documentarse antes del piloto.
- **SC-003 - Coste operativo por credencial**: Se comparará `(horas de analista x coste/hora de analista) + (horas de técnico x coste/hora de técnico) + coste de retrabajo` antes y después. Tras el MVP se añadirá el coste proporcional de la plataforma para calcular el coste total. El piloto debe reducir el coste operativo por credencial al menos un 30 %.
- **SC-004 - Adopción**: Se medirá `analistas que han gestionado al menos una credencial / analistas habilitados` durante el piloto de tres meses. La adopción debe alcanzar al menos el 80 %.
- **SC-005 - Satisfacción**: Se medirá `respuestas con valoración 4 o 5 sobre 5 / total de respuestas` de los analistas participantes. La satisfacción debe alcanzar al menos el 80 %.
- **SC-006 - Trazabilidad**: El 100 % de las operaciones P1, tanto exitosas como fallidas, debe poder asociarse a un evento de auditoría completo antes de ampliar el despliegue.
- **SC-007 - Autonomía operativa**: Las operaciones P1 que no sean excepciones deben poder ser completadas por analistas del piloto sin solicitar intervención del equipo técnico.
- **SC-008 - Localización de registros**: Con un inventario de al menos 20 aplicaciones, un analista debe poder reducir la lista a los registros coincidentes en menos de un segundo tras introducir una búsqueda por cualquiera de los campos operativos autorizados.

## 9. Suposiciones

- Los analistas del piloto podrán recibir permisos acotados sin acceder directamente a sistemas internos de administración técnica.
- El administrador de KeyOps conservará la capacidad de gestionar excepciones, permisos e incidencias que queden fuera del flujo ordinario.
- Las tres instituciones de mayor volumen aportarán suficientes altas, regeneraciones o incidencias para evaluar el piloto durante tres meses.
- Es posible obtener o acordar un coste/hora medio de analistas y administradores técnicos, así como horas productivas comparables.
- Se dispondrá de datos suficientes para distinguir solicitudes completas, tiempo de ciclo, retrabajo y tipo de operación antes y después del piloto.
- Durante el MVP no se entregan credenciales reales a usuarios externos; los materiales sintéticos se utilizan únicamente para validar el recorrido.
- La matriz de permisos y las transiciones de estado definidas en este documento se aplicarán antes de habilitar acciones irreversibles.
- La búsqueda se limita al ambiente activo y a campos operativos autorizados. El “usuario” buscable corresponde a los actores registrados en el historial de la credencial dentro del conjunto representativo persistente.
- Las operaciones críticas se realizan con conectividad disponible; esta versión no ofrece una cola de operaciones sin conexión.
- El MVP utiliza datos representativos persistentes, usuarios predefinidos y materiales de entrega sintéticos. Su validación no demuestra emisión o revocación sobre servicios reales ni las garantías materiales de inmutabilidad y retención de la auditoría.
- La información de consumo US-11 y la administración de usuarios US-14 quedan fuera del MVP. Ninguna de las dos debe mostrarse como capacidad disponible durante este Sprint.

## 10. Decisiones confirmadas

- La primera versión no gestiona fechas de caducidad, alertas ni renovaciones preventivas.
- El MVP utiliza instituciones, aplicaciones y roles representativos y persistentes; la integración con el catálogo corporativo queda diferida.
- Emitir credenciales activa una credencial sintética y genera su entrega de demostración en una misma operación; no concede acceso a servicios reales.
- Regenerar activa una nueva versión e inactiva inmediatamente la versión anterior por rotación.
- Analistas, analistas senior, administradores y auditores operan conforme a la matriz de permisos de la sección 4.3, idéntica en pruebas y producción.
- La entrega de demostración utiliza un artefacto sintético y un código de un solo uso válido durante dos minutos; el ZIP cifrado, su contraseña separada y la entrega real por canales corporativos quedan diferidos.
- En el MVP, los eventos de auditoría son persistentes, se añaden sin edición desde la aplicación y solo los consultan auditor, administrador y analista senior. La inmutabilidad frente a administradores y la conservación garantizada durante cinco años siguen siendo requisitos previos al piloto real.
- El piloto debe cumplir los objetivos de tiempo de ciclo, coste operativo, adopción y satisfacción definidos en la sección 8 antes de iniciar el despliegue por olas.
- El inventario ofrece una única búsqueda insensible a mayúsculas y acentos sobre los campos operativos autorizados; los datos sensibles de credenciales y entrega quedan siempre fuera de su índice.
- Los cambios confirmados se conservan entre cierres de la aplicación y nuevas sesiones, y son coherentes para los usuarios autorizados dentro del mismo ambiente.
- El MVP se publica como aplicación web móvil y puede usar credenciales sintéticas para validar comportamiento, pero no se considera evidencia de garantías productivas sobre secretos, invalidación o auditoría.
- Esta iteración debe validar 12 de las 14 historias existentes sin coste obligatorio de software adicional; US-11 y US-14 están expresamente fuera de alcance y no deben aparecer como disponibles.
