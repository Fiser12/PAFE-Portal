'use client'

import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTextos } from '@/components/IdiomaProvider'
import { rellenar } from '@/core/textos'
import { AREAS_DEL_TABLON } from '../domain/areas'
import type { AccionEnBloque, Moderacion } from '../domain/moderacion'
import { moderarEnBloque } from '../actions/moderacion'

interface Seleccion {
  elegidas: ReadonlySet<number>
  alternar: (id: number) => void
}

const SeleccionDeTemas = createContext<Seleccion | null>(null)

interface Props {
  ids: number[]
  area: string
  archivadas: boolean
  puede: Moderacion
  children: ReactNode
}

export function ModeracionEnLista({ ids, area, archivadas, puede, children }: Props) {
  const t = useTextos()
  const router = useRouter()
  const [elegidas, setElegidas] = useState<ReadonlySet<number>>(new Set())
  const [pendiente, empezar] = useTransition()
  const [fallo, setFallo] = useState(false)

  if (!puede.archivar) return children

  const alternar = (id: number) =>
    setElegidas((antes) => {
      const despues = new Set(antes)
      if (!despues.delete(id)) despues.add(id)
      return despues
    })
  const todas = ids.length > 0 && ids.every((id) => elegidas.has(id))
  const ninguna = elegidas.size === 0

  const aplicar = (accion: AccionEnBloque) =>
    empezar(async () => {
      const { ok } = await moderarEnBloque([...elegidas], accion)
      setFallo(!ok)
      if (!ok) return
      setElegidas(new Set())
      router.refresh()
    })

  return (
    <SeleccionDeTemas.Provider value={{ elegidas, alternar }}>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={todas}
            onCheckedChange={() => setElegidas(todas ? new Set() : new Set(ids))}
            disabled={ids.length === 0 || pendiente}
          />
          {t.foroSeleccionarTodas}
        </label>
        <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {rellenar(t.foroSeleccionadas, { n: String(elegidas.size) })}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={ninguna || pendiente}
            onClick={() => aplicar({ tipo: archivadas ? 'desarchivar' : 'archivar' })}
          >
            {archivadas ? (
              <ArchiveRestore className="mr-1 h-4 w-4" aria-hidden="true" />
            ) : (
              <Archive className="mr-1 h-4 w-4" aria-hidden="true" />
            )}
            {archivadas ? t.foroDesarchivar : t.foroArchivar}
          </Button>
          {puede.mover && (
            <Select
              value=""
              disabled={ninguna || pendiente}
              onValueChange={(destino) => aplicar({ tipo: 'mover', area: destino })}
            >
              <SelectTrigger className="h-8 w-56" aria-label={t.foroMoverA}>
                <SelectValue placeholder={t.foroMoverA} />
              </SelectTrigger>
              <SelectContent>
                {AREAS_DEL_TABLON.filter((opcion) => opcion.value !== area).map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {fallo && (
          <p role="alert" className="w-full text-sm text-destructive">
            {t.foroErrorModerar}
          </p>
        )}
      </div>
      {children}
    </SeleccionDeTemas.Provider>
  )
}

export function CasillaDeTema({ id, titulo }: { id: number; titulo: string }) {
  const t = useTextos()
  const seleccion = useContext(SeleccionDeTemas)
  if (!seleccion) return null
  return (
    <label className="flex shrink-0 cursor-pointer items-center self-stretch pl-4 sm:pl-5">
      <Checkbox
        checked={seleccion.elegidas.has(id)}
        onCheckedChange={() => seleccion.alternar(id)}
        aria-label={rellenar(t.foroSeleccionar, { titulo })}
      />
    </label>
  )
}
