'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Book, User, Briefcase, FileText } from 'lucide-react'
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  alpha,
} from '@mui/material'
import { styled } from '@mui/material/styles'

const navItems = [
  {
    name: 'Inicio',
    href: '/',
    icon: Home,
  },
  {
    name: 'Catálogo',
    href: '/catalog',
    icon: Book,
  },
  {
    name: 'Casos',
    href: '/cases',
    icon: Briefcase,
  },
  {
    name: 'Documentos',
    href: '/documents',
    icon: FileText,
  },
]

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  backdropFilter: 'blur(12px)',
  '& .MuiBottomNavigationAction-root': {
    color: alpha(theme.palette.primary.contrastText, 0.7),
    '&.Mui-selected': {
      color: theme.palette.primary.contrastText,
      backgroundColor: alpha(theme.palette.common.white, 0.2),
      borderRadius: theme.spacing(1.5),
      margin: theme.spacing(0.5),
      transform: 'scale(1.05)',
    },
    '&:hover:not(.Mui-selected)': {
      color: theme.palette.primary.contrastText,
      backgroundColor: alpha(theme.palette.common.white, 0.1),
      borderRadius: theme.spacing(1.5),
      margin: theme.spacing(0.5),
    },
    '&:active:not(.Mui-selected)': {
      transform: 'scale(0.95)',
    },
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.75rem',
      fontWeight: 500,
      '&.Mui-selected': {
        fontSize: '0.75rem',
        fontWeight: 600,
      },
    },
  },
}))

const CustomBottomNavigationAction = styled(BottomNavigationAction)(
  ({ theme }) => ({
    minWidth: 0,
    flex: '1 1 0',
    padding: theme.spacing(1),
    '& .MuiSvgIcon-root': {
      fontSize: '1.375rem',
    },
  })
) as typeof BottomNavigationAction;

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: { md: 'none', xs: 'block' },
      }}
      elevation={8}
    >
      <Box sx={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <StyledBottomNavigation
          value={false} // Don't use controlled value to avoid hydration issues
          showLabels
          sx={{ height: 64, px: 1 }}
        >
          {navItems.map((item, index) => {
            const Icon = item.icon
            // Calculate active state directly from pathname without state
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <CustomBottomNavigationAction
                label={item.name}
                href={item.href}
                key={index}
                value={index}
                LinkComponent={Link}
                icon={<Icon size={22} strokeWidth={isActive ? 2.5 : 2} />}
                sx={{
                  '& .MuiBottomNavigationAction-label': {
                    fontWeight: isActive ? 600 : 500,
                  },
                  ...(isActive && {
                    color: 'primary.contrastText !important',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 1.5,
                    margin: 0.5,
                    transform: 'scale(1.05)',
                  }),
                }}
              />
            )
          })}
        </StyledBottomNavigation>
      </Box>
    </Paper>
  )
}