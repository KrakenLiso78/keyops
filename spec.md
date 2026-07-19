# KeyOps — Especificación de feature: Gestión autónoma de credenciales API

**Proyecto**: KeyOps  
**Rama**: `[001-gestion-autonoma-credenciales-api]`  
**Creado**: 17 de julio de 2026  
**Estado**: Borrador para validación  
**Entradas**: `Lean Canvas Full · Gestión autónoma de credenciales API · Escuadrón 04.docx` y `docs/product/historias-de-usuario-keyops.docx`

## 1. Contexto y objetivo

La plataforma de notificaciones legales conecta instituciones que, a su vez, pueden tener muchas aplicaciones integradas. Cada aplicación necesita credenciales y un rol que delimita los servicios de la API que puede utilizar. Actualmente, la emisión, entrega y renovación de esas credenciales depende de un miembro del equipo técnico con acceso directo a los sistemas internos. Esto convierte una operación repetitiva en un cuello de botella, especialmente para las instituciones con más de 20 aplicaciones y varias renovaciones mensuales.

Esta feature define KeyOps, un BackOffice interno que permita a analistas autorizados consultar y gestionar el ciclo de vida ordinario de las credenciales de una aplicación, manteniendo el control, los permisos y la supervisión técnica necesarios. El piloto se orienta inicialmente a los analistas que atienden las tres instituciones de mayor volumen.

El resultado de negocio buscado es reducir el tiempo de ciclo de emisión o renovación: desde que una solicitud está completa hasta que la credencial queda disponible para la institución. El piloto también debe permitir comparar el coste operativo por credencial antes y después de usar KeyOps.

### 1.1 Usuarios y responsabilidades

| Usuario o parte interesada | Necesidad y responsabilidad |
|---|---|
| Propietario de la plataforma | Patrocina la solución, asume el coste y valida que reduzca carga operativa y riesgo. |
| Analista autorizado | Opera el flujo habitual: consulta, emisión, descarga, regeneración y acciones permitidas sobre credenciales. Actualmente no emite credenciales. |
| Analista senior | Puede realizar todas las acciones del analista y revocar credenciales. |
| Administrador de KeyOps | Pertenece al equipo técnico del propietario. Gestiona usuarios y permisos, resuelve excepciones y mantiene la supervisión; actualmente realiza la emisión manual. |
| Auditor | Consulta la trazabilidad de las operaciones. |
| Responsable de integración de la institución | Recibe y utiliza credenciales válidas para integrar su aplicación. No se contempla como usuario directo de KeyOps en este MVP. |

### 1.2 Alcance del MVP

El MVP cubre el acceso de usuarios internos autorizados, la consulta de aplicaciones y credenciales existentes, la gestión controlada de las acciones esenciales del ciclo de vida en pruebas y producción, y el registro trazable de todas las operaciones relevantes.

El MVP consulta las instituciones, aplicaciones y roles de un catálogo existente, gestionado por otro módulo. KeyOps no crea, modifica ni elimina esos datos; los utiliza como fuente de consulta para operar credenciales.

### 1.3 Decisiones de alcance adoptadas

- La primera versión no gestiona fechas de caducidad, alertas ni renovaciones preventivas.
- Las instituciones, aplicaciones y roles se consultan desde el catálogo existente de otro módulo; su mantenimiento queda fuera de KeyOps.
- Pruebas y producción están disponibles desde el inicio. El usuario selecciona el ambiente activo y la misma matriz de permisos se aplica en ambos.

## 2. Objetivos y no objetivos

### Objetivos

- Dar autonomía segura a los analistas para resolver operaciones habituales sin depender de la disponibilidad del equipo técnico.
- Mantener una relación visible entre institución, aplicación, ambiente, rol y credenciales.
- Reducir el tiempo de ciclo de emisión o renovación de credenciales en el piloto.
- Conservar evidencia suficiente de quién hizo cada operación, sobre qué aplicación y con qué resultado.
- Permitir al propietario medir adopción, satisfacción y ahorro operativo antes de ampliar el despliegue.

### No objetivos

