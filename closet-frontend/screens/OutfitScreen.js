import { View, Text, StyleSheet } from 'react-native'

export default function OutfitScreen() {
    return(
        <View style = {styles.container}>
            <Text>Outfit Screen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
})