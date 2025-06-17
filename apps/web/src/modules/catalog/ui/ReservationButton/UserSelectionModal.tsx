'use client'

import type { User } from '@/payload-types'
import { useEffect, useState } from 'react'
import { getUsersBySearchTerm } from '../../actions'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSelect: (userId: string) => void
}

export function UserSelectionModal({ isOpen, onClose, onSelect }: Props) {
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
                console.error('Error al cargar usuarios:', error)
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
                    <h2 className="text-xl font-bold">Seleccionar Usuario</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-lg mb-4"
                />

                {isLoading ? (
                    <div className="text-center py-4">Cargando usuarios...</div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => onSelect(user.id)}
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
                                No se encontraron usuarios
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
} 