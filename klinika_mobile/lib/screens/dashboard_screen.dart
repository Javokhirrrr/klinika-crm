import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/shimmer_loading.dart';
import 'home_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;
  int _todayTotal = 0;
  int _todayDone = 0;
  int _totalPatients = 0;
  int _inQueue = 0;
  double _todayRevenue = 0;

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final now = DateTime.now();
      final dateStr = DateFormat('yyyy-MM-dd').format(now);
      
      // Fetch todays appointments
      final res = await ApiService.get('/appointments?date=$dateStr');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final items = data['items'] as List? ?? [];
        
        int doneCount = 0;
        int queueCount = 0;
        double rev = 0;
        
        for (var appointment in items) {
          final status = appointment['status'] ?? '';
          if (status == 'done') doneCount++;
          if (status == 'waiting' || status == 'in_progress') queueCount++;
          
          if (appointment['isPaid'] == true) {
            rev += (appointment['price'] ?? 0);
          }
        }
        
        _todayTotal = items.length;
        _todayDone = doneCount;
        _inQueue = queueCount;
        _todayRevenue = rev;
        _totalPatients = items.length * 3; // Mock total patients for now since we don't have a patients count API
      }
    } catch (e) {
      debugPrint('Error fetching stats: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isDoctor = user?.role == 'doctor';
    final isReception = user?.role == 'reception';
    final isDirector = user?.role == 'director' || user?.role == 'owner';

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchDashboardData,
          color: AppTheme.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(user?.firstName ?? 'User', user?.role ?? ''),
                const SizedBox(height: 32),
                
                if (_isLoading)
                  _buildLoadingStats()
                else if (isDoctor)
                  _buildDoctorStats()
                else
                  _buildReceptionStats(),
                  
                const SizedBox(height: 32),
                
                _buildQuickActions(context),
                const SizedBox(height: 32),
                
                _buildUpcomingPreview(),
                const SizedBox(height: 80), // For bottom nav
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(String firstName, String role) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Xush kelibsiz,',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              firstName.isNotEmpty ? firstName : 'Shifokor',
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            shape: BoxShape.circle,
            boxShadow: AppTheme.softShadow,
          ),
          child: Center(
            child: Text(
              firstName.isNotEmpty ? firstName[0].toUpperCase() : 'U',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingStats() {
    return Row(
      children: [
        const Expanded(child: ShimmerLoading(width: double.infinity, height: 120, borderRadius: 20)),
        const SizedBox(width: 16),
        const Expanded(child: ShimmerLoading(width: double.infinity, height: 120, borderRadius: 20)),
      ],
    );
  }

  Widget _buildDoctorStats() {
    return Row(
      children: [
        Expanded(
          child: _buildGradientStatCard(
            'Bugun',
            '$_todayTotal',
            Icons.people_alt_rounded,
            AppTheme.primaryGradient,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildGradientStatCard(
            'Yopildi',
            '$_todayDone',
            Icons.check_circle_rounded,
            AppTheme.successGradient,
          ),
        ),
      ],
    );
  }

  Widget _buildReceptionStats() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildGradientStatCard(
                'Bemorlar',
                '$_todayTotal',
                Icons.groups_rounded,
                AppTheme.primaryGradient,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildGradientStatCard(
                'Navbatda',
                '$_inQueue',
                Icons.hourglass_empty_rounded,
                const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildGradientStatCard(
          'Bugungi Tushum',
          NumberFormat.currency(locale: 'uz', symbol: 'UZS', decimalDigits: 0).format(_todayRevenue),
          Icons.account_balance_wallet_rounded,
          AppTheme.successGradient,
          isWide: true,
        ),
      ],
    );
  }

  Widget _buildGradientStatCard(String title, String value, IconData icon, Gradient gradient, {bool isWide = false}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white, size: 24),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            value,
            style: TextStyle(
              fontSize: isWide ? 28 : 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.9),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tezkor amallar',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildActionItem(context, 'Yangi\nqabul', Icons.add_circle_outline_rounded, AppTheme.primary, () {
                 // Push to calendar screen since add button is there
                 // The navigation will handle selecting the tab
              }),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionItem(context, 'Bemor\nqidirish', Icons.person_search_outlined, AppTheme.accent, () {
                 // To-DO
              }),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionItem(context, 'Tarix\nko\'rish', Icons.history_rounded, AppTheme.success, () {
                 // To-DO
              }),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionItem(BuildContext context, String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        padding: const EdgeInsets.symmetric(vertical: 16),
        borderRadius: 20,
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingPreview() {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      borderRadius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Yaqin qabullar',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                'Barchasi >',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            const ShimmerLoading(width: double.infinity, height: 60)
          else if (_inQueue == 0 && _todayTotal == 0)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16.0),
                child: Text('Bugun uchun rejalashtirilgan qabullar yo\'q', style: TextStyle(color: AppTheme.textSecondary)),
              ),
            )
          else
            Container(
               padding: const EdgeInsets.all(16),
               decoration: BoxDecoration(
                 color: AppTheme.primary.withOpacity(0.05),
                 borderRadius: BorderRadius.circular(16),
               ),
               child: Row(
                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                 children: [
                   Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                       const Text('Tizim navbatlarni yukladi', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                       const SizedBox(height: 4),
                       Text('Qabullar sahifasiga o\'tib ko\'ring', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                     ],
                   ),
                   const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.primary),
                 ],
               ),
            ),
        ],
      ),
    );
  }
}
