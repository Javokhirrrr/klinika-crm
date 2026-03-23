import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Mahsulot nomi kiritilishi shart'],
    trim: true,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  category: {
    type: String,
    default: 'Umumiy',
  },
  quantity: {
    type: Number,
    default: 0,
    min: [0, 'Miqdor manfiy bo\'lishi mumkin emas'],
  },
  minQuantity: {
    type: Number,
    default: 10,
  },
  unit: {
    type: String,
    default: 'dona',
  },
  price: {
    type: Number,
    default: 0,
  },
  orgId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Organization',
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
});

inventoryItemSchema.index({ name: 'text', sku: 'text' });
inventoryItemSchema.index({ orgId: 1 });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

export default InventoryItem;
