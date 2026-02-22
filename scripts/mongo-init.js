// scripts/mongo-init.js
// Docker konteyner birinchi marta ishga tushganda avtomatik bajariladi

db = db.getSiblingDB('klinika_crm');

// Asosiy indekslarni yaratish
db.createCollection('users');
db.createCollection('patients');
db.createCollection('appointments');
db.createCollection('payments');
db.createCollection('queue_entries');

print('✅ MongoDB klinika_crm database initialized');
