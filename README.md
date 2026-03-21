# 🎓 EduTrack

> **Tu gestor escolar personal** — calificaciones, agenda, asistencia y más, sincronizado en la nube.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)

---

## ¿Qué es EduTrack?

EduTrack es una aplicación web progresiva diseñada para estudiantes secundarios argentinos que quieren tener el control total de su vida escolar en un solo lugar. Sin papeles, sin anotadores perdidos, sin excusas.

Desarrollada de cero con React + Firebase, funciona igual de bien en la computadora que en el celular, y sincroniza todo en tiempo real entre dispositivos.

---

## ✨ Funcionalidades

### 📊 Dashboard
- Saludo personalizado según la hora del día
- Countdown al fin del trimestre actual con mensaje motivacional
- Promedio general y por materia con barras de progreso
- Próximas entregas y evaluaciones con indicador de urgencia
- Gráfico de evolución trimestral
- Enlaces rápidos a plataformas externas (aula virtual, etc.)

### 📚 Calificaciones
- Registro por materia y trimestre con soporte de decimales
- Campo de nota libre (ej: `8.75`) o estado **PENDIENTE**
- Edición de notas ya registradas
- Fecha por calificación
- Cierre de trimestre con promedio final bloqueado
- Distribución de notas (gráfico de barras)
- **Objetivos por trimestre** — meta por materia con barra de progreso verde/amarillo/rojo

### 🗓 Agenda
- Registro de Tareas, TPs y Evaluaciones
- Campo de temas/consigna por ítem
- Al agregar una Evaluación o TP → se crea automáticamente como **PENDIENTE** en Calificaciones
- Vista lista y vista calendario mensual con días festivos marcados
- Cambio de estado: Pendiente → Entregado → Evaluado

### 🏫 Asistencia
- Inasistencias justificadas, injustificadas y tardanzas
- Porcentaje de asistencia calculado automáticamente
- Alerta visual al acercarse al límite

### 👨‍🏫 Profesores
- Datos de contacto por materia
- Email, estilo de evaluación y observaciones

### 📅 Horario Semanal
- Bloques con hora de inicio y fin libres
- Vista por día con el día actual resaltado

### 📈 Estadísticas
- Ranking de materias
- Comparación entre trimestres
- Predicción de promedio final por tendencia

### ⚙️ Configuración
- Nombre, institución y año lectivo
- Fechas de inicio y fin de cada trimestre
- Registro de feriados, vacaciones y días festivos
- Modo oscuro / claro
- Gestión de enlaces rápidos

---

## 🔔 Notificaciones

EduTrack avisa automáticamente cuando se acerca una evaluación o tarea:

| Anticipación | Mensaje |
|---|---|
| 3 días antes | *"Se acerca. Empezá a prepararte."* |
| 2 días antes | *"Es pasado mañana."* |
| 1 día antes | *"¡Preparate!"* |
| El mismo día | *"¡Es hoy!"* |

> Las notificaciones se envían una vez por día al abrir la app. Requiere permiso del navegador.

---

## 🛠️ Stack técnico

| Tecnología | Uso |
|---|---|
| **React 18** | UI y lógica de componentes |
| **Vite** | Bundler y entorno de desarrollo |
| **Firebase Auth** | Login con Google |
| **Firestore** | Base de datos en tiempo real |
| **Vercel** | Deploy y hosting |

---

## 🚀 Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/edutrack.git
cd edutrack

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

Abrí `http://localhost:5173` en el navegador.

> **Nota:** Para que funcione el login y la sincronización necesitás configurar tu propio proyecto en [Firebase Console](https://console.firebase.google.com) y reemplazar las credenciales en `src/App.jsx`.

---

## 📁 Estructura del proyecto

```
edutrack/
├── src/
│   ├── App.jsx        # Toda la aplicación
│   └── main.jsx       # Punto de entrada
├── public/
├── index.html
├── vite.config.js
└── package.json
```

---

## 📱 Responsive

| Dispositivo | Navegación |
|---|---|
| 💻 Desktop | Sidebar lateral fijo |
| 📱 Mobile | Top bar + bottom navigation |

---

## ☁️ Sincronización

Los datos se guardan en **Firestore** asociados a tu cuenta de Google. Podés abrir EduTrack desde cualquier dispositivo y ver exactamente la misma información. El indicador ☁️ en el sidebar confirma que todo está sincronizado.

---

## 🔒 Seguridad

- Autenticación con Google OAuth
- Reglas de Firestore: cada usuario solo puede leer y escribir sus propios datos
- La API key de Firebase está restringida a los dominios autorizados

---

<div align="center">
  <sub>Hecho con 💙 por un estudiante, para estudiantes.</sub>
</div>
