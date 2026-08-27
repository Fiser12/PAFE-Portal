# Contrato de la suite del sistema de préstamos

Suite escrita ANTES de la implementación (spec:
`specs/pafe-portal/sistema-de-prestamos/functional-specs.md`). La
implementación debe satisfacer este contrato **sin modificar los tests**; solo
se toca un test si tiene un error demostrable contra la spec.

## Ejecución

Todo se ejecuta **dentro del devcontainer** (nunca desde el host):

```bash
docker exec pafe-portal_devcontainer-app-1 bash -c "cd /workspace && pnpm test:web"   # unit + vertical
docker exec pafe-portal_devcontainer-app-1 bash -c "cd /workspace && pnpm test"       # todo el repo
```

La BD de los verticales es el servicio `test_db` del propio devcontainer
(Postgres en tmpfs, efímero), que inyecta `TEST_DATABASE_URL`; el arnés
recrea el esquema en cada ejecución (drizzle push) y falla con un mensaje
explícito si se lanza fuera del devcontainer.

El fichero
`test/vertical/harness.smoke.test.ts` debe estar SIEMPRE en verde: valida el
arnés con el modelo actual.

## Dominio puro — `@/modules/catalog/domain/` (sin I/O, fechas inyectadas)

Fechas de calendario como `'YYYY-MM-DD'`; la conversión instante→día se hace en
**Europe/Madrid**.

- `loan-terms.ts`: `madridDateOf(d: Date): string` ·
  `tuesdayOfWeek(iso): string` (martes de la semana ISO lunes-domingo) ·
  `addDays(iso, n): string` · `computeDueDate(pickupISO, {penalized}): string`
  (+28/+14) · `extendDueDate(dueISO): string` (+14) ·
  `canRequestExtension({status, alreadyExtended, penalized, todayISO, dueISO})`
  → `{ok: true} | {ok: false, code}` (ventana: hoy ≤ due−7)
- `quota.ts`: `MAX_LIVE_RESERVATIONS = 2` ·
  `checkQuota({liveCount, isStaff, overrideReason?})` → `{ok} | {ok: false, code}`
- `lifecycle.ts`: `type ReservationStatus = 'reservada'|'activa'|'devuelta'|'perdida'|'cancelada'` ·
  `canTransition(from, to): boolean` · `LIVE_STATUSES` = reservada, activa, perdida
- `penalties.ts`: `registerLateReturn({lateCount, returnedAtISO})` →
  `{lateCount, penalizedUntilISO?}` (≥3 → +6 meses, con clamp fin de mes) ·
  `isPenalized({penalizedUntilISO?, atISO})` (fin EXCLUSIVO: at < until)
- `reminders.ts`: `REMINDER_DAYS_BEFORE = 5` ·
  `needsReminder({status, dueISO, todayISO, reminderSentForISO?})` — envía si
  activa ∧ due−5 ≤ hoy ≤ due ∧ sentFor ≠ due (comparación por día)
- `messages.ts`: `reminderEmail({title, dueISO})` → `{subject, text, eu, es}`
  (literales M1; eu con fecha `YYYY-MM-DD` + sufijo `an`; es con `DD-MM-YYYY`;
  `text` contiene eu antes que es) · `LATE_RETURN_MESSAGE` (M2) ·
  `LOSS_MESSAGE` (M3) — literales exactos de la spec
- `errors.ts`: `class LoanRuleError extends Error` con `code`:
  `'sin-permiso' | 'cupo-lleno' | 'justificacion-requerida' | 'sin-stock' |
  'reserva-duplicada' | 'transicion-invalida' | 'prorroga-ya-usada' |
  'prorroga-fuera-de-plazo' | 'prorroga-penalizado'`

## Servicios — barrel `@/modules/catalog/services`

Cáscara imperativa: reciben `{ payload, user, now }` (`now: Date`, reloj
inyectado — PROHIBIDO `new Date()` dentro), lanzan `LoanRuleError` y devuelven
el doc de reserva actualizado. Las server actions serán wrappers finos
(`getSessionUser()` + servicio + `revalidatePath`), fuera de esta suite.

- `reserveItem({payload, user, itemId, forUserId?, quotaOverrideReason?, now})`
- `cancelReservation({payload, user, reservationId})`
- `registerPickup({payload, user, reservationId, pickupDate?, now})` — normaliza
  a martes; vencimiento según penalización VIGENTE del usuario en `now`
- `requestExtension({payload, user, reservationId, now})`
- `registerReturn({payload, user, reservationId, now})` — tardía si día de
  `now` > día de `dueDate`; email M2 + contador/penalización en tardías
- `reportLoss({payload, user, reservationId, now})` — email M3, deadline +1 mes
- `registerReplacement({payload, user, reservationId, now})`
- `getAvailability({payload, itemId})` → `{total, available}` (vivas: reservada,
  activa y perdida sin `loss.replacedAt`)
- `runDueReminders({payload, now})` → `{sent}` — un email por vencimiento; si
  un envío falla, NO marca y sigue con el resto

## Campos nuevos (migración con `migrate:create`, nunca a mano)

- `reservation`: `status`, `pickupDate`, `dueDate`, `extension.requestedAt`,
  `returnedAt`, `returnedLate`, `loss.reportedAt`, `loss.replacementDeadline`,
  `loss.replacedAt`, `quotaOverrideReason`, `reminderSentFor`
- `users`: `lateReturnsCount`, `penalizedUntil` (el perdón del staff es editar
  estos campos desde el panel)
- Fechas de calendario (dueDate, replacementDeadline, penalizedUntil…):
  guardar de forma que `iso.slice(0, 10)` dé el día correcto (recomendado:
  mediodía UTC). Los tests solo comparan por día.

## Build

`pnpm build` fija `PAYLOAD_DISABLE_PUSH=true`: `next build` instancia Payload y,
con push activo, drizzle abre un prompt por cada columna nueva y el build se
cuelga sin fin.

Para validar el build hay que apuntar a una **base virgen o al día**, nunca a la
de dev: con `prodMigrations`, Payload migra al arrancar y, al ver el marcador de
push (`batch: -1`) que deja el desarrollo, pregunta si continuar y vuelve a
colgarse. Contra una base vacía aplica todas las migraciones y compila:

```bash
docker exec pafe-portal_devcontainer-test_db-1 \
  psql -U pafe_test -h 127.0.0.1 -d pafe_test -c "CREATE DATABASE build_check;"

docker exec -e DATABASE_URL="postgresql://pafe_test:pafe_test@test_db:5432/build_check" \
  -e SEED_MOCK_DATA=false pafe-portal_devcontainer-app-1 \
  bash -c "cd /workspace && pnpm build:web"
```

`SEED_MOCK_DATA=false` importa: el seed corre al arrancar Payload y un fallo suyo
aparece como `<Html> should not be imported outside of pages/_document` en /404,
que no tiene nada que ver con la causa real.

## Notas

- `catalog-item.loanDays` (30/20/15 por tipo) quedó DEROGADO por la nueva
  norma —28 días para todo— y se retiró del modelo.
- En dev el esquema se sincroniza con `push`; las migraciones son solo para
  producción.
