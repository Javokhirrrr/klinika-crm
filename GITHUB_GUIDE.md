# 🔐 GitHub'ga Proyekt Yuklash - To'liq Qo'llanma

> **Maqsad:** Klinika CRM proyektini GitHub'ga xavfsiz yuklash

---

## 📋 **QADAMLAR RO'YXATI**

- [ ] 1. Git o'rnatish
- [ ] 2. GitHub account yaratish
- [ ] 3. Repository yaratish
- [ ] 4. Local git sozlash
- [ ] 5. Maxfiy fayllarni tekshirish
- [ ] 6. Commit qilish
- [ ] 7. GitHub'ga push qilish
- [ ] 8. Tekshirish

---

## 1️⃣ **GIT O'RNATISH**

### **Windows:**

```bash
# Git Bash orqali tekshirish
git --version

# Agar o'rnatilmagan bo'lsa:
# https://git-scm.com/download/win dan yuklab oling
```

### **Git konfiguratsiya:**

```bash
# Ismingizni sozlang
git config --global user.name "Sizning Ismingiz"

# Email'ingizni sozlang
git config --global user.email "your.email@example.com"

# Tekshirish
git config --list
```

---

## 2️⃣ **GITHUB ACCOUNT YARATISH**

1. https://github.com ga o'ting
2. "Sign up" tugmasini bosing
3. Email, username, parol kiriting
4. Email'ni tasdiqlang
5. 2FA yoqing (xavfsizlik uchun)

---

## 3️⃣ **GITHUB'DA REPOSITORY YARATISH**

### **Web orqali:**

1. GitHub'ga kiring
2. O'ng yuqoridagi "+" → "New repository"
3. **Repository name:** `klinika-crm`
4. **Description:** "Professional Clinic Management System"
5. **Visibility:** 
   - ✅ **Private** (tavsiya - maxfiy loyiha uchun)
   - ⚠️ Public (ochiq loyiha uchun)
6. ❌ **Initialize repository** - belgilamang (bizda allaqachon kod bor)
7. "Create repository" tugmasini bosing

### **Natija:**

GitHub sizga quyidagi ko'rsatmalarni beradi:

```bash
# ...or push an existing repository from the command line
git remote add origin https://github.com/YOUR_USERNAME/klinika-crm.git
git branch -M main
git push -u origin main
```

**Bu ko'rsatmalarni hozir ishlatmang!** Avval quyidagi qadamlarni bajaring.

---

## 4️⃣ **LOCAL GIT SOZLASH**

### **Proyekt papkasiga o'ting:**

```bash
cd "C:\Users\user\Desktop\Klinika Crm"
```

### **Git repository yaratish:**

```bash
# Git repository'ni initialize qilish
git init

# Tekshirish
git status
```

---

## 5️⃣ **MAXFIY FAYLLARNI TEKSHIRISH**

### **MUHIM! .env faylini tekshiring:**

```bash
# .env fayli .gitignore'da borligini tekshiring
cat .gitignore | grep .env

# Natija ko'rsatishi kerak:
# .env
# .env.*
```

### **Maxfiy ma'lumotlar:**

Quyidagi fayllar GitHub'ga yuklanmasligi kerak:
- ✅ `.env` - Environment variables
- ✅ `node_modules/` - Dependencies
- ✅ `uploads/` - Yuklangan fayllar
- ✅ `*.log` - Log fayllar
- ✅ `backups/` - Database backups

### **Tekshirish:**

```bash
# Git qaysi fayllarni ko'rayotganini ko'rish
git status

# Agar .env ko'rinsa - XATO!
# .gitignore'ni tekshiring
```

---

## 6️⃣ **COMMIT QILISH**

### **Barcha fayllarni qo'shish:**

```bash
# Barcha fayllarni staging'ga qo'shish
git add .

# Yoki faqat ma'lum fayllarni:
# git add src/
# git add klinika-crm-frontend/
# git add package.json
# git add README.md
```