- Construir un portal de autoservicio para responsables de integración externos.
- Definir la arquitectura, la integración técnica, el almacenamiento, los mecanismos criptográficos o la implementación de autenticación.
- Sustituir todos los controles y excepciones que actualmente gestiona el equipo técnico.
- Gestionar fechas de caducidad, alertas automáticas o renovaciones programadas.
- Crear, modificar o eliminar instituciones, aplicaciones o roles del catálogo externo.
- Incorporar analítica avanzada o monitorización en tiempo real del uso de la API.
- Definir precios, facturación o ingresos directos: el caso económico es de eficiencia interna.

## 3. Requisitos funcionales

- **FR-001**: KeyOps DEBE permitir el acceso únicamente a usuarios internos autorizados y mostrarles solo las acciones permitidas por su perfil.
- **FR-002**: KeyOps DEBE rechazar los accesos de usuarios inexistentes, deshabilitados o no autorizados e informar del rechazo sin revelar información sensible.
- **FR-003**: El sistema DEBE ofrecer un inventario paginado de aplicaciones y sus credenciales, con institución, aplicación, ambiente, estado y fecha del último cambio.
- **FR-004**: El inventario DEBE permitir buscar por institución, aplicación e identificador de solicitud, filtrar por estado y ordenar los resultados.
- **FR-005**: El sistema DEBE mostrar el detalle de una aplicación con su institución, ambiente, rol, contacto técnico, IP declaradas, datos de solicitud, historial de estados e información de credenciales.
- **FR-006**: El detalle DEBE identificar el Client ID cuando exista y NO DEBE mostrar el Client Secret.
- **FR-007**: Un analista autorizado DEBE poder generar, entregar y activar credenciales para una aplicación que no tenga credenciales activas en una misma operación, dejando el resultado trazado.
- **FR-008**: La entrega DEBE ofrecer a la institución un ZIP protegido, al que accede autenticándose con un OTP de un solo uso válido durante dos minutos. La contraseña del ZIP DEBE ser distinta del OTP.
- **FR-009**: Un analista autorizado DEBE poder regenerar credenciales activas; la nueva credencial queda activa y la versión anterior queda inmediatamente inactiva por rotación.
- **FR-010**: El sistema DEBE impedir que un fallo durante la generación o regeneración deje la aplicación en un estado incoherente; en una regeneración fallida, las credenciales vigentes deben conservarse.
- **FR-011**: Un analista autorizado DEBE poder suspender temporalmente una credencial activa y reactivarla cuando esté suspendida, registrando el motivo de cada acción.
- **FR-012**: Un usuario con el perfil autorizado para ello DEBE poder revocar de forma definitiva una credencial activa o suspendida, evitando su uso posterior.
- **FR-013**: Toda acción relevante de acceso, consulta sensible, emisión, descarga, regeneración, suspensión, reactivación, revocación o cambio de permisos DEBE generar un evento de auditoría con fecha y hora, usuario, operación, institución, aplicación, resultado e IP de origen.
- **FR-014**: El sistema DEBE permitir registrar y actualizar información operativa asociada a una gestión, incluyendo contacto técnico, motivo y número de solicitud o ticket.
- **FR-015**: El auditor, el administrador y el analista senior DEBEN poder consultar el historial de auditoría y filtrarlo por fechas, institución, aplicación y usuario.
- **FR-016**: Los analistas DEBEN poder solicitar una nueva entrega de credenciales vigentes. Cada reenvío DEBE generar un ZIP protegido, una contraseña de ZIP distinta del OTP y un nuevo OTP de un solo uso válido durante dos minutos.
- **FR-017**: Cuando exista información de consumo, el sistema DEBE mostrar mensajes enviados, servicios consumidos, IP utilizadas y fecha del último consumo de la aplicación.
- **FR-018**: El sistema DEBE ofrecer los ambientes de pruebas y producción desde el inicio, mantenerlos claramente separados y mostrar solo la información y acciones del ambiente activo.
- **FR-019**: Un administrador DEBE poder gestionar los usuarios autorizados, sus perfiles y su estado de habilitación cuando esta capacidad se incorpore.

