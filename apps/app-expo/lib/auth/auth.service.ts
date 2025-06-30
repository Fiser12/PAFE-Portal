import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  expires: string;
}

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

// En desarrollo usa localhost:8081 para que Metro proxy redirija a localhost:3000
const API_BASE_URL = __DEV__
  ? "http://localhost:8081"
  : "https://tu-dominio.com";

// Abstracción para storage que funcione en web y móvil
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

class AuthService {
  async signInWithGoogle() {
    try {
      const redirectUrl = Linking.createURL("/api/auth-callback");
      // WebBrowser NECESITA URL ABSOLUTA - Metro proxy redirigirá /api/auth a localhost:3000
      const authUrl = `${API_BASE_URL}/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`;

      const width = 600,
        height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;

      // Abrimos una ventana popup
      const popup = window.open(
        authUrl,
        "google-login",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      // Escuchamos mensajes desde la ventana popup
      window.addEventListener(
        "message",
        (event) => {
          // Nos aseguramos de que el mensaje viene de nuestro origen por seguridad
          if (event.origin !== window.location.origin) {
            return;
          }

          const { token, error } = event.data;

          if (token) {
            (async () => {
              await storage.setItem("jwt_token", token);
              window.dispatchEvent(new Event("auth-token-set"));
            })();
            popup?.close();
          }
          if (error) {
            console.error("Error en el login:", error);
            popup?.close();
          }
        },
        { once: true }
      ); // El listener se ejecuta solo una vez
    } catch (error) {
      console.error("Error en signInWithGoogle:", error);
      throw error;
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const sessionString = await storage.getItem("auth_session");
      if (!sessionString) return null;

      const session: AuthSession = JSON.parse(sessionString);

      // Verificar si la sesión ha expirado
      if (new Date(session.expires) < new Date()) {
        await this.signOut();
        return null;
      }

      return session;
    } catch (error) {
      console.error("Error al obtener sesión:", error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await storage.removeItem("auth_session");
      await storage.removeItem("jwt_token");

      // limpiar cookies en web
      if (Platform.OS === "web") {
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        });
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }

  private async storeSession(session: AuthSession): Promise<void> {
    try {
      await storage.setItem("auth_session", JSON.stringify(session));
    } catch (error) {
      console.error("Error al guardar sesión:", error);
      throw error;
    }
  }

  async refreshSession(): Promise<AuthSession | null> {
    try {
      return await this.getSession();
    } catch (error) {
      console.error("Error al refrescar sesión:", error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    return await storage.getItem("jwt_token");
  }
}

export const authService = new AuthService();
