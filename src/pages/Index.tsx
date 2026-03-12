import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Index = () => {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#999' },
});

export default Index;
