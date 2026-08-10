# KeyOps

Plataforma para gestionar de forma segura, autónoma y auditable el ciclo de vida de credenciales API.

KeyOps permite a analistas autorizados consultar aplicaciones, generar y renovar credenciales, gestionar sus estados y mantener la trazabilidad de las operaciones realizadas.

## Estado del proyecto

El proyecto cuenta con un candidato móvil Expo funcional con adaptador fake.

- [x] Lean Canvas
- [x] Especificación funcional
- [x] Historias de usuario
- [x] Plan técnico
- [x] Desglose de tareas
- [x] Implementación local con adaptador fake

## Especificación pública

El entregable completo solicitado está disponible en:

➡️ **[Leer el spec.md completo](spec.md)**

La primera feature también está organizada siguiendo la estructura de GitHub Spec-Kit:

➡️ **[Feature 001 — Gestión de credenciales API](specs/001-gestion-credenciales-api/spec.md)**

## Documentación de producto

- [Historias de usuario](docs/product/historias-de-usuario-keyops.docx)
- [Lean Canvas](docs/product/keyops-lean-canvas.pptx)

## Estructura del repositorio

```text
keyops/
├── README.md
├── spec.md
├── design/
│   ├── DESIGN.md
│   ├── Pantallas_KeyOps_V3.png
│   ├── Propuesta-Diseños.pptx
│   ├── logo.png
│   └── spec.md
├── specs/
│   └── 001-gestion-credenciales-api/
│       └── spec.md
├── mobile/
│   ├── src/
│   ├── tests/
│   └── package.json
└── docs/
    └── product/
        ├── historias-de-usuario-keyops.docx
        └── keyops-lean-canvas.pptx
```

## Metodología

KeyOps adopta un enfoque de desarrollo dirigido por especificaciones —Spec-Driven Development— basado en [GitHub Spec-Kit](https://github.com/github/spec-kit).

El flujo previsto es:

1. **Specify** — Definir qué debe resolver el producto y por qué.
2. **Plan** — Diseñar el enfoque técnico.
3. **Tasks** — Convertir el plan en tareas ejecutables.
4. **Implement** — Construir y validar la solución.

## Proyecto

Proyecto desarrollado en el contexto de VIBERANO'26.
