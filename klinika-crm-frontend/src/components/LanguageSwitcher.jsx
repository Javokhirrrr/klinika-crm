// Language switcher component
import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div style={styles.container}>
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={styles.select}
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

const styles = {
    container: {
        display: 'inline-block',
    },
    select: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        background: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        outline: 'none',
    },
};
