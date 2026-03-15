import React, { createContext, useContext, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'default' | 'success' | 'error';

const ToastContext = createContext({ show: (msg: string, type?: ToastType) => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('default');
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const show = (msg: string, type: ToastType = 'default') => {
    setMessage(msg);
    setToastType(type);
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 2500);
    });
  };

  const bgColor = toastType === 'success' ? '#16A34A' : toastType === 'error' ? '#DC2626' : '#222';
  const iconName = toastType === 'success' ? 'checkmark-circle' : toastType === 'error' ? 'close-circle' : undefined;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim, backgroundColor: bgColor }]}>
          {iconName && <Ionicons name={iconName} size={20} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 1000,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
