'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTextos } from '@/components/IdiomaProvider'
import { cambiarArchivoDeNoticia } from '../actions/moderacion'

interface Props {
  noticiaId: number
  archivada: boolean
  puede: { archivar: boolean; editar: boolean }
}

export function ModeracionDeNoticia({ noticiaId, archivada, puede }: Props) {
  const t = useTextos()
  const router = useRouter()
  const [pendiente, empezar] = useTransition()
  const [fallo, setFallo] = useState(false)

  if (!puede.archivar && !puede.editar) return null

  const cambiarArchivo = () =>
    empezar(async () => {
      const { ok } = await cambiarArchivoDeNoticia(noticiaId, !archivada)
      setFallo(!ok)
      if (ok) router.refresh()
    })

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {puede.editar && (
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/collections/noticia/${noticiaId}`}>
            <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
            {t.foroEditar}
          </Link>
        </Button>
      )}
      {puede.archivar && (
        <Button variant="outline" size="sm" onClick={cambiarArchivo} disabled={pendiente}>
          {archivada ? (
            <ArchiveRestore className="mr-1 h-4 w-4" aria-hidden="true" />
          ) : (
            <Archive className="mr-1 h-4 w-4" aria-hidden="true" />
          )}
          {archivada ? t.foroDesarchivar : t.foroArchivar}
        </Button>
      )}
      {fallo && (
        <span role="alert" className="text-sm text-destructive">
          {t.foroErrorModerar}
        </span>
      )}
    </div>
  )
}
