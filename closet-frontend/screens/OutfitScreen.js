import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useState } from 'react'

//const API_URL = "http://192.168.1.123:5000"
const API_URL = "https://fitcheck-u1s1.onrender.com"

const OCCASIONS = ["Casual", "Formal", "Office", "Black Tie", "Cocktail"]
const WEATHER_OPTIONS = ["Sunny", "Chilly", "Rainy", "Snowy"]

export default function OutfitScreen() {
    //input
    const [occasion, setOccasion] = useState("Casual")
    const [weather, setWeather] = useState("Sunny")
    //status + result states
    const [loading, setLoading] = useState(false)
    const [outfits, setOutfits] = useState([])

    async function handleGenerate() {
        if (!occasion || !weather) {
            Alert.alert("Selection Missing", "Please select both an occasion and a weather condition.");
            return;
        }
        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/wardrobe/outfit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    occasion: occasion,
                    weather: weather
                })
            })

            const data = await response.json();
            console.log("BACKEND RETURNED THIS DATA:", data);
            if (response.ok) {
                if (data.data && data.data.outfits) {
                    setOutfits(data.data.outfits);
                } else {
                    setOutfits(data.data); // Fallback if it's already a flat array
                }
                //setOutfits(data.data)
            } else {
                throw new Error(data.error || "Failed to generate outfits")
            }
        }
        catch (error) {
            Alert.alert("Stylist Offline", error.message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Generate an Outfit</Text>
            <Text style={styles.sectionLabel}>Select Occasion</Text>
            <View style={styles.buttonRow}>
                {OCCASIONS.map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.chipButton,
                            occasion === type && styles.activeChipButton
                        ]}
                        onPress={() => setOccasion(type)}>
                        <Text style={[
                            styles.chipText,
                            occasion == type && styles.activeChipText
                        ]}>
                            {type}
                        </Text>
                    </TouchableOpacity>

                ))}
            </View>
            <Text style={styles.sectionLabel}> Select Weather</Text>
            <View style={styles.buttonRow}>
                {WEATHER_OPTIONS.map((condition) => (
                    <TouchableOpacity
                        key={condition}
                        style={[styles.chipButton, weather === condition && styles.activeChipButton]}
                        onPress={() => setWeather(condition)}>
                        <Text style={[styles.chipText, weather === condition && styles.activeChipText]}>
                            {condition}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerate}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.generateButtonText}>Generate Outfits</Text>
                )}
            </TouchableOpacity>

            {Array.isArray(outfits) && outfits.length > 0 && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>Your Recommendations ✨</Text>

                    {outfits.map((outfit, index) => (
                        <View key={index} style={styles.outfitCard}>
                            {/* Dynamically display the specific keys from your model output */}
                            <Text style={styles.outfitHeader}>
                                {outfit.outfit_name || `Option ${index + 1}`}
                            </Text>
                            <Text style={styles.outfitText}>
                                {outfit.description || "No description provided."}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allows buttons to wrap gracefully to a second line if needed
        gap: 8,
        marginBottom: 16,
    },
    chipButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 0.5,
        borderColor: '#ddd',
        borderRadius: 20, // Circular pill shape
        backgroundColor: '#fff',
    },
    activeChipButton: {
        borderColor: '#000',
        borderWidth: 1.5,
    },
    chipText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '500',
    },
    activeChipText: {
        color: '#000',
        fontWeight: '600',
    },
    generateButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 24,
    },
    generateButtonText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 15,
    },
    resultsContainer: {
        marginTop: 8,
        paddingBottom: 40,
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    outfitCard: {
        padding: 14,
        borderWidth: 0.5,
        borderColor: '#eee',
        borderRadius: 10,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    outfitHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    outfitText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
})