### **Statusni tekshirish:**

```bash
git status

# Ko'rsatishi kerak:
# Changes to be committed:
#   (use "git rm --cached <file>..." to unstage)
#         new file:   README.md
#         new file:   src/index.js
#         ...
```

### **Commit qilish:**

```bash
git commit -m "Initial commit: Klinika CRM v1.0"

# Yoki batafsil:
git commit -m "feat: Initial commit with full CRM functionality

- Backend API with Express.js
- Frontend with React
- MongoDB integration
- Authentication system
- Patient management
- Appointment scheduling
- Payment processing
- Queue management
- Analytics dashboard
- Telegram bot integration"
```

---

## 7️⃣ **GITHUB'GA PUSH QILISH**

### **Remote repository qo'shish:**

```bash
# GitHub repository URL'ini qo'shing
git remote add origin https://github.com/YOUR_USERNAME/klinika-crm.git

# Tekshirish
git remote -v
```

### **Branch nomini o'zgartirish:**

```bash
# Master'dan Main'ga o'zgartirish (zamonaviy standart)
git branch -M main
```

### **Push qilish:**

```bash
# Birinchi marta push qilish
git push -u origin main

# GitHub username va parol so'raladi
# Yoki Personal Access Token (tavsiya)
```

### **Personal Access Token (PAT) yaratish:**

Agar parol ishlamasa (GitHub 2021'dan beri parolni qabul qilmaydi):

1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. "Generate new token"
4. **Note:** "Klinika CRM"
5. **Expiration:** 90 days (yoki No expiration)
6. **Scopes:** ✅ repo (barcha checkbox)
7. "Generate token"
8. **Token'ni nusxalang!** (Bir marta ko'rsatiladi)

Push qilishda:
- **Username:** GitHub username
- **Password:** Personal Access Token

---

## 8️⃣ **TEKSHIRISH**

### **GitHub'da tekshirish:**

1. https://github.com/YOUR_USERNAME/klinika-crm ga o'ting
2. Barcha fayllar ko'rinishi kerak
3. ❌ `.env` fayli ko'rinmasligi kerak
4. ✅ README.md ko'rinishi kerak

### **Local'da tekshirish:**

```bash
# Remote statusni ko'rish
git remote -v

# Branch'larni ko'rish
git branch -a

# Oxirgi commit'ni ko'rish
git log --oneline -5
```

---

## 🔄 **KEYINGI MARTA YANGILASH**

### **O'zgarishlarni push qilish:**

```bash
# 1. O'zgarishlarni ko'rish
git status

# 2. Fayllarni qo'shish
git add .

# 3. Commit qilish
git commit -m "feat: Add new feature"

# 4. Push qilish
git push

# Tayyor! GitHub'da yangilangan
```

---

## 🌿 **BRANCH'LAR BILAN ISHLASH**

### **Yangi feature uchun branch yaratish:**

```bash
# Yangi branch yaratish
git checkout -b feature/new-feature

# O'zgarishlar qilish...

# Commit qilish
git add .
git commit -m "feat: Add new feature"

# Push qilish
git push -u origin feature/new-feature

# GitHub'da Pull Request ochish
```

### **Main branch'ga merge qilish:**

```bash
# Main'ga qaytish
git checkout main

# Yangilanishlarni olish
git pull

# Branch'ni merge qilish
git merge feature/new-feature

# Push qilish
git push
```

---

## 📥 **BOSHQA KOMPYUTERDA CLONE QILISH**

### **Repository'ni yuklab olish:**

```bash
# Clone qilish
git clone https://github.com/YOUR_USERNAME/klinika-crm.git

# Papkaga o'tish
cd klinika-crm

# Dependencies o'rnatish
npm install
cd klinika-crm-frontend
npm install

# .env yaratish
cp .env.example .env
# .env'ni tahrirlang

# Ishga tushirish
npm run dev
```

