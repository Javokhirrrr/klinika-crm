import InventoryItem from '../models/InventoryItem.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

// --- ITEMS ---

export const getItems = catchAsync(async (req, res, next) => {
  const { lowStock, category, search, isActive } = req.query;
  const filter = {}; // You can add req.user.orgId here if multi-tenant

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }

  let items = await InventoryItem.find(filter).sort({ createdAt: -1 });

  // Agar minQuantity ostida bo'lganlarni filtrlash so'ralsa:
  if (lowStock === 'true') {
    items = items.filter(item => item.quantity <= item.minQuantity);
  }

  res.status(200).json({
    status: 'success',
    results: items.length,
    items,
  });
});

export const getItem = catchAsync(async (req, res, next) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) {
    return next(new AppError('Mahsulot topilmadi', 404));
  }
  res.status(200).json({ status: 'success', item });
});

export const createItem = catchAsync(async (req, res, next) => {
  const newItem = await InventoryItem.create({
    ...req.body,
    orgId: req.user?.orgId, // if multi-tenant
  });
  res.status(201).json({ status: 'success', item: newItem });
});

export const updateItem = catchAsync(async (req, res, next) => {
  const updatedItem = await InventoryItem.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedItem) {
    return next(new AppError('Mahsulot topilmadi', 404));
  }
  res.status(200).json({ status: 'success', item: updatedItem });
});

export const deleteItem = catchAsync(async (req, res, next) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) {
    return next(new AppError('Mahsulot topilmadi', 404));
  }

  // Soft delete yoki butunlay o'chirish
  // item.isActive = false; await item.save(); Yoki db dan olib tashlash:
  await InventoryItem.findByIdAndDelete(req.params.id);

  res.status(204).json({ status: 'success', data: null });
});

// --- TRANSACTIONS ---

export const getTransactions = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.itemId) filter.itemId = req.query.itemId;
  if (req.query.type) filter.type = req.query.type;

  const transactions = await InventoryTransaction.find(filter)
    .populate('itemId', 'name sku unit')
    .populate('performedBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    status: 'success',
    results: transactions.length,
    transactions,
  });
});

export const addTransaction = catchAsync(async (req, res, next) => {
  const { itemId, type, quantity, note } = req.body;

  if (!itemId || !type || !quantity) {
    return next(new AppError('Barcha majburiy maydonlarni to\'ldiring', 400));
  }

  const item = await InventoryItem.findById(itemId);
  if (!item) {
    return next(new AppError('Mahsulot topilmadi', 404));
  }

  // "chiqim" tranzaksiyasida omborda yetarli mahsulot bormi tekshirish
  if (type === 'chiqim' && item.quantity < quantity) {
    return next(new AppError(`Omborda faqat ${item.quantity} ${item.unit} mavjud. Yetarli emas.`, 400));
  }

  // Atomik miqdor o'zgarishi
  const qtyChange = type === 'kirim' ? quantity : -quantity;
  item.quantity += qtyChange;
  await item.save();

  // Tranzaksiyani yaratish
  const transaction = await InventoryTransaction.create({
    itemId,
    type,
    quantity,
    note,
    performedBy: req.user?._id,
    orgId: req.user?.orgId, // if multi-tenant
  });

  res.status(201).json({
    status: 'success',
    transaction,
    updatedItem: item
  });
});
