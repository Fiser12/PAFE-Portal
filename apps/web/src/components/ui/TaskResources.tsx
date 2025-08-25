'use client'

import { 
  Box, 
  Chip, 
  IconButton, 
  Tooltip,
  Typography 
} from '@mui/material'
import { 
  FileText, 
  ExternalLink, 
  Download, 
  Video,
  Book,
  Link as LinkIcon
} from 'lucide-react'
import type { Task } from '@/payload-types'

interface TaskResourcesProps {
  resources: Task['resources']
}

const getResourceIcon = (relationTo: string, resourceType?: string) => {
  switch (relationTo) {
    case 'pdf':
      return <FileText size={16} />
    case 'forms':
      return <Book size={16} />
    case 'external-resources':
      switch (resourceType) {
        case 'video':
          return <Video size={16} />
        case 'web_link':
          return <LinkIcon size={16} />
        default:
          return <ExternalLink size={16} />
      }
    default:
      return <ExternalLink size={16} />
  }
}

const getResourceLabel = (relationTo: string) => {
  switch (relationTo) {
    case 'pdf':
      return 'PDF'
    case 'forms':
      return 'Formulario'
    case 'external-resources':
      return 'Recurso'
    default:
      return 'Recurso'
  }
}

const getResourceUrl = (resource: any, relationTo: string) => {
  switch (relationTo) {
    case 'pdf':
      return resource.url || resource.filename ? `/api/media/${resource.filename}` : null
    case 'forms':
      return `/forms/${resource.id}`
    case 'external-resources':
      return resource.url
    default:
      return null
  }
}

export function TaskResources({ resources }: TaskResourcesProps) {
  if (!resources || resources.length === 0) {
    return null
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Recursos:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {resources.map((resource) => {
          if (!resource || typeof resource !== 'object') return null
          
          const relationTo = resource.relationTo
          const resourceData = resource.value as any
          
          if (!resourceData || typeof resourceData !== 'object') return null
          
          const title = resourceData.title || resourceData.name || 'Recurso sin título'
          const icon = getResourceIcon(relationTo, resourceData.type)
          const label = getResourceLabel(relationTo)
          const url = getResourceUrl(resourceData, relationTo)
          
          return (
            <Tooltip key={`${relationTo}-${resourceData.id}`} title={title} arrow>
              <Chip
                icon={icon}
                label={`${label}: ${title.length > 20 ? title.substring(0, 20) + '...' : title}`}
                variant="outlined"
                size="small"
                clickable={!!url}
                onClick={() => {
                  if (url) {
                    if (relationTo === 'external-resources') {
                      window.open(url, '_blank')
                    } else {
                      window.open(url, '_blank')
                    }
                  }
                }}
                sx={{
                  fontSize: '0.7rem',
                  height: 24,
                  borderRadius: 1,
                  '& .MuiChip-icon': {
                    fontSize: '16px'
                  }
                }}
              />
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}