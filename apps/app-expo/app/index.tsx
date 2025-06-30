import { useEffect } from 'react'
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { useCatalog } from '../lib/graphql/hooks/useCatalog'
import { useAuth } from '../lib/auth/useAuth'

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff'
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
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

export default function Index() {
    const { items, loading, error, fetchItems } = useCatalog()
    const { signOut } = useAuth()

    useEffect(() => {
        fetchItems()
    }, [])

    if (loading || error) {
        return (
            <View style={styles.container}>
                <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
                    <TouchableOpacity onPress={signOut} style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                        <Text style={{ color: 'white', fontWeight: '600' }}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
                {loading && <Text>Cargando catálogo...</Text>}
                {error && <Text>Error: {error.message}</Text>}
            </View>
        )
    }
    console.error(items)
    return (
        <View style={styles.container}>
            <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
                <TouchableOpacity onPress={signOut} style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        { item.cover &&
                        <Image
                            source={{ uri: item.cover.sizes.thumbnail.url }}
                            style={styles.thumbnail}
                        /> }
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