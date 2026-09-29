import Image from 'next/image'
import { Brain, Compass, Megaphone, MessagesSquare } from 'lucide-react'
import logo from '@/components/legacy/Logo/logo.png'
import { cn } from '@/utilities/ui'
import { aspectoDelArea } from '../domain/areas'

const ICONOS = {
  megafono: Megaphone,
  conversacion: MessagesSquare,
  cerebro: Brain,
  brujula: Compass,
}

interface Props {
  area?: string | null
  tamano?: 'sm' | 'md'
  className?: string
}

/** El cuadro de color con su icono que distinguía cada área en el foro antiguo */
export function DistintivoDelArea({ area, tamano = 'md', className }: Props) {
  const { color, icono, relleno } = aspectoDelArea(area)
  const caja = tamano === 'sm' ? 'h-7 w-7' : 'h-10 w-10'

  if (icono === 'logo') {
    return (
      <Image
        src={logo}
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
        className={cn(caja, 'shrink-0 rounded-md bg-white object-contain', className)}
      />
    )
  }

  const Icono = ICONOS[icono]
  return (
    <span
      aria-hidden="true"
      className={cn(caja, 'inline-flex shrink-0 items-center justify-center rounded-md', className)}
      style={relleno ? { backgroundColor: color, color: '#ffffff' } : { color }}
    >
      <Icono className={tamano === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
  )
}
