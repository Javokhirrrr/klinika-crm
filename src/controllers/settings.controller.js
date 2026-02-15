import { Settings } from '../models/Settings.js';

// Get a setting by key
export async function get(req, res) {
    try {
        const { key } = req.params;
        const setting = await Settings.findOne({ key });

        // Return default values if not found (optional handling)
        if (!setting) {
            // Special case for receipt template default
            if (key === 'receipt_template') {
                return res.json({
                    key: 'receipt_template',
                    value: {
                        title: 'KLINIKA CRM',
                        address: 'Toshkent sh., Yunusobod t-ni',
                        phone: '+998 90 123 45 67',
                        footer: 'Xizmatlar uchun rahmat!\nSalomat bo\'ling!',
                        showLogo: true,
                        showDebt: true
                    }
                });
            }
            return res.status(404).json({ message: 'Setting not found' });
        }

        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update or create a setting
export async function update(req, res) {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const setting = await Settings.findOneAndUpdate(
            { key },
            { value, updatedBy: req.user._id },
            { new: true, upsert: true }
        );

        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
