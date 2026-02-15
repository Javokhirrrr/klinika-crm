// src/models/DoctorWallet.js
import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['earning', 'withdrawal', 'bonus', 'penalty', 'adjustment'],
            required: true
        },
        amount: { type: Number, required: true },
        description: { type: String, trim: true },
        relatedPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
        relatedAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
            default: 'completed'
        }
    },
    { timestamps: true, _id: true }
);

const DoctorWalletSchema = new mongoose.Schema(
    {
        orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", index: true, required: true },

        // Balanslar
        balance: { type: Number, default: 0, min: 0 },              // Joriy balans
        totalEarned: { type: Number, default: 0, min: 0 },          // Jami topgan
        totalWithdrawn: { type: Number, default: 0, min: 0 },       // Jami yechib olingan
        totalBonus: { type: Number, default: 0, min: 0 },           // Jami bonuslar
        totalPenalty: { type: Number, default: 0, min: 0 },         // Jami jarimalar

        // Tranzaksiyalar tarixi
        transactions: [TransactionSchema],

        // Oxirgi tranzaksiya
        lastTransactionDate: { type: Date },
        lastWithdrawalDate: { type: Date },

        // Statistika
        monthlyEarnings: [{
            year: Number,
            month: Number,
            amount: Number
        }],

        // Sozlamalar
        autoWithdrawal: { type: Boolean, default: false },
        minWithdrawalAmount: { type: Number, default: 0 },

        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Indekslar
DoctorWalletSchema.index({ orgId: 1, doctorId: 1 }, { unique: true });
DoctorWalletSchema.index({ orgId: 1, balance: -1 });
DoctorWalletSchema.index({ "transactions.createdAt": -1 });

// Balansni yangilash metodlari
DoctorWalletSchema.methods.addEarning = async function (amount, description, paymentId, appointmentId) {
    this.balance += amount;
    this.totalEarned += amount;
    this.transactions.push({
        type: 'earning',
        amount,
        description,
        relatedPaymentId: paymentId,
        relatedAppointmentId: appointmentId,
        status: 'completed'
    });
    this.lastTransactionDate = new Date();

    // Oylik statistika
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthlyIndex = this.monthlyEarnings.findIndex(m => m.year === year && m.month === month);
    if (monthlyIndex >= 0) {
        this.monthlyEarnings[monthlyIndex].amount += amount;
    } else {
        this.monthlyEarnings.push({ year, month, amount });
    }

    return this.save();
};

DoctorWalletSchema.methods.addWithdrawal = async function (amount, description, processedBy) {
    if (amount > this.balance) {
        throw new Error('Insufficient balance');
    }

    this.balance -= amount;
    this.totalWithdrawn += amount;
    this.transactions.push({
        type: 'withdrawal',
        amount: -amount,
        description,
        processedBy,
        status: 'completed'
    });
    this.lastTransactionDate = new Date();
    this.lastWithdrawalDate = new Date();

    return this.save();
};

DoctorWalletSchema.methods.addBonus = async function (amount, description, processedBy) {
    this.balance += amount;
    this.totalBonus += amount;
    this.transactions.push({
        type: 'bonus',
        amount,
        description,
        processedBy,
        status: 'completed'
    });
    this.lastTransactionDate = new Date();

    return this.save();
};

DoctorWalletSchema.methods.addPenalty = async function (amount, description, processedBy) {
    this.balance = Math.max(0, this.balance - amount);
    this.totalPenalty += amount;
    this.transactions.push({
        type: 'penalty',
        amount: -amount,
        description,
        processedBy,
        status: 'completed'
    });
    this.lastTransactionDate = new Date();

    return this.save();
};

export const DoctorWallet = mongoose.model("DoctorWallet", DoctorWalletSchema);
