# ⚡ PowerShell Execution Policy Fix

> PowerShell'da npm ishlamasligi muammosini hal qilish

---

## ❌ Muammo

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded 
because running scripts is disabled on this system.
```

---

## ✅ Yechim 1: PowerShell Policy O'zgartirish (Tavsiya)

### Administrator sifatida PowerShell oching:

1. **Start** tugmasini bosing
2. **PowerShell** yozing
3. **Sag tugma** → **Run as Administrator**

### Quyidagi buyruqni bajaring:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Savol chiqsa:** `Y` bosing va Enter

---

## ✅ Yechim 2: CMD (Command Prompt) Ishlatish

### CMD oching:

1. **Start** tugmasini bosing
2. **cmd** yozing
3. **Enter** bosing

### Backend ishga tushirish:

```cmd
cd c:\Users\user\Desktop\Klinika Crm
npm run dev
```

### Frontend ishga tushirish (yangi CMD):

```cmd
cd c:\Users\user\Desktop\Klinika Crm\klinika-crm-frontend
npm run dev
```

---

## ✅ Yechim 3: Git Bash Ishlatish

### Git Bash oching:

1. **Start** tugmasini bosing
2. **Git Bash** yozing
3. **Enter** bosing

### Backend:

```bash
cd /c/Users/user/Desktop/Klinika\ Crm
npm run dev
```

### Frontend:

```bash
cd /c/Users/user/Desktop/Klinika\ Crm/klinika-crm-frontend
npm run dev
```

---

## ✅ Yechim 4: VS Code Terminal Ishlatish

### VS Code'da:

1. **View** → **Terminal** (yoki `Ctrl + ~`)
2. Terminal dropdown → **Command Prompt** tanlang
3. Buyruqlarni bajaring

---

## 🎯 QUICK START (CMD)

### Terminal 1 (Backend):

```cmd
cd c:\Users\user\Desktop\Klinika Crm
npm run dev
```

**Kutilayotgan natija:**
```
✅ Server running on http://localhost:5000
✅ MongoDB connected
```

---

### Terminal 2 (Frontend):

```cmd
cd c:\Users\user\Desktop\Klinika Crm\klinika-crm-frontend
npm run dev
```

**Kutilayotgan natija:**
```
✅ VITE ready
✅ Local: http://localhost:5173
```

---

### Browser:

```
http://localhost:5173
```

---

## 📝 NOTES

- **CMD** yoki **Git Bash** ishlatish eng oson
- **PowerShell** ishlatish uchun policy o'zgartirish kerak
- **VS Code** terminal'da ham CMD tanlash mumkin

---

**Muvaffaqiyatli ishga tushiring!** 🚀