## 4. Reglas de negocio y estados

### 4.1 Estados mínimos de una credencial

| Estado | Significado | Acciones esperadas |
|---|---|---|
| Sin credenciales | La aplicación no dispone de una credencial utilizable. | Generar. |
| Activa | La credencial se ha emitido, se ha generado su entrega protegida y puede utilizarse. | Solicitar una nueva entrega, regenerar, suspender o revocar según permisos. |
| Suspendida | La credencial queda temporalmente inutilizable. | Reactivar o revocar. |
| Inactiva por rotación | Versión anterior sustituida por una regeneración; deja de poder utilizarse inmediatamente. | Consulta histórica. |
| Revocada | La credencial ha quedado definitivamente inutilizable. | Consulta histórica; no descargar ni reactivar. |

La emisión, la generación de la entrega protegida y la activación ocurren en una misma operación.

### 4.2 Reglas transversales

- Ninguna acción debe aplicarse a una aplicación inexistente o fuera del alcance del usuario.
- La regeneración no equivale a una segunda generación: exige que exista una credencial activa.
- No se puede suspender una credencial revocada ni revocar nuevamente una ya revocada.
- La suspensión, la reactivación y la revocación exigen que el usuario registre un motivo.
- Toda operación debe conservar su resultado, tanto si termina correctamente como si falla.
- La regeneración activa la nueva credencial e inactiva inmediatamente la versión anterior por rotación; no existe período de coexistencia.
- La institución se autentica con un OTP de un solo uso, válido durante dos minutos, para acceder a un ZIP protegido. La contraseña del ZIP es distinta del OTP y se entrega por el canal operativo autorizado.
- Los eventos de auditoría son inmutables, se conservan durante cinco años y solo son consultables por auditor, administrador y analista senior.

### 4.3 Matriz de permisos

| Acción | Analista | Analista senior | Administrador | Auditor |
|---|---|---|---|---|
| Consultar inventario, detalle y uso | Sí | Sí | Sí | No |
| Generar, entregar y regenerar | Sí | Sí | Sí | No |
| Suspender y reactivar | Sí | Sí | Sí | No |
| Revocar | No | Sí | Sí | No |
| Registrar información de gestión | Sí | Sí | Sí | No |
| Consultar auditoría | No | Sí | Sí | Sí |
| Gestionar usuarios y perfiles | No | No | Sí | No |

La matriz anterior se aplica de igual forma en pruebas y en producción.

## 5. Historias de usuario, prioridad y pruebas

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

Escenario: Búsqueda y filtrado sin resultados
  Dado que el inventario contiene aplicaciones con distintos estados
  Cuando el analista busca por institución, aplicación o identificador de solicitud y aplica filtros
  Entonces el sistema muestra únicamente los registros coincidentes
  Y si no hay coincidencias informa que no existen resultados
  Y mantiene disponibles los criterios de búsqueda
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

**Por qué P1**: Es la capacidad que elimina la espera actual al equipo técnico y materializa la propuesta de valor del producto.

**Prueba independiente**: Con una aplicación sin credenciales activas se emite una nueva credencial, se genera su ZIP protegido y su OTP, y se verifican activación y auditoría. Con una aplicación activa se exige regeneración.

**Criterios de aceptación**:

```gherkin
Escenario: Generación inicial exitosa
  Dado que la aplicación no tiene credenciales activas y el analista tiene permiso de emisión
  Cuando solicita generar credenciales
  Entonces el sistema crea y activa las credenciales de la aplicación
  Y genera un ZIP protegido para la institución
  Y genera un OTP de un solo uso válido durante dos minutos para acceder al ZIP
  Y garantiza que la contraseña del ZIP es distinta del OTP
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

**Por qué P1**: La regeneración evita generar credenciales duplicadas y permite resolver sustituciones operativas o de seguridad sin escalar al equipo técnico.

**Prueba independiente**: Se valida una regeneración correcta, el rechazo cuando no hay credenciales y la conservación de la versión vigente si ocurre un fallo.

**Criterios de aceptación**:

```gherkin
Escenario: Regeneración exitosa
  Dado que la aplicación tiene credenciales activas y el analista tiene permiso de regeneración
  Cuando solicita regenerarlas
  Entonces el sistema genera y activa una nueva versión de credenciales
  Y inactiva inmediatamente la versión anterior por rotación
  Y genera una nueva entrega protegida con OTP de un solo uso válido durante dos minutos
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

