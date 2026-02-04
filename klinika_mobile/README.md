# 📱 Klinika Mobile - Flutter App

> **Klinika CRM Mobile Application** - iOS va Android uchun professional klinika boshqaruv tizimi

---

## 🎨 Dizayn

Bu app professional tibbiy dizayn asosida yaratilgan:
- ✅ Modern UI/UX
- ✅ Material Design 3
- ✅ Responsive layout
- ✅ Custom theme

---

## 🚀 Ishga Tushirish

### 1. Flutter o'rnatilganini tekshiring:

```bash
flutter --version
```

### 2. Dependencies o'rnating:

```bash
cd klinika_mobile
flutter pub get
```

### 3. Ishga tushiring:

#### Android:
```bash
flutter run
```

#### iOS (Mac kerak):
```bash
flutter run -d ios
```

#### Web:
```bash
flutter run -d chrome
```

---

## 📁 Loyiha Strukturasi

```
klinika_mobile/
├── lib/
│   ├── main.dart                 # Entry point
│   ├── theme/
│   │   └── app_theme.dart        # App theme va ranglar
│   ├── screens/
│   │   ├── home_screen.dart      # Bottom navigation
│   │   ├── calendar_screen.dart  # Taqvim (Qabullar)
│   │   └── patients_screen.dart  # Bemorlar ro'yxati
│   ├── models/                   # Data models
│   ├── services/                 # API services
│   └── widgets/                  # Reusable widgets
├── assets/                       # Images, fonts
└── pubspec.yaml                  # Dependencies
```

---

## 🎯 Tayyor Sahifalar

### ✅ 1. Calendar Screen (Taqvim)
- Oy tanlash
- Kun tanlash (horizontal scroll)
- Shifokor filtri
- Timeline ko'rinishi
- Qabullar (appointment cards)
- Joriy vaqt ko'rsatkichi
- FAB (yangi qabul qo'shish)

### ✅ 2. Patients Screen (Bemorlar)
- Qidiruv
- Filterlar (Barchasi, Qarzdorlar, VIP, Yangilar)
- Bemorlar ro'yxati
- Status badge (Faol, Kutmoqda)
- VIP badge
- Qarz ko'rsatkichi
- FAB (yangi bemor qo'shish)

### ✅ 3. Bottom Navigation
- Asosiy (Dashboard)
- Taqvim (Calendar) ✅
- Bemorlar (Patients) ✅
- Kassa (Cashier)
- Menyu (Menu)

---

## 🎨 Ranglar

```dart
Primary: #0EA5E9 (Sky Blue)
Background: #F8FAFC
Card: #FFFFFF
Text Primary: #0F172A
Text Secondary: #64748B
Border: #E2E8F0
Success: #10B981
Warning: #F59E0B
Error: #EF4444
```

---

## 📦 Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0                    # API calls
  provider: ^6.1.1                # State management
  shared_preferences: ^2.2.2      # Local storage
  flutter_svg: ^2.0.9             # SVG icons
  intl: ^0.19.0                   # Date/Time formatting
  cached_network_image: ^3.3.1    # Image caching
```

---

## 🔧 Keyingi Qadamlar

### 1. Backend Integration
- [ ] API service yaratish
- [ ] Authentication
- [ ] Data models
- [ ] State management

### 2. Qo'shimcha Sahifalar
- [ ] Dashboard
- [ ] Kassa (Payments)
- [ ] Menyu (Settings)
- [ ] Login/Register
- [ ] Patient Details
- [ ] Appointment Details

### 3. Features
- [ ] Push notifications
- [ ] Offline mode
- [ ] Dark mode
- [ ] Multi-language (O'zbek, Rus, Ingliz)

---

## 🏃 Development

### Hot Reload:
Kod o'zgarganda `r` bosing (hot reload)
Appni qayta boshlash uchun `R` bosing (hot restart)

### Debug Mode:
```bash
flutter run --debug
```

### Release Mode:
```bash
flutter run --release
```

---

## 📱 Build

### Android APK:
```bash
flutter build apk --release
```

### Android App Bundle (Google Play):
```bash
flutter build appbundle --release
```

### iOS (Mac kerak):
```bash
flutter build ios --release
```

---

## 🐛 Debugging

### Logs:
```bash
flutter logs
```

### Analyze:
```bash
flutter analyze
```

### Test:
```bash
flutter test
```

---

## 📚 Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Documentation](https://dart.dev/guides)
- [Material Design 3](https://m3.material.io/)

---

## 👨‍💻 Developer

**Klinika CRM Team**
- Backend: Node.js + Express + MongoDB
- Frontend Web: React + Vite
- Mobile: Flutter

---

Made with ❤️ in Uzbekistan 🇺🇿
