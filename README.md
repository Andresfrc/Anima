# Aníma 🌌

Aplicación de acompañamiento emocional diseñada para brindar calma y bienestar.

## 🚀 Cómo ejecutar el proyecto

Si quieres correr este proyecto en otra computadora, sigue estos pasos:

### 1. Requisitos Previos
- Tener instalado **Node.js** (versión LTS recomendada).
- Tener instalado **Git**.
- (Opcional) Tener instalado **pnpm** para una instalación más rápida.

### 2. Clonar el repositorio
Abre tu terminal y ejecuta:

```bash
git clone https://github.com/Andresfrc/Anima.git
cd Anima
cd AnimaApp
```

> **Nota:** El código fuente de la aplicación se encuentra en la carpeta `AnimaApp`.

### 3. Instalar dependencias
Dentro de la carpeta `AnimaApp`, ejecuta:

```bash
npm install
```

O si prefieres usar pnpm (recomendado):
```bash
pnpm install
```

### 4. Ejecutar la aplicación
Para iniciar el servidor de desarrollo de Expo:

```bash
npx expo start
```
(O `npx expo start --clear` si tienes problemas de caché).

### 5. Probar en tu dispositivo
- **Celular Físico:** Descarga la app **Expo Go** (Android/iOS) y escanea el código QR que aparece en la terminal.
- **Emulador:** Presiona `a` para Android o `i` para iOS (requiere Xcode/Android Studio).
- **Web:** Presiona `w` para ver la versión web.

---

## ✨ Características Principales
- **Diseño Premium:** Interfaz minimalista y relajante con fondo Aurora animado.
- **Parallax 3D:** Efecto de profundidad usando el giroscopio del dispositivo.
- **Diario de Gratitud:** Estrellas interactivas que guardan tus momentos.
- **Seguimiento de Ánimo:** Registro diario y estadísticas visuales.
- **Mascota Virtual:** Compañero empático que reacciona a tu estado.

## 🛠️ Tecnologías
- **Framework:** React Native + Expo Router
- **Lenguaje:** TypeScript
- **Animaciones:** React Native Reanimated + Skia (opcional)
- **Estado:** Zustand
- **Estilos:** StyleSheet + Expo Linear Gradient

---
*Desarrollado con ❤️ para Aníma.*
