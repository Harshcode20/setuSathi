import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePreferences } from '../lib/PreferencesContext';

const Index = () => {
  const navigation = useNavigation();
  const { t, colors } = usePreferences();

  useEffect(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  }, [navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <Text style={[styles.text, { color: colors.mutedText }]}>{t('Loading...')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#999' },
});

export default Index;