**Por qué P1**: El piloto opera desde el inicio tanto en pruebas como en producción y debe evitar cualquier mezcla de información o acciones entre ambos ambientes.

**Prueba independiente**: Con ambos ambientes disponibles, se comprueba que el cambio muestra solo datos del ambiente activo y que este es visible en toda operación.

**Criterios de aceptación**:

```gherkin
Escenario: Cambio de ambiente
  Dado que el analista tiene los ambientes de pruebas y producción disponibles
  Cuando selecciona un ambiente de trabajo
  Entonces el sistema muestra únicamente la información de ese ambiente
  Y identifica claramente el ambiente activo
  Y aplica la misma matriz de permisos en ambos ambientes

Escenario: Ambiente sin aplicaciones
  Dado que el ambiente seleccionado no tiene aplicaciones disponibles
  Cuando el analista cambia a ese ambiente
  Entonces el sistema informa que no existen registros para el ambiente
```

### P2 - Capacidades de eficiencia, soporte y control

#### US-09 - Descargar o reenviar credenciales vigentes

**Historia**: Como analista, quiero solicitar una nueva descarga de credenciales vigentes para entregarlas otra vez a la institución cuando sea necesario.

**Por qué P2**: Aporta eficiencia a la operación diaria, pero depende de que la emisión ya funcione.

**Prueba independiente**: Se valida una nueva entrega de credenciales vigentes y el rechazo cuando no existen o están revocadas.

**Criterios de aceptación**:

