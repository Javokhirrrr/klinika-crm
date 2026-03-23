import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.ObjectId,
    ref: 'InventoryItem',
    required: [true, 'Mahsulot ID si kiritilishi shart'],
  },
  type: {
    type: String,
    enum: {
      values: ['kirim', 'chiqim'],
      message: 'Tranzaksiya turi "kirim" yoki "chiqim" bo\'lishi kerak',
    },
    required: [true, 'Tranzaksiya turi kiritilishi shart'],
  },
  quantity: {
    type: Number,
    required: [true, 'Miqdor kiritilishi shart'],
    min: [0.01, 'Miqdor noldan katta bo\'lishi kerak']
  },
  note: {
    type: String,
    trim: true,
  },
  performedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  orgId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Organization',
  }
}, {
  timestamps: true,
});

inventoryTransactionSchema.index({ itemId: 1 });
inventoryTransactionSchema.index({ type: 1 });
inventoryTransactionSchema.index({ orgId: 1 });
inventoryTransactionSchema.index({ createdAt: -1 });

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

export default InventoryTransaction;
