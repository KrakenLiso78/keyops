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
genera el bundle correspondiente. No crea versiones automáticamente: la
decisión de publicar `v1.0.1`, `v1.0.2`, etc. queda registrada explícitamente
en GitHub.
