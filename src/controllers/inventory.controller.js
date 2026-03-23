import InventoryItem from '../models/InventoryItem.js';
import InventoryTransaction from '../models/InventoryTransaction.js';

// --- ITEMS ---

export const getItems = async (req, res) => {
  try {
    const { lowStock, category, search, isActive } = req.query;
    const filter = {}; 
    if (req.user?.orgId) filter.orgId = req.user.orgId;

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

    if (lowStock === 'true') {
      items = items.filter(item => item.quantity <= item.minQuantity);
    }

    res.status(200).json({
      status: 'success',
      results: items.length,
      items,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    res.status(200).json({ status: 'success', item });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const createItem = async (req, res) => {
  try {
    const newItem = await InventoryItem.create({
      ...req.body,
      orgId: req.user?.orgId,
    });
    res.status(201).json({ status: 'success', item: newItem });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    res.status(200).json({ status: 'success', item: updatedItem });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }

    await InventoryItem.findByIdAndDelete(req.params.id);

    res.status(204).json({ status: 'success', data: null });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// --- TRANSACTIONS ---

export const getTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.orgId) filter.orgId = req.user.orgId;
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
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const { itemId, type, quantity, note } = req.body;

    if (!itemId || !type || !quantity) {
      return res.status(400).json({ message: 'Barcha majburiy maydonlarni to\'ldiring' });
    }

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }

    if (type === 'chiqim' && item.quantity < quantity) {
      return res.status(400).json({ 
        message: `Omborda faqat ${item.quantity} ${item.unit} mavjud. Yetarli emas.` 
      });
    }

    const qtyChange = type === 'kirim' ? quantity : -quantity;
    item.quantity += qtyChange;
    await item.save();

    const transaction = await InventoryTransaction.create({
      itemId,
      type,
      quantity,
      note,
      performedBy: req.user?._id,
      orgId: req.user?.orgId,
    });

    res.status(201).json({
      status: 'success',
      transaction,
      updatedItem: item
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
