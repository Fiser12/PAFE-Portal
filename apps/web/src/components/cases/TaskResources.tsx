'use client'

import { FileText, ExternalLink, Video, Book, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Task } from '@/payload-types'

interface TaskResourcesProps {
  resources: Task['resources']
}

const getResourceIcon = (relationTo: string, resourceType?: string) => {
  switch (relationTo) {
    case 'files':
      return <FileText className="h-3.5 w-3.5" />
    case 'forms':
      return <Book className="h-3.5 w-3.5" />
    case 'external-resources':
      switch (resourceType) {
        case 'video':
          return <Video className="h-3.5 w-3.5" />
        case 'web_link':
          return <LinkIcon className="h-3.5 w-3.5" />
        default:
          return <ExternalLink className="h-3.5 w-3.5" />
      }
    default:
      return <ExternalLink className="h-3.5 w-3.5" />
  }
}

const getResourceLabel = (relationTo: string) => {
  switch (relationTo) {
    case 'files':
      return 'Material descargable'
    case 'forms':
      return 'Formulario'
    case 'external-resources':
      return 'Recurso'
    default:
      return 'Recurso'
  }
}

const getResourceUrl = (
  resource: { url?: string | null; id?: number | string },
  relationTo: string,
): string | null => {
  switch (relationTo) {
    case 'files':
      return resource.url ?? null
    case 'forms':
      return `/forms/${resource.id}`
    case 'external-resources':
      return resource.url ?? null
    default:
      return null
  }
}

export function TaskResources({ resources }: TaskResourcesProps) {
  if (!resources || resources.length === 0) {
    return null
  }

  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">Recursos:</p>
      <div className="flex flex-wrap gap-1.5">
        {resources.map((resource) => {
          if (!resource || typeof resource !== 'object') return null

          const relationTo = resource.relationTo
          const resourceData = resource.value as {
            id?: number | string
            title?: string
            name?: string
            type?: string
            url?: string | null
          }

          if (!resourceData || typeof resourceData !== 'object') return null

          const title = resourceData.title || resourceData.name || 'Recurso sin título'
          const icon = getResourceIcon(relationTo, resourceData.type)
          const label = getResourceLabel(relationTo)
          const url = getResourceUrl(resourceData, relationTo)
          const text = `${label}: ${title.length > 20 ? `${title.substring(0, 20)}…` : title}`

          if (url) {
            return (
              <a
                key={`${relationTo}-${resourceData.id}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={title}
              >
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {icon}
                  {text}
                </Badge>
              </a>
            )
          }

          return (
            <Badge key={`${relationTo}-${resourceData.id}`} variant="outline" title={title}>
              {icon}
              {text}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
