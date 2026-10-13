import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Globe, Search, X, Check, RotateCcw } from 'lucide-react';

export const ALL_SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'af', label: 'Afrikaans', native: 'Afrikaans' },
  { code: 'sq', label: 'Albanian', native: 'Shqip' },
  { code: 'am', label: 'Amharic', native: 'አማርኛ' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'hy', label: 'Armenian', native: 'Հայերեն' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
  { code: 'ay', label: 'Aymara', native: 'Aymar aru' },
  { code: 'az', label: 'Azerbaijani', native: 'Azərbaycan' },
  { code: 'bm', label: 'Bambara', native: 'Bamanankan' },
  { code: 'eu', label: 'Basque', native: 'Euskara' },
  { code: 'be', label: 'Belarusian', native: 'Беларуская' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'bho', label: 'Bhojpuri', native: 'भोजपुरी' },
  { code: 'bs', label: 'Bosnian', native: 'Bosanski' },
  { code: 'bg', label: 'Bulgarian', native: 'Български' },
  { code: 'ca', label: 'Catalan', native: 'Català' },
  { code: 'ceb', label: 'Cebuano', native: 'Cebuano' },
  { code: 'ny', label: 'Chichewa', native: 'Chichewa' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', native: '简体中文' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', native: '繁體中文' },
  { code: 'co', label: 'Corsican', native: 'Corsu' },
  { code: 'hr', label: 'Croatian', native: 'Hrvatski' },
  { code: 'cs', label: 'Czech', native: 'Čeština' },
  { code: 'da', label: 'Danish', native: 'Dansk' },
  { code: 'dv', label: 'Dhivehi', native: 'ދިވެހި' },
  { code: 'doi', label: 'Dogri', native: 'डोगरी' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands' },
  { code: 'eo', label: 'Esperanto', native: 'Esperanto' },
  { code: 'et', label: 'Estonian', native: 'Eesti' },
  { code: 'ee', label: 'Ewe', native: 'Eʋegbe' },
  { code: 'tl', label: 'Filipino (Tagalog)', native: 'Filipino' },
  { code: 'fi', label: 'Finnish', native: 'Suomi' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'fy', label: 'Frisian', native: 'Frysk' },
  { code: 'gl', label: 'Galician', native: 'Galego' },
  { code: 'ka', label: 'Georgian', native: 'ქართული' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά' },
  { code: 'gn', label: 'Guarani', native: 'Avañe\'ẽ' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ht', label: 'Haitian Creole', native: 'Kreyòl ayisyen' },
  { code: 'ha', label: 'Hausa', native: 'Hausa' },
  { code: 'haw', label: 'Hawaiian', native: 'ʻŌlelo Hawaiʻi' },
  { code: 'iw', label: 'Hebrew', native: 'עברית' },
  { code: 'hmn', label: 'Hmong', native: 'Hmoob' },
  { code: 'hu', label: 'Hungarian', native: 'Magyar' },
  { code: 'is', label: 'Icelandic', native: 'Íslenska' },
  { code: 'ig', label: 'Igbo', native: 'Asụsụ Igbo' },
  { code: 'ilo', label: 'Ilocano', native: 'Ilokano' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ga', label: 'Irish', native: 'Gaeilge' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'jw', label: 'Javanese', native: 'Basa Jawa' },
  { code: 'kk', label: 'Kazakh', native: 'Қазақша' },
  { code: 'km', label: 'Khmer', native: 'ភាសាខ្មែរ' },
  { code: 'rw', label: 'Kinyarwanda', native: 'Ikinyarwanda' },
  { code: 'gom', label: 'Konkani', native: 'कोंकणी' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'kri', label: 'Krio', native: 'Krio' },
  { code: 'ku', label: 'Kurdish (Kurmanji)', native: 'Kurdî' },
  { code: 'ckb', label: 'Kurdish (Sorani)', native: 'کوردی' },
  { code: 'ky', label: 'Kyrgyz', native: 'Кыргызча' },
  { code: 'lo', label: 'Lao', native: 'ພາສາລາວ' },
  { code: 'la', label: 'Latin', native: 'Latina' },
  { code: 'lv', label: 'Latvian', native: 'Latviešu' },
  { code: 'ln', label: 'Lingala', native: 'Lingála' },
  { code: 'lt', label: 'Lithuanian', native: 'Lietuvių' },
  { code: 'lg', label: 'Luganda', native: 'Oluganda' },
  { code: 'lb', label: 'Luxembourgish', native: 'Lëtzebuergesch' },
  { code: 'mk', label: 'Macedonian', native: 'Македонски' },
  { code: 'mai', label: 'Maithili', native: 'मैथिली' },
  { code: 'mg', label: 'Malagasy', native: 'Malagasy' },
  { code: 'ms', label: 'Malay', native: 'Bahasa Melayu' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'mt', label: 'Maltese', native: 'Malti' },
  { code: 'mi', label: 'Maori', native: 'Te Reo Māori' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'mni-Mtei', label: 'Meiteilon (Manipuri)', native: 'ꯃꯤꯇꯩꯂꯣꯟ' },
  { code: 'lus', label: 'Mizo', native: 'Mizo ṭawng' },
  { code: 'mn', label: 'Mongolian', native: 'Монгол' },
  { code: 'my', label: 'Myanmar (Burmese)', native: 'မြန်မာစာ' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली' },
  { code: 'no', label: 'Norwegian', native: 'Norsk' },
  { code: 'or', label: 'Odia (Oriya)', native: 'ଓଡ଼ିଆ' },
  { code: 'om', label: 'Oromo', native: 'Afaan Oromoo' },
  { code: 'ps', label: 'Pashto', native: 'پښتو' },
  { code: 'fa', label: 'Persian', native: 'فارسی' },
  { code: 'pl', label: 'Polish', native: 'Polski' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'qu', label: 'Quechua', native: 'Runasimi' },
  { code: 'ro', label: 'Romanian', native: 'Română' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'sm', label: 'Samoan', native: 'Gagana Samoa' },
  { code: 'sa', label: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'gd', label: 'Scots Gaelic', native: 'Gàidhlig' },
  { code: 'nso', label: 'Sepedi', native: 'Sesotho sa Leboa' },
  { code: 'sr', label: 'Serbian', native: 'Српски' },
  { code: 'st', label: 'Sesotho', native: 'Sesotho' },
  { code: 'sn', label: 'Shona', native: 'chiShona' },
  { code: 'sd', label: 'Sindhi', native: 'سنڌي' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල' },
  { code: 'sk', label: 'Slovak', native: 'Slovenčina' },
  { code: 'sl', label: 'Slovenian', native: 'Slovenščina' },
  { code: 'so', label: 'Somali', native: 'Soomaaliga' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'su', label: 'Sundanese', native: 'Basa Sunda' },
  { code: 'sw', label: 'Swahili', native: 'Kiswahili' },
  { code: 'sv', label: 'Swedish', native: 'Svenska' },
  { code: 'tg', label: 'Tajik', native: 'Тоҷикӣ' },
  { code: 'tt', label: 'Tatar', native: 'Татар теле' },
  { code: 'th', label: 'Thai', native: 'ไทย' },
  { code: 'ti', label: 'Tigrinya', native: 'ትግርኛ' },
  { code: 'ts', label: 'Tsonga', native: 'Xitsonga' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'tk', label: 'Turkmen', native: 'Türkmençe' },
  { code: 'ak', label: 'Twi', native: 'Twi' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'ug', label: 'Uyghur', native: 'ئۇيغۇرچە' },
  { code: 'uz', label: 'Uzbek', native: 'Oʻzbekcha' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'cy', label: 'Welsh', native: 'Cymraeg' },
  { code: 'xh', label: 'Xhosa', native: 'isiXhosa' },
  { code: 'yi', label: 'Yiddish', native: 'ייִדיש' },
  { code: 'yo', label: 'Yoruba', native: 'Èdè Yorùbá' },
  { code: 'zu', label: 'Zulu', native: 'isiZulu' }
];

export default function LanguageSelector({ compact = false }) {
  const [selectedLang, setSelectedLang] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Read existing translation cookie if set
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith('googtrans=')) {
        const val = trimmed.substring('googtrans='.length);
        const parts = val.split('/');
        const lang = parts[parts.length - 1];
        if (lang) setSelectedLang(lang);
      }
    }

    // Observer to prevent Google Translate from shifting the layout with top: 40px
    const observer = new MutationObserver(() => {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      if (document.documentElement.style.top && document.documentElement.style.top !== '0px') {
        document.documentElement.style.top = '0px';
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    // Check if Google Translate script already exists
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              autoDisplay: false,
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
            },
            'google_translate_element'
          );
        }
      };
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle outside click & escape key to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const changeLanguage = (langCode) => {
    setSelectedLang(langCode);
    setIsOpen(false);
    setSearchQuery('');
    
    // Set cookies for path and domain
    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=/en/en; path=/;';
      if (window.location.hostname && window.location.hostname !== 'localhost') {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
        document.cookie = `googtrans=/en/en; path=/; domain=.${window.location.hostname};`;
      }
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      if (window.location.hostname && window.location.hostname !== 'localhost') {
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${window.location.hostname};`;
      }
    }
    
    // Trigger google translate combo box change
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode === 'en' ? '' : langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SUPPORTED_LANGUAGES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_SUPPORTED_LANGUAGES.filter(
      l => l.label.toLowerCase().includes(q) ||
           l.native.toLowerCase().includes(q) ||
           l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentLang = ALL_SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || ALL_SUPPORTED_LANGUAGES[0];

  return (
    <div ref={dropdownRef} className="notranslate" translate="no" style={{ position: 'relative', display: 'inline-block' }}>
      {/* Hidden container for Google Translate Engine */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: compact ? '4px 9px' : '6px 12px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(0, 129, 167, 0.2)' : 'none'
        }}
        title="Change Platform Language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe size={14} color="var(--primary)" />
        <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentLang.native}
        </span>
        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {currentLang.code.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.15))',
            zIndex: 9999,
            width: '260px',
            maxWidth: '90vw',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Header & Reset to English */}
          <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-hover)' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Language ({ALL_SUPPORTED_LANGUAGES.length})
            </span>
            {selectedLang !== 'en' && (
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 4px',
                  borderRadius: '3px'
                }}
                title="Reset to default English"
              >
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>

          {/* Instant Search Bar */}
          <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 24px 5px 26px',
                  fontSize: '0.775rem',
                  borderRadius: '5px',
                  border: '1px solid var(--border)',
                  background: 'var(--input-bg, var(--card-bg))',
                  color: 'var(--text)',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Language List */}
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: '4px 0'
            }}
          >
            {filteredLanguages.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                No language found matching "{searchQuery}"
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => changeLanguage(lang.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 12px',
                      background: isSelected ? 'rgba(0, 129, 167, 0.12)' : 'transparent',
                      border: 'none',
                      color: isSelected ? 'var(--primary)' : 'var(--text)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s ease',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.825rem', color: isSelected ? 'var(--primary)' : 'var(--text)', fontWeight: isSelected ? 700 : 600 }}>
                        {lang.native}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {lang.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: '3px' }}>
                        {lang.code}
                      </span>
                      {isSelected && <Check size={14} color="var(--primary)" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