```gherkin
Escenario: Nueva entrega de credenciales vigentes
  Dado que la aplicación tiene credenciales vigentes y el analista tiene permiso de descarga
  Cuando solicita una nueva descarga
  Entonces el sistema genera un nuevo ZIP protegido para la institución
  Y genera una contraseña de ZIP distinta del nuevo OTP
  Y genera un OTP de un solo uso válido durante dos minutos
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
- **Separación de ambientes**: La información de pruebas y producción no debe mezclarse ni permitir acciones sobre un ambiente distinto del visible para el usuario.
- **Usabilidad**: Un analista del piloto debe poder localizar una aplicación y completar la operación permitida sin recurrir a un miembro técnico para el flujo ordinario.
- **Cumplimiento**: Los eventos de auditoría son inmutables, se conservan cinco años y solo pueden ser consultados por auditor, administrador y analista senior. Incluyen la IP de origen y los datos de contacto estrictamente necesarios para la gestión.
- **Disponibilidad y rendimiento**: En el 95 % de los casos del piloto, el inventario y el detalle deben estar disponibles en menos de dos segundos, y la emisión o regeneración en menos de 30 segundos. Ante una operación fallida, el sistema conserva el estado anterior, registra el resultado y permite al usuario reintentarla.

## 7. Entidades clave

| Entidad | Descripción y datos relevantes |
|---|---|
| Institución | Organización conectada a la plataforma; agrupa aplicaciones. |
| Aplicación integrada | Integración de una institución en un ambiente; incluye identificador, rol, contacto técnico, IP declaradas, solicitud y estados. |
| Rol de API | Conjunto de servicios de API permitidos para una aplicación. |
| Credencial | Identidad de acceso asociada a una aplicación, con Client ID, secreto no visible, estado, ambiente y versión. |
| Versión de credencial | Registro histórico de una emisión o regeneración, incluyendo su relación con la versión previa. |
| Entrega protegida | ZIP protegido asociado a una emisión, regeneración o reenvío, con contraseña distinta del OTP y acceso mediante OTP de un solo uso válido durante dos minutos. |
| Ambiente | Contexto operativo de pruebas, producción u otro ambiente aprobado. |
| Usuario interno | Persona autorizada a acceder a KeyOps. |
| Perfil de usuario | Conjunto de acciones permitidas para un usuario, por ejemplo analista, analista senior, administrador o auditor. |
| Gestión | Información operativa asociada a una acción: motivo, contacto técnico y solicitud o ticket. |
| Evento de auditoría | Evidencia de una acción o intento, con actor, fecha y hora, objetivo, resultado e IP de origen. |
| Registro de uso | Información disponible sobre mensajes, servicios, IP y último consumo de una aplicación. |

## 8. Criterios de éxito y medición del piloto

- **SC-001 - Tiempo de ciclo**: Se medirá la reducción del tiempo mediano desde que la solicitud está completa hasta que la credencial queda disponible. Fórmula: `((tiempo mediano antes - tiempo mediano después) / tiempo mediano antes) x 100`. El piloto debe lograr una reducción de al menos el 50 %.
- **SC-002 - Comparabilidad**: Las métricas separarán altas de renovaciones, pruebas de producción y operaciones de complejidad equivalente. El período de referencia y el grupo de control deben documentarse antes del piloto.
- **SC-003 - Coste operativo por credencial**: Se comparará `(horas de analista x coste/hora de analista) + (horas de técnico x coste/hora de técnico) + coste de retrabajo` antes y después. Tras el MVP se añadirá el coste proporcional de la plataforma para calcular el coste total. El piloto debe reducir el coste operativo por credencial al menos un 30 %.
- **SC-004 - Adopción**: Se medirá `analistas que han gestionado al menos una credencial / analistas habilitados` durante el piloto de tres meses. La adopción debe alcanzar al menos el 80 %.
- **SC-005 - Satisfacción**: Se medirá `respuestas con valoración 4 o 5 sobre 5 / total de respuestas` de los analistas participantes. La satisfacción debe alcanzar al menos el 80 %.
- **SC-006 - Trazabilidad**: El 100 % de las operaciones P1, tanto exitosas como fallidas, debe poder asociarse a un evento de auditoría completo antes de ampliar el despliegue.
- **SC-007 - Autonomía operativa**: Las operaciones P1 que no sean excepciones deben poder ser completadas por analistas del piloto sin solicitar intervención del equipo técnico.

## 9. Suposiciones

- Los analistas del piloto podrán recibir permisos acotados sin acceder directamente a sistemas internos de administración técnica.
- El administrador de KeyOps conservará la capacidad de gestionar excepciones, permisos e incidencias que queden fuera del flujo ordinario.
- Las tres instituciones de mayor volumen aportarán suficientes altas, regeneraciones o incidencias para evaluar el piloto durante tres meses.
- Es posible obtener o acordar un coste/hora medio de analistas y administradores técnicos, así como horas productivas comparables.
- Se dispondrá de datos suficientes para distinguir solicitudes completas, tiempo de ciclo, retrabajo y tipo de operación antes y después del piloto.
- Los usuarios externos recibirán las credenciales mediante el proceso de entrega definido, sin necesitar un portal propio en esta fase.
- La matriz de permisos y las transiciones de estado definidas en este documento se aplicarán antes de habilitar acciones irreversibles.

## 10. Decisiones confirmadas

- La primera versión no gestiona fechas de caducidad, alertas ni renovaciones preventivas.
- KeyOps solo consulta el catálogo existente de instituciones, aplicaciones y roles, gestionado por otro módulo.
- Emitir credenciales activa la nueva credencial y genera su entrega protegida en una misma operación.
- Regenerar activa una nueva versión e inactiva inmediatamente la versión anterior por rotación.
- Analistas, analistas senior, administradores y auditores operan conforme a la matriz de permisos de la sección 4.3, idéntica en pruebas y producción.
- La institución accede al ZIP protegido con un OTP de un solo uso válido durante dos minutos; la contraseña del ZIP es distinta del OTP.
- Los eventos de auditoría son inmutables, se conservan cinco años y solo los consultan auditor, administrador y analista senior.
- El piloto debe cumplir los objetivos de tiempo de ciclo, coste operativo, adopción y satisfacción definidos en la sección 8 antes de iniciar el despliegue por olas.
