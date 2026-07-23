# Política de evolución de plugins de pregunta

Los cuestionarios se guardan como JSON con un manifiesto `questionPlugins` que
fija la versión de cada tipo de pregunta usado. Sin una política, subir la
versión de cualquier plugin invalidaría todos los cuestionarios ya guardados.
Este documento define cómo evolucionan los plugins sin romper lo persistido.

## Garantías

- **Migración determinista y propiedad del framework.** `parseSchema` migra las
  definiciones persistidas a la versión instalada antes de validarlas, mediante
  `upcastSchema` (`flowgraph-core`). El plugin solo aporta pasos puros; nunca
  ejecuta la migración por su cuenta.
- **Los pasos de migración son puros.** Un `QuestionUpcaster` transforma el
  objeto crudo de la versión `from` a la forma de `to`. No hace I/O, no toca UI,
  no accede a red ni almacenamiento, y preserva los campos que no cambia.
- **La validación tiene la última palabra.** Tras migrar, el esquema Zod actual
  del plugin valida el resultado. Un upcaster que produzca una forma inválida se
  rechaza de forma determinista.
- **Migración al guardar.** Al abrir y guardar un cuestionario antiguo, el hook
  `beforeChange` reescribe el `schema` migrado y el manifiesto a las versiones
  instaladas, normalizando el documento.

## Reglas de compatibilidad

Para una pregunta persistida con versión `declared` frente a la instalada
`installed`:

| Caso | Resultado |
|------|-----------|
| `declared === installed` | Se acepta sin cambios. |
| Existe una cadena de `upcasters` de `declared` a `installed` | Se migra encadenando los pasos. |
| Mismo *major* semver, sin cadena | Se acepta tal cual (cambios aditivos/menores mantienen la forma); el esquema actual valida. |
| *Major* distinto sin cadena, o `declared` más nueva que `installed` | **Incompatible**: se rechaza con `invalid-wire-value`. |
| Versión no-semver que no coincide exactamente | Incompatible. |

Corolario de versionado (semver):

- **Patch/minor** — cambios aditivos u opcionales que **no** cambian la forma
  persistida. No requieren upcaster; el passthrough de mismo-major los cubre.
- **Major** — cualquier cambio que rompa la forma persistida (renombrar, quitar
  o volver obligatorio un campo). **Requiere** un upcaster de la versión anterior
  a la nueva y un fixture de compatibilidad.

## Cómo publicar una nueva versión de un plugin

1. Cambia el `questionSchema` y sube `version`. Elige patch/minor o major según
   la tabla anterior.
2. Si es major, añade un `QuestionUpcaster` de la versión anterior a la nueva
   que transforme el objeto crudo persistido a la forma nueva, preservando el
   resto de campos.
3. Añade un **fixture de compatibilidad** (ver
   `packages/flowgraph-core/test/unit/upcast-schema.test.ts` como referencia)
   que parta de un cuestionario guardado con la versión anterior y verifique que
   `parseSchema` lo migra y lo acepta. Esto es obligatorio antes de publicar una
   segunda versión persistida de cualquier plugin.
4. Mantén los upcasters como una cadena continua (`from`→`to` encadenados) desde
   la versión persistida más antigua que quieras seguir soportando.

## Efecto en sesiones en curso

Migrar cambia la forma de la pregunta y, por tanto, el `schemaHash`. Una sesión
en curso guardada (localStorage o ejecución sin terminar) queda invalidada al
detectar el cambio de hash y el usuario reinicia. Es el comportamiento correcto:
es preferible reiniciar a reproducir eventos contra una definición distinta.
