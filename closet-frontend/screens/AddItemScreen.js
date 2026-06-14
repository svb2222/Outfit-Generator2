import { View, Text, StyleSheet} from 'react-native'

export default function AddItemScreen() {
    return (
        <View style = {styles.container}>
            <Text>Add Item Screen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems:'center',
        justifyContent: 'center',
    },
})