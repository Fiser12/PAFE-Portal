import { useEffect } from 'react'
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useCatalog } from '../../lib/graphql/hooks/useCatalog'
import { useAuth } from '../../lib/auth/useAuth'

export default function CatalogScreen() {
    const { items, loading, error, fetchItems } = useCatalog()
    const { signOut, session } = useAuth()

    useEffect(() => {
        fetchItems()
    }, [])

    const handleSignOut = async () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar sesión', onPress: signOut, style: 'destructive' }
            ]
        )
    }

    if (loading || error) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
                        <Text style={styles.signOutText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
                {loading && <Text>Cargando catálogo...</Text>}
                {error && <Text>Error: {error.message}</Text>}
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    {session?.user?.image && (
                        <Image source={{ uri: session.user.image }} style={styles.avatar} />
                    )}
                    <View style={styles.userDetails}>
                        <Text style={styles.welcomeText}>Hola, {session?.user?.name || 'Usuario'}</Text>
                        <Text style={styles.emailText}>{session?.user?.email}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image
                            source={{ uri: item.cover.sizes.thumbnail.url }}
                            style={styles.thumbnail}
                        />
                        <View style={styles.cardContent}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.quantity}>Disponibles: {item.quantity}</Text>
                            <View style={styles.categories}>
                                {item.categories.map((category) => (
                                    <Text key={category.id} style={styles.category}>
                                        {category.singular_name}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    </View>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    emailText: {
        fontSize: 14,
        color: '#666',
    },
    signOutButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#dc3545',
        borderRadius: 8,
    },
    signOutText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 4
    },
    cardContent: {
        flex: 1,
        marginLeft: 12
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4
    },
    quantity: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4
    },
    categories: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    category: {
        fontSize: 12,
        color: '#007AFF',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginRight: 4,
        marginBottom: 4
    }
})

