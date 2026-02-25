import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/appointment_model.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/shimmer_loading.dart';
import 'doctor_room_screen.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime selectedDate = DateTime.now();
  String selectedDoctor = 'Barchasi';
  List<Appointment> _appointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAppointments();
  }

  Future<void> _fetchAppointments() async {
    setState(() => _isLoading = true);
    try {
      final formattedDate = "\${selectedDate.year}-\${selectedDate.month.toString().padLeft(2, '0')}-\${selectedDate.day.toString().padLeft(2, '0')}";
      final response = await ApiService.get('/appointments?date=\$formattedDate&limit=100');
      final data = jsonDecode(response.body);

      if (data['items'] != null) {
        setState(() {
          _appointments = (data['items'] as List).map((json) => Appointment.fromJson(json)).toList();
        });
      }
    } catch (e) {
      debugPrint("Klinika Mobile Appointments xatolik: \$e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getMonthName(int month) {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return months[month - 1];
  }

  String _getDayName(int weekday) {
    const days = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];
    return days[weekday - 1];
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    List<Appointment> displayAppointments = _appointments;
    if (user?.role == 'doctor') {
      displayAppointments = _appointments.where((a) => a.doctorId == user?.id).toList();
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchAppointments,
          color: AppTheme.primary,
          child: Column(
            children: [
              _buildHeader(),
              _buildDateStrip(),
              if (user?.role != 'doctor') _buildDoctorFilter(),
              Expanded(
                child: _isLoading 
                  ? _buildLoadingList()
                  : _buildAppointmentsList(displayAppointments, user),
              ),
            ],
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 70.0, right: 8.0), // Above floating bottom nav
        child: FloatingActionButton(
          onPressed: () {
            // TODO: Navigate to Add Appointment Screen/Modal
          },
          backgroundColor: AppTheme.primary,
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          child: Container(
            width: 60,
            height: 60,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppTheme.primaryGradient,
            ),
            child: const Icon(Icons.add, color: Colors.white, size: 28),
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
          Expanded(
            child: Row(
              children: [
                const Icon(Icons.calendar_month_rounded, color: AppTheme.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '\${_getMonthName(selectedDate.month)} \${selectedDate.year}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                      letterSpacing: -0.5,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: () {
              setState(() {
                selectedDate = DateTime.now();
                _fetchAppointments();
              });
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight.withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('Bugun', style: TextStyle(color: AppTheme.primary, fontSize: 13, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateStrip() {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 30, // Show a month of days basically
        itemBuilder: (context, index) {
          // Centering around today roughly
          final date = DateTime.now().subtract(const Duration(days: 3)).add(Duration(days: index));
          final isSelected = date.year == selectedDate.year && date.month == selectedDate.month && date.day == selectedDate.day;
          
          return GestureDetector(
            onTap: () {
              setState(() {
                selectedDate = date;
                _fetchAppointments();
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              width: 64,
              margin: const EdgeInsets.only(right: 12, bottom: 8, top: 4),
              decoration: BoxDecoration(
                gradient: isSelected ? AppTheme.primaryGradient : null,
                color: isSelected ? null : AppTheme.cardColor,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isSelected ? Colors.transparent : AppTheme.border.withOpacity(0.3)),
                boxShadow: isSelected 
                    ? [BoxShadow(color: AppTheme.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6))] 
                    : AppTheme.softShadow,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_getDayName(date.weekday).toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isSelected ? Colors.white.withOpacity(0.9) : AppTheme.textSecondary)),
                  const SizedBox(height: 6),
                  Text(date.day.toString(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : AppTheme.textPrimary)),
                  if (isSelected) ...[
                    const SizedBox(height: 4),
                    Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle))
                  ]
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDoctorFilter() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          const Icon(Icons.filter_list_rounded, color: AppTheme.textSecondary, size: 20),
          const SizedBox(width: 8),
          Text('Barcha shifokorlar', style: TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildLoadingList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: 5,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.only(bottom: 16),
        child: ShimmerLoading(width: double.infinity, height: 120, borderRadius: 20),
      ),
    );
  }

  Widget _buildAppointmentsList(List<Appointment> items, dynamic user) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy_rounded, size: 64, color: AppTheme.textSecondary.withOpacity(0.3)),
            const SizedBox(height: 16),
            const Text("Ushbu sanada qabullar yo'q", style: TextStyle(color: AppTheme.textSecondary, fontSize: 16, fontWeight: FontWeight.w500)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 100), // padding for FAB
      itemCount: items.length,
      itemBuilder: (context, index) {
        final a = items[index];
        final isDone = a.status == 'completed' || a.status == 'done';
        final isProgress = a.status == 'in_progress';
        
        Color statusColor = AppTheme.primary;
        String statusText = 'Kutmoqda';
        
        if (isDone) {
          statusColor = AppTheme.success;
          statusText = 'Tugallandi';
        } else if (isProgress) {
          statusColor = AppTheme.warning;
          statusText = 'Jarayonda';
        }

        return GestureDetector(
          onTap: () {
            if (user?.role == 'doctor' && !isDone) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DoctorRoomScreen(appointment: a),
                ),
              ).then((value) => _fetchAppointments()); // Refresh after returning
            }
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppTheme.cardColor,
              borderRadius: BorderRadius.circular(20),
              boxShadow: AppTheme.softShadow,
              border: Border.all(color: AppTheme.border.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                // Minimal Status Indicator Line
                Container(
                  width: 6,
                  height: 110,
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), bottomLeft: Radius.circular(20)),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              a.time,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                statusText,
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: statusColor),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: AppTheme.primary.withOpacity(0.1),
                              child: Text(a.patientName[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 14)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    a.patientName,
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    a.cause,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (user?.role != 'doctor') ...[
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.medical_services_outlined, size: 14, color: AppTheme.textSecondary),
                              const SizedBox(width: 6),
                              Text('Dr. \${a.doctorName}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ]
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
