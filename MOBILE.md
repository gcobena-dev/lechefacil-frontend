# LecheFacil Mobile Setup

## Configuración de Capacitor

Este proyecto está configurado para ser compilado como aplicación móvil nativa usando Capacitor.

## Requisitos previos

### Para Android:
- **Java JDK 11 o superior** (actualmente tienes Java 8)
- Android Studio (última versión)
- Android SDK instalado

Para actualizar Java en macOS:
```bash
brew install openjdk@17
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

### Para iOS:
- macOS
- Xcode (última versión)
- CocoaPods: `sudo gem install cocoapods`

## Scripts disponibles

```bash
# Compilar y sincronizar cambios a las plataformas móviles
npm run mobile:sync

# Abrir Android Studio para compilar y ejecutar la app
npm run mobile:android

# Abrir Xcode para compilar y ejecutar la app
npm run mobile:ios

# Ejecutar directamente en dispositivo/emulador Android
npm run mobile:run:android

# Ejecutar directamente en dispositivo/simulador iOS
npm run mobile:run:ios
```

## Plugins instalados

- **@capacitor/camera**: Acceso a la cámara del dispositivo
- **@capacitor/filesystem**: Manejo de archivos locales
- **@capacitor/preferences**: Almacenamiento de preferencias local

## Permisos configurados

### Android (AndroidManifest.xml):
- Internet
- Cámara
- Lectura/escritura de almacenamiento externo
- Lectura de imágenes

### iOS:
Los permisos se configuran en el archivo `Info.plist` al abrir Xcode.

## Pasos para compilar

### Android:

1. **Actualiza Java a versión 11 o superior**
2. Compila el proyecto web:
   ```bash
   npm run build
   ```
3. Sincroniza con Android:
   ```bash
   npx cap sync android
   ```
4. Abre Android Studio:
   ```bash
   npx cap open android
   ```
5. Compila y ejecuta desde Android Studio

### iOS:

1. Compila el proyecto web:
   ```bash
   npm run build
   ```
2. Instala dependencias de iOS:
   ```bash
   npx cap sync ios
   cd ios/App && pod install
   ```
3. Abre Xcode:
   ```bash
   npx cap open ios
   ```
4. Configura tu equipo de desarrollo en Xcode
5. Compila y ejecuta desde Xcode

## Flujo de desarrollo

1. Desarrolla normalmente con `npm run dev`
2. Cuando quieras probar en móvil:
   - Ejecuta `npm run mobile:sync`
   - Abre el IDE nativo (Android Studio o Xcode)
   - Compila y ejecuta en emulador/dispositivo

## Notas importantes

- El build se genera en la carpeta `dist/`
- Los cambios en el código web requieren sincronizar con `npx cap sync`
- Los cambios en configuración nativa requieren abrir el IDE correspondiente
- La primera compilación puede tardar varios minutos

## URLs y configuración

- La app usa el esquema `https://` para Android (más seguro)
- Configura tu API backend en las variables de entorno correspondientes

## Firma del APK

El APK se firma con una keystore **fija**, restaurada en CI desde el secret
`RELEASE_KEYSTORE_BASE64`. No se genera en el pipeline.

