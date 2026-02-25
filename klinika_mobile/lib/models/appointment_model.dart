class Appointment {
  final String id;
  final String patientId;
  final String patientName;
  final String patientPhone;
  final String doctorId;
  final String doctorName;
  final String date; // YYYY-MM-DD
  final String time; // HH:mm
  final String status;
  final String cause;

  Appointment({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.patientPhone,
    required this.doctorId,
    required this.doctorName,
    required this.date,
    required this.time,
    required this.status,
    required this.cause,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['_id'] ?? '',
      patientId: json['patientId']?['_id'] ?? '',
      patientName: '${json['patientId']?['firstName'] ?? ''} ${json['patientId']?['lastName'] ?? ''}'.trim(),
      patientPhone: json['patientId']?['phone'] ?? '',
      doctorId: json['doctor']?['_id'] ?? json['doctorId']?['_id'] ?? '',
      doctorName: '${json['doctor']?['firstName'] ?? json['doctorId']?['firstName'] ?? ''} ${json['doctor']?['lastName'] ?? json['doctorId']?['lastName'] ?? ''}'.trim().isEmpty ? 'Noma\'lum shifokor' : '${json['doctor']?['firstName'] ?? json['doctorId']?['firstName'] ?? ''} ${json['doctor']?['lastName'] ?? json['doctorId']?['lastName'] ?? ''}'.trim(),
      date: json['date'] ?? (json['startsAt'] != null ? json['startsAt'].toString().split('T')[0] : ''),
      time: json['time'] ?? (json['startsAt'] != null ? json['startsAt'].toString().split('T')[1].substring(0, 5) : ''),
      status: json['status'] ?? 'scheduled',
      cause: json['note'] ?? json['cause'] ?? 'Birlamchi ko\'rik',
    );
  }
}
