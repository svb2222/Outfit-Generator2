import { View, Text, StyleSheet} from 'react-native'

export default function WardrobeScreen(){
    return (
        <View style = {styles.container}>
            <Text>Wardrobe Screen</Text>
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