---

## 🔐 **XAVFSIZLIK**

### **MUHIM QOIDALAR:**

1. ❌ **Hech qachon `.env` faylini GitHub'ga yuklamang!**
2. ❌ **API keys, passwords, secrets yuklamang!**
3. ❌ **Database dumps yuklamang!**
4. ✅ **`.gitignore` faylini doim tekshiring**
5. ✅ **`.env.example` yarating (maxfiy ma'lumotlarsiz)**
6. ✅ **Sensitive data uchun environment variables ishlating**

### **Agar .env yuklangan bo'lsa:**

```bash
# 1. .env'ni o'chirish
git rm --cached .env

# 2. .gitignore'ga qo'shish (agar yo'q bo'lsa)
echo ".env" >> .gitignore

# 3. Commit qilish
git add .gitignore
git commit -m "fix: Remove .env from git"

# 4. Push qilish
git push

# 5. GitHub'da .env faylini qo'lda o'chirish
# Repository → .env fayli → Delete file

# 6. MUHIM: .env'dagi barcha secretlarni o'zgartiring!
# (JWT secrets, API keys, passwords)
```

---

## 📊 **GIT COMMANDS CHEAT SHEET**

```bash
# Status
git status                    # O'zgarishlarni ko'rish
git log                       # Commit tarixini ko'rish
git log --oneline            # Qisqa tarix

# Qo'shish va Commit
git add .                     # Barcha fayllarni qo'shish
git add file.js              # Bitta faylni qo'shish
git commit -m "message"      # Commit qilish

# Push va Pull
git push                     # GitHub'ga yuklash
git pull                     # GitHub'dan olish

# Branch
git branch                   # Branch'larni ko'rish
git checkout -b new-branch   # Yangi branch yaratish
git checkout main            # Main'ga o'tish
git merge branch-name        # Merge qilish

# Undo
git reset HEAD file.js       # Unstage qilish
git checkout -- file.js      # O'zgarishlarni bekor qilish
git revert commit-hash       # Commit'ni bekor qilish

# Remote
git remote -v                # Remote'larni ko'rish
git remote add origin URL    # Remote qo'shish
```

---

## 🎯 **BEST PRACTICES**

### **Commit Messages:**

```bash
# Yaxshi:
git commit -m "feat: Add patient search functionality"
git commit -m "fix: Resolve appointment date bug"
git commit -m "docs: Update README with deployment guide"

# Yomon:
git commit -m "changes"
git commit -m "fix"
git commit -m "asdf"
```

### **Commit Types:**

- `feat:` - Yangi feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

---

## 🆘 **TROUBLESHOOTING**

### **Problem: Push qilish ishlamayapti**

```bash
# 1. Remote'ni tekshiring
git remote -v

# 2. Branch'ni tekshiring
git branch

# 3. Pull qilib ko'ring
git pull origin main

# 4. Qayta push qiling
git push origin main
```

### **Problem: Merge conflict**

```bash
# 1. Conflict'li fayllarni ko'ring
git status

# 2. Fayllarni qo'lda tahrirlang
# <<<<<<< HEAD
# ======= 
# >>>>>>> branch-name
# qismlarini to'g'rilang

# 3. Qo'shing va commit qiling
git add .
git commit -m "fix: Resolve merge conflict"
```

### **Problem: .env yuklangan**

Yuqoridagi "XAVFSIZLIK" bo'limiga qarang.

---

## ✅ **TAYYOR!**

Sizning proyektingiz endi GitHub'da! 🎉

**Keyingi qadamlar:**
1. ✅ README.md'ni tahrirlang (GitHub username'ni o'zgartiring)
2. ✅ Repository description qo'shing
3. ✅ Topics qo'shing (nodejs, react, mongodb, crm)
4. ✅ Star qo'ying o'z proyektingizga 😄
5. ✅ Boshqalar bilan ulashing!

---

**Omad! 🚀**
