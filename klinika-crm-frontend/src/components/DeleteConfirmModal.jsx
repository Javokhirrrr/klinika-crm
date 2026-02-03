// src/components/DeleteConfirmModal.jsx
import { useState, useEffect } from 'react';
import './DeleteConfirmModal.css';

/**
 * Universal delete confirmation modal with 8-digit code
 * 
 * Usage:
 * const [deleteData, setDeleteData] = useState(null);
 * 
 * // Show modal
 * setDeleteData({ 
 *   itemName: 'User Name', 
 *   onConfirm: () => handleDelete(id) 
 * });
 * 
 * // In JSX
 * <DeleteConfirmModal
 *   isOpen={!!deleteData}
 *   itemName={deleteData?.itemName}
 *   onConfirm={deleteData?.onConfirm}
 *   onCancel={() => setDeleteData(null)}
 * />
 */
export default function DeleteConfirmModal({
    isOpen,
    itemName = '',
    itemType = 'ma\'lumot',
    onConfirm,
    onCancel
}) {
    const [confirmCode, setConfirmCode] = useState('');
    const [userInput, setUserInput] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Generate random 8-digit code when modal opens
    useEffect(() => {
        if (isOpen) {
            const code = Math.floor(10000000 + Math.random() * 90000000).toString();
            setConfirmCode(code);
            setUserInput('');
            setError('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (userInput !== confirmCode) {
            setError('❌ Tasdiqlash kodi noto\'g\'ri! Iltimos, qaytadan kiriting.');
            setUserInput('');
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm();
            onCancel(); // Close modal on success
        } catch (err) {
            setError(err.message || 'O\'chirishda xatolik yuz berdi');
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (!isLoading) {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="delete-modal-overlay" onClick={handleCancel}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                <div className="delete-modal-header">
                    <h2>⚠️ O'chirishni tasdiqlash</h2>
                </div>

                <div className="delete-modal-body">
                    <div className="delete-warning">
                        <p>
                            Siz <strong>{itemType}</strong>ni o'chirmoqchisiz:
                        </p>
                        <div className="delete-item-name">
                            {itemName}
                        </div>
                    </div>

                    <div className="delete-info">
                        <p>
                            ⚠️ <strong>Diqqat:</strong> Bu {itemType} foydalanuvchilarga ko'rinmay qoladi,
                            lekin ma'lumotlar bazada saqlanadi.
                        </p>
                    </div>

                    <div className="confirmation-code-box">
                        <p className="code-label">Tasdiqlash uchun quyidagi kodni kiriting:</p>
                        <div className="confirmation-code">
                            {confirmCode}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="confirmInput">Tasdiqlash kodi</label>
                            <input
                                type="text"
                                id="confirmInput"
                                className={`form-control ${error ? 'error' : ''}`}
                                value={userInput}
                                onChange={(e) => {
                                    setUserInput(e.target.value.replace(/\D/g, '').slice(0, 8));
                                    setError('');
                                }}
                                placeholder="8 xonali kodni kiriting"
                                maxLength={8}
                                autoFocus
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            {error && <div className="error-message">{error}</div>}
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                ❌ Bekor qilish
                            </button>
                            <button
                                type="submit"
                                className="btn btn-danger"
                                disabled={isLoading || userInput.length !== 8}
                            >
                                {isLoading ? '⏳ O\'chirilmoqda...' : '🗑️ O\'chirish'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
