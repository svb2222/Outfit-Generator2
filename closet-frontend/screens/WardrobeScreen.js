import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'

//const API_URL = "http://192.168.1.123:5000"
const API_URL = "https://fitcheck-u1s1.onrender.com"

// Simplified keywords matching what your clean_label backend generates
function getCategory(label) {
    if (!label || typeof label !== 'string') return "Other"

    const lowerLabel = label.toLowerCase()

    // Check for Tops keywords
    if (
        lowerLabel.includes("sleeve") ||
        lowerLabel.includes("shirt") ||
        lowerLabel.includes("sweatshirt") ||
        lowerLabel.includes("sweater") ||
        lowerLabel.includes("jacket") ||
        lowerLabel.includes("hoodie") ||
        lowerLabel.includes("cardigan")
    ) {
        return "Tops"
    }

    // Check for Bottoms keywords
    if (
        lowerLabel.includes("pants") ||
        lowerLabel.includes("shorts") ||
        lowerLabel.includes("denim") ||
        lowerLabel.includes("leggings") ||
        lowerLabel.includes("jeans") ||
        lowerLabel.includes("sweatpants")

    ) {
        return "Bottoms"
    }

    return "Other"
}

function groupByCategory(items) {
    const groups = { "Tops": [], "Bottoms": [], "Other": [] }
    items.forEach(item => {
        const cat = getCategory(item.label)
        groups[cat].push(item)
    })

    // Only return categories that actually have items in them
    return Object.entries(groups).filter(([_, items]) => items.length > 0)
}

export default function WardrobeScreen() {
    //state variables
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    //refresh whenever user navigates back to this tab
    useFocusEffect(
        useCallback(() => {
            fetchWardrobe()
        }, []))

    async function fetchWardrobe() {
        try {
            const response = await fetch(`${API_URL}/wardrobe`)
            const data = await response.json()
            setItems(data.data)
        } catch (error) {
            Alert.alert("Error", "Could not load wardrobe")
        } finally {
            setLoading(false)
        }
    }

    async function deleteItem(id) {
        try {
            await fetch(`${API_URL}/wardrobe/${id}`, {
                method: "DELETE"
            })
            setItems(items.filter(item => item.id != id))
        } catch (error) {
            Alert.alert("Error", "Could not delete item")
        }
    }

    function confirmDelete(id) {
        Alert.alert("Remove Item",
            "Are you sure you want to remove this item from your wardrobe?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => deleteItem(id) }
            ]
        )
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        )
    }

    if (items.length == 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Your wardrobe is empty!</Text>
                <Text style={styles.emptySubtext}>Tap Add to upload your first piece!</Text>
            </View>
        )
    }

    const grouped = groupByCategory(items)

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>My Wardrobe</Text>
            <Text style={styles.subtitle}>{items.length} items</Text>
            {grouped.map(([category, catItems]) => (
                <View key={category}>
                    <Text style={styles.categoryLabel}>{category}</Text>
                    <FlatList
                        data={catItems}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.row}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.card}
                                onLongPress={() => confirmDelete(item.id)}
                            >
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: item.image }} style={styles.image} />

                                    {/* 1. Floating ID Badge right over the image */}
                                    <View style={styles.idBadge}>
                                        <Text style={styles.idText}>#{item.id}</Text>
                                    </View>
                                </View>

                                <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
                            </TouchableOpacity>
                        )}
                    
                    />
                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: '#888',
        marginBottom: 20,
    },
    categoryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 8,
    },
    row: {
        paddingBottom: 16,
        gap: 10,
    },
    card: {
        width: 110,
        borderWidth: 0.5,
        borderColor: '#eee',
        borderRadius: 10,
        overflow: 'hidden',
    },
    image: {
        width: 110,
        height: 110,
    },
    label: {
        fontSize: 11,
        padding: 6,
        color: '#333',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
    },
})

