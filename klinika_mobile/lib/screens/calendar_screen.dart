import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime selectedDate = DateTime.now();
  String selectedDoctor = 'Barchasi';

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
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(),
            
            // Date Strip
            _buildDateStrip(),
            
            // Doctor Filter
            _buildDoctorFilter(),
            
            // Timeline
            Expanded(
              child: _buildTimeline(),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Text(
                _getMonthName(selectedDate.month) + ' ' + selectedDate.year.toString(),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.keyboard_arrow_down, color: AppTheme.textSecondary),
            ],
          ),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Bugun',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.cardColor,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppTheme.border.withOpacity(0.5)),
                ),
                child: const Icon(Icons.search, size: 18, color: AppTheme.textPrimary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDateStrip() {
    return SizedBox(
      height: 90,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 7,
        itemBuilder: (context, index) {
          final date = DateTime.now().add(Duration(days: index - 1));
          final isSelected = index == 1;
          
          return GestureDetector(
            onTap: () {
              setState(() {
                selectedDate = date;
              });
            },
            child: Container(
              width: 60,
              margin: const EdgeInsets.only(right: 12),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primary : AppTheme.cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? AppTheme.primary : AppTheme.border.withOpacity(0.5),
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: AppTheme.primary.withOpacity(0.25),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : [],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _getDayName(date.weekday).toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: isSelected ? Colors.white.withOpacity(0.9) : AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    date.day.toString(),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : AppTheme.textPrimary,
                    ),
                  ),
                  if (isSelected) ...[
                    const SizedBox(height: 4),
                    Container(
                      width: 4,
                      height: 4,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDoctorFilter() {
    final doctors = [
      {'name': 'Barchasi', 'avatar': ''},
      {'name': 'Dr. Aziza', 'avatar': 'https://i.pravatar.cc/150?u=dr1'},
      {'name': 'Dr. Bekzod', 'avatar': 'https://i.pravatar.cc/150?u=dr2'},
      {'name': 'Dr. Malika', 'avatar': 'https://i.pravatar.cc/150?u=dr3'},
    ];

    return SizedBox(
      height: 60,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: doctors.length,
        itemBuilder: (context, index) {
          final doctor = doctors[index];
          final isSelected = selectedDoctor == doctor['name'];
          
          return GestureDetector(
            onTap: () {
              setState(() {
                selectedDoctor = doctor['name']!;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: EdgeInsets.symmetric(
                horizontal: doctor['avatar']!.isEmpty ? 16 : 4,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.textPrimary : AppTheme.cardColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? AppTheme.textPrimary : AppTheme.border.withOpacity(0.5),
                ),
              ),
              child: Row(
                children: [
                  if (doctor['avatar']!.isNotEmpty) ...[
                    CircleAvatar(
                      radius: 16,
                      backgroundImage: NetworkImage(doctor['avatar']!),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    doctor['name']!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? Colors.white : AppTheme.textPrimary,
                    ),
                  ),
                  if (doctor['avatar']!.isNotEmpty) const SizedBox(width: 8),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTimeline() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Timeline grid
          for (int hour = 8; hour <= 15; hour++) ...[
            _buildTimeSlot(hour),
          ],
          
          // Appointments
          Stack(
            children: [
              // Appointment 1: 08:30 - 09:15
              Positioned(
                top: 48,
                left: 56,
                right: 8,
                child: _buildAppointmentCard(
                  patientName: 'Sardor Rahimov',
                  service: 'Birlamchi ko\'rik',
                  time: '08:30',
                  doctor: 'Dr. Aziza',
                  doctorAvatar: 'https://i.pravatar.cc/150?u=dr1',
                  color: const Color(0xFFF0F9FF),
                  borderColor: AppTheme.primary,
                  height: 72,
                ),
              ),
              
              // Appointment 2: 10:00 - 11:00
              Positioned(
                top: 192,
                left: 56,
                right: 8,
                child: _buildAppointmentCard(
                  patientName: 'Laylo Karimova',
                  service: 'EKG Tahlili',
                  time: '10:00',
                  doctor: 'Dr. Bekzod',
                  doctorAvatar: 'https://i.pravatar.cc/150?u=dr2',
                  color: const Color(0xFFFFF7ED),
                  borderColor: AppTheme.warning,
                  height: 96,
                  status: 'Kutilmoqda',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimeSlot(int hour) {
    return Container(
      height: 96,
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: AppTheme.border.withOpacity(0.4)),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 56,
            child: Text(
              '${hour.toString().padLeft(2, '0')}:00',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppTheme.textSecondary.withOpacity(0.7),
              ),
            ),
          ),
          Expanded(child: Container()),
        ],
      ),
    );
  }

  Widget _buildAppointmentCard({
    required String patientName,
    required String service,
    required String time,
    required String doctor,
    required String doctorAvatar,
    required Color color,
    required Color borderColor,
    required double height,
    String? status,
  }) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color,
        borderRadius: const BorderRadius.only(
          topRight: Radius.circular(12),
          bottomRight: Radius.circular(12),
        ),
        border: Border(
          left: BorderSide(color: borderColor, width: 3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      patientName,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: borderColor.withOpacity(0.9),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      service,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: borderColor.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  time,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: borderColor.withOpacity(0.9),
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          Row(
            children: [
              CircleAvatar(
                radius: 8,
                backgroundImage: NetworkImage(doctorAvatar),
              ),
              const SizedBox(width: 6),
              Text(
                doctor,
                style: TextStyle(
                  fontSize: 10,
                  color: borderColor.withOpacity(0.8),
                ),
              ),
              if (status != null) ...[
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: borderColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      fontSize: 10,
                      color: borderColor.withOpacity(0.9),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
