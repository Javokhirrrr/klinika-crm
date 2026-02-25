import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'calendar_screen.dart';
import 'patients_screen.dart';
import 'cashier_screen.dart';
import 'dashboard_screen.dart';
import 'profile_screen.dart';
import '../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0; // Default to Dashboard (Asosiy)

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isDoctor = user?.role == 'doctor';
    final isReception = user?.role == 'reception';
    final isDirector = user?.role == 'director' || user?.role == 'owner';

    // Role asosida ruxsat etilgan BottomNavigation elementlari ro'yxati yaratiladi
    final List<BottomNavigationBarItem> navItems = [];
    final List<Widget> screens = [];

    // 1. Asosiy (Dashboard - Hamma uchun)
    navItems.add(const BottomNavigationBarItem(
      icon: Icon(Icons.dashboard_outlined),
      activeIcon: Icon(Icons.dashboard_rounded),
      label: 'Asosiy',
    ));
    screens.add(const DashboardScreen());

    // 2. Qabullar (Calendar - Doctor uchun ko'proq kerak, lekin hamma ko'rishi mumkin)
    navItems.add(const BottomNavigationBarItem(
      icon: Icon(Icons.calendar_today_outlined),
      activeIcon: Icon(Icons.calendar_month_rounded),
      label: 'Qabullar',
    ));
    screens.add(const CalendarScreen());

    // 3. Bemorlar (Faqat Reception va Director)
    if (isReception || isDirector) {
      navItems.add(const BottomNavigationBarItem(
        icon: Icon(Icons.people_outline),
        activeIcon: Icon(Icons.people_alt_rounded),
        label: 'Bemorlar',
      ));
      screens.add(const PatientsScreen());
    }

    // 4. Kassa (Faqat Reception/Cashier yoki Director)
    if (isReception || isDirector) {
      navItems.add(const BottomNavigationBarItem(
        icon: Icon(Icons.account_balance_wallet_outlined),
        activeIcon: Icon(Icons.account_balance_wallet_rounded),
        label: 'Kassa',
      ));
      screens.add(const CashierScreen());
    }

    // 5. Profil (Hamma uchun)
    navItems.add(const BottomNavigationBarItem(
      icon: Icon(Icons.person_outline),
      activeIcon: Icon(Icons.person_rounded),
      label: 'Profil',
    ));
    screens.add(const ProfileScreen());

    return Scaffold(
      extendBody: true,
      body: screens[_currentIndex >= screens.length ? 0 : _currentIndex],
      bottomNavigationBar: Container(
        margin: const EdgeInsets.only(left: 16, right: 16, bottom: 24),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(24),
          boxShadow: AppTheme.softShadow,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BottomNavigationBar(
            currentIndex: _currentIndex >= screens.length ? 0 : _currentIndex,
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.transparent,
            selectedItemColor: AppTheme.primary,
            unselectedItemColor: AppTheme.textSecondary,
            selectedFontSize: 12,
            unselectedFontSize: 12,
            showUnselectedLabels: true,
            elevation: 0,
            items: navItems,
          ),
        ),
      ),
    );
  }
}


