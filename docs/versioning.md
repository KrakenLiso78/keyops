# Versionado de KeyOps

La versión visible de la aplicación no se incrementa contando commits ni se
edita manualmente para cada cambio. La fuente de verdad es un tag semántico de
GitHub:

```text
v1.0.0
v1.0.1
v1.0.2
```

Cuando una build se ejecuta desde un tag, Expo, Vercel y el bundle web usan el
tag sin la `v` como versión de la aplicación. Las builds desde `main` conservan
la versión base de `mobile/app.json` hasta que se publique el siguiente tag.

El workflow `Validate tagged KeyOps version` valida el formato del tag y
genera el bundle correspondiente.

## Conventional Commits y etiquetado automático

Los cambios que entren en `main` deben pasar por una Pull Request cuyo título
siga [Conventional Commits](https://www.conventionalcommits.org/). El workflow
`Validate Conventional Commits` comprueba el título automáticamente.

Formatos habituales:

```text
feat: añade regeneración de credenciales
fix: corrige la expiración del OTP
docs: actualiza la documentación de configuración
refactor(api): simplifica el adaptador Airtable
feat!: cambia el contrato público de la API
```

Tipos permitidos por la convención: `feat`, `fix`, `docs`, `style`, `refactor`,
`perf`, `test`, `build`, `ci`, `chore` y `revert`. El alcance es opcional y el
resumen debe ser breve, en imperativo y sin punto final.

La configuración recomendada del repositorio es `Squash and merge` usando el
título de la Pull Request como mensaje del commit resultante. Así, el workflow
`Automatic Semantic Tagging` puede calcular el siguiente incremento semántico
al actualizar `main`:

- `fix:` incrementa el parche (`v1.0.1`).
- `feat:` incrementa la versión menor (`v1.1.0`).
- `BREAKING CHANGE:` o `!` incrementa la versión mayor (`v2.0.0`).
- `docs:`, `chore:`, `test:`, etc. no publican una nueva versión por sí solos.

Cuando hay un incremento, el workflow crea el tag y una GitHub Release. El
workflow `Validate tagged KeyOps version` valida ese tag y genera el bundle
web. Los tags existentes no se reescriben.

Para que la política sea efectiva en GitHub:

1. En **Settings → General → Pull Requests**, activa **Allow squash merging**
   y selecciona **Default to pull request title** para el mensaje del squash.
2. En **Settings → Branches → Branch protection rules**, protege `main` y
   exige que pase `Validate Conventional Commits` antes de fusionar.
3. Fusiona las Pull Requests mediante squash; no publiques directamente en
   `main` si quieres que el etiquetado sea trazable.
