'use client'

import type { CatalogItem, Media } from '@/payload-types'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box
} from '@mui/material'

interface Props {
    item: CatalogItem
}

export function CatalogItemCard({ item }: Props) {
    const router = useRouter()
    const cover = typeof item.cover === 'object' && item.cover ? item.cover as Media : undefined
    const reserved = item.reservations?.docs?.length ?? 0
    const total = item.quantity ?? 0
    const available = Math.max(total - reserved, 0)

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.15)',
                },
                '&:active': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.15)',
                }
            }}
            onClick={() => router.push(`/catalog/${item.id}`)}
        >
            {/* Book Cover */}
            {cover?.url && (
                <Box sx={{ 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                }}>
                    <CardMedia
                        component="img"
                        sx={{
                            height: 280,
                            width: 'auto',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            borderRadius: 1
                        }}
                        image={cover.url}
                        alt={cover.alt ?? item.title}
                        title={cover.alt ?? item.title}
                    />
                </Box>
            )}
            
            {/* Book Info */}
            <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                p: 2,
                '&:last-child': { pb: 2 }
            }}>
                <Typography 
                    variant="h6" 
                    component="h3" 
                    gutterBottom
                    sx={{ 
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        lineHeight: 1.3,
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        textAlign: 'center'
                    }}
                    title={item.title}
                >
                    {item.title}
                </Typography>
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                    <Chip
                        label={`${available} disponibles de ${total}`}
                        size="small"
                        color={available > 0 ? 'success' : 'error'}
                        variant="filled"
                        sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    )
} 