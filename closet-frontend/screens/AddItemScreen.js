import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
const API_URL = "http://192.168.1.123:5000"

export default function AddItemScreen() {
    //states
    const [photo, setPhoto] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    //open camera
    async function takePhoto() {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
            Alert.alert("Permission needed", "Camera permission is required")
            return
        }
        const response = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        })
        if (!response.canceled) {
            setPhoto(response.assets[0])
            setResult(null)
        }
    }

    //open photo library
    async function pickFromLib() {
        const response = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        })
        if (!response.canceled) {
            setPhoto(response.assets[0])
            setResult(null)
        }
    }

    async function handleUpload() {
        if (!photo) return
        setLoading(true)
        const formData = new FormData()
        formData.append("image", {
            uri: photo.uri,
            name: "photo.jpg",
            type: "image/jpeg",
        })

        try {
            const response = await fetch(`${API_URL}/wardrobe/`, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            const data = await response.json()
            setResult(data.data)
            setPhoto(null)

        } catch (error) {
            Alert.alert("Upload failed", error.message)
        } finally {
            setLoading(false)
        }
    }

    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add clothing item</Text>

            {/* Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={takePhoto}>
                    <Text style={styles.buttonText}>📷 Take photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={pickFromLib}>
                    <Text style={styles.buttonText}>🖼️ Library</Text>
                </TouchableOpacity>
            </View>

            {/* Photo preview */}
            {photo && (
                <Image source={{ uri: photo.uri }} style={styles.preview} />
            )}

            {/* Upload button */}
            {photo && !loading && (
                <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                    <Text style={styles.uploadButtonText}>Add to wardrobe</Text>
                </TouchableOpacity>
            )}

            {/* Loading spinner */}
            {loading && (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            )}

            {/* Result after upload */}
            {result && (
                <View style={styles.resultBox}>
                    <Text style={styles.resultText}>✅ Added: {result.label}</Text>
                    <Image source={{ uri: result.image }} style={styles.preview} />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        marginBottom: 20,
        marginTop: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    button: {
        flex: 1,
        padding: 14,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    uploadButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    uploadButtonText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 15,
    },
    preview: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 10,
        marginVertical: 16,
    },
    resultBox: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
    },
    resultText: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
})

