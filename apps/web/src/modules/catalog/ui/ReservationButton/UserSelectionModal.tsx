'use client'

import type { User } from '@/payload-types'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUsersBySearchTerm } from '../../actions'
import { useTextos } from '@/components/IdiomaProvider'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSelect: (userId: string) => void
}

export function UserSelectionModal({ isOpen, onClose, onSelect }: Props) {
  const t = useTextos()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setIsLoading(true)
                const usersList = await getUsersBySearchTerm({ searchTerm })
                setUsers(usersList)
            } catch (error) {
                console.error(t.reservaErrorUsuarios, error)
            } finally {
                setIsLoading(false)
            }
        }

        const timeoutId = setTimeout(() => {
            if (isOpen) {
                loadUsers()
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [isOpen, searchTerm])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{t.reservaSeleccionarUsuario}</h2>
                    <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t.cerrar}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <Input
                    type="text"
                    placeholder={t.reservaBuscarUsuario}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />

                {isLoading ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                        {t.reservaCargandoUsuarios}
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => onSelect(String(user.id))}
                                className="mb-1 w-full rounded-md p-2 text-left transition-colors hover:bg-accent"
                            >
                                <div className="font-medium">{user.email}</div>
                                {user.name && (
                                    <div className="text-sm text-muted-foreground">{user.name}</div>
                                )}
                            </button>
                        ))}
                        {users.length === 0 && (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                {t.reservaSinUsuarios}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
} 