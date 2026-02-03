# 🗑️ Delete Confirmation System

O'chirish operatsiyalarida 8 xonali tasdiqlash kodi bilan ishlaydigan universal tizim.

## ✨ Xususiyatlar

- ✅ **8 xonali tasdiqlash kodi** - Har safar yangi random kod
- ✅ **Soft delete** - Ma'lumotlar bazadan o'chirilmaydi, faqat `isDeleted=true` bo'ladi
- ✅ **Universal** - Barcha entity'lar uchun ishlatish mumkin
- ✅ **Xavfsiz** - Tasodifiy o'chirishlar oldini oladi
- ✅ **Professional UI** - Zamonaviy, chiroyli dizayn

## 📦 Yaratilgan fayllar

1. **`DeleteConfirmModal.jsx`** - Universal confirmation modal
2. **`DeleteConfirmModal.css`** - Modal styling

## 🚀 Qanday ishlatish

### 1️⃣ Import qiling

```jsx
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
```

### 2️⃣ State yarating

```jsx
const [deleteData, setDeleteData] = useState(null);
```

### 3️⃣ Delete funksiyasini yarating

```jsx
function confirmDelete(item) {
  setDeleteData({
    itemName: item.name,           // O'chiriladigan element nomi
    itemType: 'bemorni',            // Element turi (o'zbekcha)
    onConfirm: async () => {
      await http.del(`/patients/${item._id}`);
      await load();  // Listni yangilash
    }
  });
}
```

### 4️⃣ Button'da chaqiring

```jsx
<button onClick={() => confirmDelete(patient)}>
  O'chirish
</button>
```

### 5️⃣ JSX'ga modal qo'shing

```jsx
<DeleteConfirmModal
  isOpen={!!deleteData}
  itemName={deleteData?.itemName}
  itemType={deleteData?.itemType}
  onConfirm={deleteData?.onConfirm}
  onCancel={() => setDeleteData(null)}
/>
```

## 📋 To'liq misol - Patients sahifasi

```jsx
// src/pages/Patients.jsx
import { useState, useEffect } from 'react';
import http from '../lib/http';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [deleteData, setDeleteData] = useState(null);

  async function loadPatients() {
    const data = await http.get('/patients');
    setPatients(data.items || []);
  }

  useEffect(() => {
    loadPatients();
  }, []);

  function confirmDelete(patient) {
    setDeleteData({
      itemName: `${patient.name} (${patient.phone})`,
      itemType: 'bemorni',
      onConfirm: async () => {
        await http.del(`/patients/${patient._id}`);
        await loadPatients();
      }
    });
  }

  async function restore(id) {
    await http.post(`/patients/${id}/restore`);
    await loadPatients();
  }

  return (
    <div className="page">
      <h1>Bemorlar</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Ism</th>
            <th>Telefon</th>
            <th>Status</th>
            <th>Amallar</th>
          </tr>
        </thead>
        <tbody>
          {patients.filter(p => !p.isDeleted).map(patient => (
            <tr key={patient._id}>
              <td>{patient.name}</td>
              <td>{patient.phone}</td>
              <td>{patient.isActive ? 'Faol' : 'Nofaol'}</td>
              <td>
                <button onClick={() => confirmDelete(patient)}>
                  O'chirish
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteData}
        itemName={deleteData?.itemName}
        itemType={deleteData?.itemType}
        onConfirm={deleteData?.onConfirm}
        onCancel={() => setDeleteData(null)}
      />
    </div>
  );
}
```

## 🎨 ItemType nomlari (o'zbekcha)

Turli entity'lar uchun to'g'ri nom ishlating:

| Entity | itemType |
|--------|----------|
| User | `foydalanuvchini` |
| Patient | `bemorni` |
| Doctor | `shifokorni` |
| Service | `xizmatni` |
| Appointment | `uchrashuvni` |
| Payment | `to'lovni` |
| Queue | `navbatni` |
| Commission | `foizni` |

## ⚙️ Backend (Soft Delete)

Backend allaqachon tayyor! Soft delete qo'llab-quvvatlaydi:

```javascript
// src/controllers/users.controller.js
export async function deleteUser(req, res) {
  try {
    const user = await User.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Email'ga timestamp qo'shish
    const timestamp = Date.now();
    const deletedEmail = `${user.email}.deleted.${timestamp}`;
    
    await User.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      { 
        $set: { 
          isDeleted: true, 
          isActive: false,
          email: deletedEmail  // Duplicate email oldini olish
        } 
      }
    );
    
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteUser error:', e);
    return res.status(500).json({ message: 'Internal error' });
  }
}
```

## ✅ Qo'shimcha qilinishi kerak sahifalar

Ushbu sahifalarda ham delete confirmation qo'shing:

- [ ] **Patients** (`/patients`)
- [ ] **Doctors** (`/doctors`)
- [ ] **Services** (`/services`)
- [ ] **Appointments** (`/appointments`)
- [ ] **Payments** (`/payments`)
- [ ] **Queue** (`/queue`)

## 🔒 Xavfsizlik

1. **8 xonali kod** - Tasodifiy o'chirishlar oldini oladi
2. **Soft delete** - Hech qachon ma'lumot yo'qolmaydi
3. **Restore funksiyasi** - O'chirilgan ma'lumotni qaytarish
4. **Email uniqueness** - O'chirilganda `.deleted.timestamp` qo'shiladi

## 📝 Keyingi qadamlar

1. Barcha sahifalarda `confirm()` o'rniga `DeleteConfirmModal` ishlating
2. Backend'da barcha entity'lar uchun soft delete tekshiring
3. Restore endpoint qo'shing (agar yo'q bo'lsa)

---

**Yaratilgan:** 2026-01-25
**Holati:** ✅ Users sahifasida amalga oshirildi
