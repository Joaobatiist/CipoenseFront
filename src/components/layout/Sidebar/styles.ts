import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 260,
    height: '100%',
    backgroundColor: '#1c348e',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    padding: 5,
  },
  logo: {
    width: "80%",
    height: 90,
    borderRadius: 55,
    marginLeft: 20,
  },
  title: {
    marginLeft: 10,
    alignItems: 'center',
    color: '#fcfcfcff',
    fontWeight: 'bold',
    fontSize: 12,
    top: -5,
    borderBottomWidth: 1,
    borderBottomRightRadius: 24,
    borderBottomColor: '#e5c228',
  },
  scrollContainer: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomRightRadius: 6,
    borderBottomColor: '#e5c228',
  },
  navIcon: {
    marginRight: 10,
  },
  navText: {
    fontSize: 16,
    color: '#fff',
  },
});
