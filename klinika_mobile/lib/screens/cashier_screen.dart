import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_button.dart';
import '../widgets/glass_card.dart';
import '../widgets/shimmer_loading.dart';

class CashierScreen extends StatefulWidget {
  const CashierScreen({super.key});

  @override
  State<CashierScreen> createState() => _CashierScreenState();
}

class _CashierScreenState extends State<CashierScreen> {
  bool _isLoading = true;
  List<dynamic> _unpaidAppointments = [];

  @override
  void initState() {
    super.initState();
    _fetchUnpaidAppointments();
  }

  Future<void> _fetchUnpaidAppointments() async {
    setState(() => _isLoading = true);
    try {
      final String today = DateTime.now().toIso8601String().split('T')[0];
      final response = await ApiService.get('/appointments?date=\$today&limit=100');
      final data = jsonDecode(response.body);

      if (data['items'] != null) {
        setState(() {
          _unpaidAppointments = (data['items'] as List)
              .where((item) => item['isPaid'] == false && (item['status'] == 'done' || item['status'] == 'in_progress' || item['status'] == 'waiting'))
              .toList();
        });
      }
    } catch (e) {
      debugPrint("Kassada qabullarni olishda xatolik: \$e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _processPayment(String appointmentId, double amount, String method) async {
    try {
      await ApiService.post('/payments', body: {
        'appointmentId': appointmentId,
        'amount': amount,
        'method': method,
        'note': "Kassaga to'lov"
      });
      _fetchUnpaidAppointments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("To'lov muvaffaqiyatli qabul qilindi!")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: \$e')),
        );
      }
    }
  }

  void _showPaymentModal(Map<String, dynamic> appointment) {
    final double amount = (appointment['price'] ?? 0).toDouble();
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Ushbu qabul narxi 0 so'm")),
      );
      return;
    }
    
    final formattedAmount = NumberFormat.currency(locale: 'uz', symbol: 'UZS', decimalDigits: 0).format(amount);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: AppTheme.background,
            borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 32,
            top: 24, left: 24, right: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 24),
              const Text("Kassaga to'lov", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
              const SizedBox(height: 24),
              
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: AppTheme.cardColor, borderRadius: BorderRadius.circular(20), boxShadow: AppTheme.softShadow),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), shape: BoxShape.circle),
                          child: const Icon(Icons.person_rounded, color: AppTheme.primary),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("\${appointment['patientId']?['firstName'] ?? ''} \${appointment['patientId']?['lastName'] ?? ''}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text("Dr. \${appointment['doctorId']?['name'] ?? ''}", style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              const Text("Jami Summa", style: TextStyle(fontSize: 14, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text(formattedAmount, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
              const SizedBox(height: 32),

              Row(
                children: [
                  Expanded(
                    child: CustomButton(
                      text: 'Naqd',
                      icon: Icons.payments_rounded,
                      color: AppTheme.success,
                      onPressed: () {
                        Navigator.pop(context);
                        _processPayment(appointment['_id'], amount, 'cash');
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: CustomButton(
                      text: 'Karta',
                      icon: Icons.credit_card_rounded,
                      gradient: AppTheme.primaryGradient,
                      onPressed: () {
                        Navigator.pop(context);
                        _processPayment(appointment['_id'], amount, 'card');
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchUnpaidAppointments,
          color: AppTheme.primary,
          child: Column(
            children: [
              _buildHeader(),
              Expanded(
                child: _isLoading
                    ? _buildLoadingList()
                    : _unpaidAppointments.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle_outline_rounded, size: 80, color: AppTheme.success),
                                SizedBox(height: 16),
                                Text("Barcha qabullar to'langan!", style: TextStyle(fontSize: 18, color: AppTheme.textPrimary, fontWeight: FontWeight.bold)),
                                SizedBox(height: 8),
                                Text("Ayni vaqtda to'lanmagan qabullar yo'q.", style: TextStyle(fontSize: 14, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.only(left: 20, right: 20, top: 8, bottom: 100),
                            itemCount: _unpaidAppointments.length,
                            itemBuilder: (context, index) {
                              final item = _unpaidAppointments[index];
                              final patientName = "\${item['patientId']?['firstName'] ?? ''} \${item['patientId']?['lastName'] ?? ''}".trim();
                              final doctorName = item['doctorId']?['name'] ?? "Noma'lum";
                              final amount = (item['price'] ?? 0).toDouble();
                              final formattedAmount = NumberFormat.currency(locale: 'uz', symbol: 'UZS', decimalDigits: 0).format(amount);

                              return GlassCard(
                                margin: const EdgeInsets.only(bottom: 16),
                                padding: const EdgeInsets.all(16),
                                borderRadius: 20,
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: AppTheme.warning.withOpacity(0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.account_balance_wallet_rounded, color: AppTheme.warning, size: 24),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(patientName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textPrimary)),
                                          const SizedBox(height: 4),
                                          Text('Dr. \$doctorName', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                          const SizedBox(height: 6),
                                          Text(formattedAmount, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 14)),
                                        ],
                                      ),
                                    ),
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.primary,
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                      ),
                                      onPressed: () => _showPaymentModal(item),
                                      child: const Text("To'lov", style: TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Kassa',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.textPrimary, letterSpacing: -0.5),
              ),
              const SizedBox(height: 4),
              Text(
                "To'lanmagan qabullar: \${_unpaidAppointments.length}",
                style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          InkWell(
            onTap: _fetchUnpaidAppointments,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.cardColor,
                shape: BoxShape.circle,
                boxShadow: AppTheme.softShadow,
              ),
              child: const Icon(Icons.refresh_rounded, size: 24, color: AppTheme.primary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: 4,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.only(bottom: 16),
        child: ShimmerLoading(width: double.infinity, height: 100, borderRadius: 20),
      ),
    );
  }
}
