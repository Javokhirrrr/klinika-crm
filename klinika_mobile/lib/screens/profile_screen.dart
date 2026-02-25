import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/custom_button.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    
    String roleDisplay = 'Foydalanuvchi';
    if (user?.role == 'doctor') roleDisplay = 'Shifokor';
    else if (user?.role == 'reception') roleDisplay = 'Qabulxona (Reception)';
    else if (user?.role == 'director' || user?.role == 'owner') roleDisplay = 'Direktor';

    final String fullName = "\${user?.firstName ?? ''} \${user?.lastName ?? ''}".trim();
    final String initial = fullName.isNotEmpty ? fullName[0].toUpperCase() : 'U';

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 16),
              const Text(
                'Profil',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 32),
              
              // Profile Header Card
              GlassCard(
                padding: const EdgeInsets.all(24),
                borderRadius: 24,
                child: Column(
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        gradient: AppTheme.primaryGradient,
                        shape: BoxShape.circle,
                        boxShadow: AppTheme.softShadow,
                        border: Border.all(color: Colors.white, width: 4),
                      ),
                      child: Center(
                        child: Text(
                          initial,
                          style: const TextStyle(
                            fontSize: 40,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      fullName.isNotEmpty ? fullName : 'Ism kiritilmagan',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        roleDisplay,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Info Section
              _buildSectionTitle("Asosiy Ma'lumotlar"),
              const SizedBox(height: 12),
              GlassCard(
                padding: const EdgeInsets.all(0),
                borderRadius: 20,
                child: Column(
                  children: [
                    _buildInfoTile(Icons.perm_identity_rounded, 'Foydalanuvchi ID', user?.id.length != null && user!.id.length > 8 ? user.id.substring(0, 8) : 'Kiritilmagan', false),
                    Divider(height: 1, color: AppTheme.border.withOpacity(0.5)),
                    _buildInfoTile(Icons.phone_outlined, 'Telefon', user?.phone?.isNotEmpty == true ? user!.phone : '+998 ** *** ** **', false),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Settings Section
              _buildSectionTitle('Sozlamalar'),
              const SizedBox(height: 12),
              GlassCard(
                padding: const EdgeInsets.all(0),
                borderRadius: 20,
                child: Column(
                  children: [
                    _buildInfoTile(Icons.lock_outline_rounded, "Parolni o'zgartirish", '', true),
                    Divider(height: 1, color: AppTheme.border.withOpacity(0.5)),
                    _buildInfoTile(Icons.language_rounded, 'Tizim tili', "O'zbek (Lotin)", true),
                    Divider(height: 1, color: AppTheme.border.withOpacity(0.5)),
                    _buildInfoTile(Icons.color_lens_outlined, 'Mavzu', "Yorug' (Light)", true),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Logout Button
              CustomButton(
                text: 'Tizimdan chiqish',
                icon: Icons.logout_rounded,
                color: AppTheme.error,
                textColor: Colors.white,
                onPressed: () {
                  _showLogoutDialog(context);
                },
              ),
              const SizedBox(height: 100), // SafeArea for BottomNavigation
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: AppTheme.textPrimary,
        ),
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String title, String value, bool isInteractable) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppTheme.primary.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppTheme.primary, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: AppTheme.textPrimary,
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (value.isNotEmpty)
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppTheme.textSecondary,
              ),
            ),
          if (isInteractable) ...[
            const SizedBox(width: 8),
            const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.textSecondary),
          ]
        ],
      ),
      onTap: isInteractable ? () {} : null,
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext ctx) {
        return AlertDialog(
          backgroundColor: AppTheme.cardColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.warning_rounded, color: AppTheme.error, size: 28),
              SizedBox(width: 12),
              Text('Tizimdan chiqish', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: const Text('Haqiqatdan ham tizimdan chiqmoqchimisiz?', style: TextStyle(color: AppTheme.textSecondary, fontSize: 16)),
          actionsPadding: const EdgeInsets.only(bottom: 16, right: 16, left: 16),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Bekor qilish', style: TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                context.read<AuthProvider>().logout();
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              child: const Text('Chiqish', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }
}
