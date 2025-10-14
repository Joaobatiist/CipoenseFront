import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;

export const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1c358eff',
    paddingVertical: isDesktop ? 10 : 10,
    paddingHorizontal: isDesktop ? 24 : 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: isDesktop ? '60%' : '80%', // ✅ adapta largura
    maxWidth: 400,
    alignSelf: 'center',
    textAlign: 'center', // ✅ substitui margin: 'auto'
    
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: isDesktop ? 17 : 16, // ✅ texto maior em telas grandes
    textAlign: 'center',
  },

  icon: {
    marginRight: 8,
    color: '#ffffff',
  },
});
