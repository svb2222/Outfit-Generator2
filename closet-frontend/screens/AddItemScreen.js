import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native'
import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
//const API_URL = "http://192.168.1.123:5000"
const API_URL = "https://fitcheck-u1s1.onrender.com"


export default function AddItemScreen() {
    const [photo, setPhoto] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [customLabel, setCustomLabel] = useState("")
    const [isSavingName, setIsSavingName] = useState(false)

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
            setCustomLabel("")
        }
    }

    async function pickFromLib() {
        const response = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        })
        if (!response.canceled) {
            setPhoto(response.assets[0])
            setResult(null)
            setCustomLabel("")
        }
    }

    async function handleUpload() {
        if (!photo) return
        setLoading(true)
        
        const formData = new FormData()

        // Keep photo.uri fully intact—React Native FormData needs the full URI protocol!
        formData.append("image", {
            uri: photo.uri,
            name: "photo.jpg",
            type: "image/jpeg",
        })

        try {
            const response = await fetch(`${API_URL}/wardrobe`, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            const data = await response.json()
            setResult(data.data)
            setCustomLabel(data.data.label)
            setPhoto(null)
        } catch (error) {
            Alert.alert("Upload failed", error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleRename() {
        if (!customLabel.trim()) {
            Alert.alert("Error", "Label cannot be empty")
            return
        }
        setIsSavingName(true)
        try {
            const response = await fetch(`${API_URL}/wardrobe/${result.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ label: customLabel })
            })
            const data = await response.json()
            if (response.ok) {
                setResult(data.data)
                Alert.alert("Success", "Item label updated!")
            } else {
                throw new Error(data.error || "Failed to rename")
            }
        } catch (error) {
            Alert.alert("Error", error.message)
        } finally {
            setIsSavingName(false)
        }
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1, backgroundColor: '#fff' }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0} // Accounts for navigation top bar heights
        >
            <ScrollView 
                contentContainerStyle={styles.container}
                bounces={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Add Clothing Item</Text>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={takePhoto}>
                        <Text style={styles.buttonText}>📷 Take photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={pickFromLib}>
                        <Text style={styles.buttonText}>🖼️ Library</Text>
                    </TouchableOpacity>
                </View>

                {/* Initial selection photo preview */}
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

                {/* Result box with a shrunken, optimized image layout */}
                {result && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultText}>✅ Added: {result.label}</Text>
                        
                        {/* Shrunken image preview so it doesn't push the text box below the keyboard */}
                        <Image source={{ uri: result.image }} style={styles.resultPreview} />
                        
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.textInput}
                                value={customLabel}
                                onChangeText={setCustomLabel}
                                placeholder="Edit label name"
                            />
                            <TouchableOpacity 
                                style={styles.saveButton} 
                                onPress={handleRename}
                                disabled={isSavingName}
                            >
                                {isSavingName ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
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
    // New optimized image height for the final detection stage
    resultPreview: {
        width: '100%',
        height: 200, // Explicitly bounded size so the keyboard has space to appear
        borderRadius: 10,
        marginVertical: 12,
        resizeMode: 'cover',
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 14,
        backgroundColor: '#fff',
    },
    saveButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '500',
    }
})
