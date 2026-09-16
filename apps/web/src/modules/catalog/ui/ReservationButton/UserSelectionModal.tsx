'use client'

import type { User } from '@/payload-types'
import { useEffect, useState } from 'react'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t.reservaSeleccionarUsuario}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <input
                    type="text"
                    placeholder={t.reservaBuscarUsuario}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-lg mb-4"
                />

                {isLoading ? (
                    <div className="text-center py-4">{t.reservaCargandoUsuarios}</div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => onSelect(String(user.id))}
                                className="w-full text-left p-2 hover:bg-gray-100 rounded-lg mb-1"
                            >
                                <div className="font-medium">{user.email}</div>
                                {user.name && (
                                    <div className="text-sm text-gray-600">{user.name}</div>
                                )}
                            </button>
                        ))}
                        {users.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                                {t.reservaSinUsuarios}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
} 