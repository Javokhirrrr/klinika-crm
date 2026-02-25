class User {
  final String id;
  final String firstName;
  final String lastName;
  final String phone;
  final String role;
  final String? orgId;

  User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.role,
    this.orgId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'reception',
      orgId: json['orgId'] is Map ? json['orgId']['_id'] : json['orgId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'role': role,
      'orgId': orgId,
    };
  }
}