Android identifica una app por su certificado de firma: si cambia, se niega a
actualizar (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`) y hay que desinstalar. Hasta
v0983 el workflow corría `keytool -genkey` en **cada** corrida, así que cada
release salía con una llave distinta. Eso obligaba a desinstalar en cada
actualización —y desinstalar borra la cola offline, el único lugar donde viven
los registros cargados sin señal— además de impedir publicar en Play Store, que
exige una llave estable de por vida.

### Crear la keystore (una sola vez)

```bash
keytool -genkey -v -keystore lechefacil-release.keystore \
  -alias lechefacil -keyalg RSA -keysize 2048 -validity 10000

base64 -i lechefacil-release.keystore | pbcopy
gh secret set RELEASE_KEYSTORE_BASE64 --repo gcobena-dev/lechefacil-frontend
```

Secrets que usa el pipeline:

| Secret | Para qué |
|---|---|
| `RELEASE_KEYSTORE_BASE64` | la keystore en base64 |
| `KEYSTORE_PASSWORD` | contraseña del almacén |
| `KEY_PASSWORD` | contraseña de la clave (si difiere del almacén) |

> **Guardá el archivo `.keystore` y sus contraseñas fuera del repo, con copia.**
> Si se pierden, no hay forma de publicar una actualización para las apps ya
> instaladas: hay que cambiar de `applicationId` y que todos reinstalen.

El pipeline falla si falta el secret, si la contraseña no abre el almacén, o si
el APK sale sin firmar — antes subía el `app-release-unsigned.apk` sin avisar.

## Publicar una versión: OTA o build nativo

Un bundle OTA (`@capgo/capacitor-updater`) sólo reemplaza la capa web: JS, HTML,
CSS y assets. **Nada nativo viaja por OTA** — ni un plugin de Capacitor nuevo,
ni un cambio de `AndroidManifest.xml`, ni un bump de SDK. Eso es un límite de
todos los sistemas OTA, no de Capgo.

Lo peligroso es que el bundle igual se instala sin error: la app arranca, no
falla nada visible, y la función que dependía del código nativo queda muerta en
silencio. Fue exactamente lo que pasó en v096: se publicó el arreglo del botón
atrás como JS, pero el plugin `@capacitor/app` del que depende nunca llegó a los
APK instalados, así que el botón siguió cerrando la app.

### Qué decide cuál corresponde

| Cambio | Cómo se publica |
|---|---|
| JS, HTML, CSS, assets, traducciones | OTA |
| Plugin de Capacitor nuevo o eliminado | **Build nativo** |
| `AndroidManifest.xml`, permisos, `build.gradle` | **Build nativo** |
| `targetSdk` / `compileSdk` / dependencias nativas | **Build nativo** |

### Cómo se versiona

`package.json` es la única fuente. `android/app/build.gradle` deriva el
`versionName` y el `versionCode` de ahí, y el pipeline calcula el mismo número
para el `version.json`, así que no hay nada que sincronizar a mano.

```
versionName = version de package.json           ("0.0.983")
versionCode = major*1000000 + minor*1000 + patch (983)
```

La fórmula no es "los dígitos sin puntos": eso rompe el primer día que la
versión pase a `0.1.0`, porque daría `10` — menor que el `983` de `0.0.983` — y
Android rechaza instalar un APK con `versionCode` más bajo que el instalado.

### Checklist de un release

1. Bumpear `version` en `package.json`. Eso solo ya publica bundle y APK.
2. **Sólo si el release trae código nativo** (plugin nuevo, cambio de manifest,
   bump de SDK): subir también `minNativeBuild` en `package.json` al
   `versionCode` de este release.

El paso 2 es un **piso que trinca, no una bandera por release**: una vez que
vale 983, se queda en 983 en todos los releases siguientes hasta que entre
código nativo nuevo. Bajarlo o borrarlo deja que un shell viejo vuelva a recibir
un bundle que no puede correr.

Si el pipeline no encuentra `minNativeBuild` en `package.json`, falla a
propósito en vez de publicar sin gate.

### `version.json`

```json
{
  "version": "0.0.983",
  "versionCode": 983,
  "minNativeBuild": 983,
  "apkUrl": "https://.../lechefacil-0.0.983.apk",
  "latestApkUrl": "https://.../lechefacil-latest.apk",
  "updateBundleUrl": "https://.../bundle-0.0.983.zip",
  "releaseDate": "2026-09-12",
  "minVersion": "0.0.900",
  "changelog": "..."
}
```

`minNativeBuild` es el `versionCode` de APK mínimo que ese bundle necesita.
`GET /api/v1/mobile/check-update` lo compara contra el `versionCode` que reporta
el dispositivo y, si se queda corto, **no entrega el bundle**: devuelve
`requiresNativeUpdate` y la app muestra un diálogo que manda a instalar el APK.

Un dispositivo que no puede reportar su `versionCode` cuenta como demasiado
viejo — los únicos APK que no saben responder son los anteriores a v096, que son
justamente los que hay que reemplazar.

`versionCode` y `minNativeBuild` salen los dos de `package.json` vía el
pipeline; no se escriben a mano.
