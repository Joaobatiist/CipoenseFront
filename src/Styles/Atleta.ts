import { StyleSheet, Platform, StatusBar, Dimensions } from "react-native";

// 🧭 Breakpoints
const { width } = Dimensions.get("window");
const isTablet = width >= 768;
const isDesktop = width >= 1250;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
  },

  safeArea: {
    flex: 1,
  },

  // =============================
  // 📌 HEADER
  // =============================
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c348e",
    paddingVertical: 10,
    paddingHorizontal: isDesktop ? 30 : 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5c228",
    justifyContent: "space-between",
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight,
      },
      web: {
        position: "sticky",
        top: 0,
        zIndex: 10,
      },
    }),
  },

  titleheader: {
    color: "#fcfcfcff",
    fontWeight: "bold",
    fontSize: isDesktop ? 26 : isTablet ? 22 : 20,
    textAlign: "center",
    flex: 1,
  },

  btnVoltar: {
    padding: 10,
  },

  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c348e",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },

  dateText: {
    color: "#fff",
    fontSize: isDesktop ? 18 : 16,
    marginLeft: 5,
  },
  menuButton: { padding: 10, },

  // =============================
  // 📌 MENU LATERAL (SIDEBAR)
  // =============================
  sidebar: {
    opacity: 0.95,
    position: "absolute",
    top: 0,
    left: 0,
    width: isDesktop ? 300 : 250,
    height: "100%",
    backgroundColor: "#1c348e",
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 1000,
  },

  closeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
  },

  logo: {
    fontSize: isDesktop ? 26 : 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    marginTop: 40,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5c228",
  },

  navIcon: {
    marginRight: 10,
  },

  navText: {
    fontSize: isDesktop ? 18 : 16,
    color: "#fff",
  },

  // =============================
  // 📌 TEXTOS / TÍTULOS
  // =============================
  title: {
    marginLeft: 10,
    color: "#fcfcfcff",
    fontWeight: "bold",
    fontSize: isDesktop ? 16 : 12,
    top: -5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5c228",
  },

  selected: {
    color: "#fff",
    fontSize: isDesktop ? 18 : 16,
    marginTop: 42,
  },

  buttonText: {
    color: "#fff",
    fontSize: isDesktop ? 16 : 14,
    marginLeft: 5,
  },

  hideButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5a6268",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },

  // =============================
  // 📌 CARDS E LISTAS
  // =============================
  eventListContainer: {
    paddingVertical: 10,
  },

  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: isDesktop ? 20 : 15,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#e5c228",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  eventDate: {
    fontSize: isDesktop ? 18 : 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#212121",
  },

  eventDescription: {
    fontSize: isDesktop ? 16 : 15,
    fontWeight: "bold",
    color: "#050505ff",
    marginBottom: 5,
  },

  eventDetail: {
    fontSize: isDesktop ? 15 : 14,
    color: "#424242",
    marginBottom: 3,
  },

  eventActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },

  // =============================
  // 📌 COMUNICADOS
  // =============================
  comunicadoCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: isDesktop ? 20 : 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  comunicadoAssunto: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },

  comunicadoData: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    textAlign: "right",
  },

  comunicadoMensagem: {
    fontSize: isDesktop ? 16 : 15,
    lineHeight: 22,
    color: "#555",
    marginBottom: 10,
  },

  comunicadoDestinatarios: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },

  // =============================
  // 📌 ESTADOS E MENSAGENS
  // =============================
  emptyMessage: {
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
    fontSize: isDesktop ? 16 : 14,
  },

  errorMessage: {
    textAlign: "center",
    marginTop: 20,
    fontSize: isDesktop ? 18 : 16,
    color: "red",
    fontWeight: "bold",
  },

  // =============================
  // 📌 SCROLL E SEÇÕES
  // =============================
  scrollContainer: {
    flex: 1,
  },

  section: {
    padding: isDesktop ? 24 : 20,
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,

     maxWidth: isDesktop ? 900 : isTablet ? 700 : "100%",
  width: "100%",
  alignSelf: "center",
  },

  sectionTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
});
