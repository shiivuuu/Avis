/**
 * Translation service for Smart Reader.
 * Translates extracted text to Hindi or Gujarati, while preserving original source text.
 */

// Common vocabulary dictionary for offline fallback translation
const COMMON_DICTIONARY = {
  hi: {
    'stop': 'रोकें',
    'danger': 'खतरा',
    'caution': 'सावधानी',
    'entrance': 'प्रवेश द्वार',
    'exit': 'निकास द्वार',
    'push': 'धकेलें',
    'pull': 'खींचें',
    'open': 'खुला',
    'closed': 'बंद',
    'warning': 'चेतावनी',
    'hospital': 'अस्पताल',
    'pharmacy': 'दवा की दुकान',
    'medicine': 'दवा',
    'doctor': 'डॉक्टर',
    'stairs': 'सीढ़ियाँ',
    'elevator': 'लिफ्ट',
    'restroom': 'शौचालय',
    'toilet': 'शौचालय',
    'welcome': 'स्वागत है',
    'thank you': 'धन्यवाद',
    'please': 'कृपया',
    'ticket': 'टिकट',
    'bus': 'बस',
    'train': 'ट्रेन',
    'water': 'पानी',
    'food': 'भोजन',
    'chair': 'कुर्सी',
    'table': 'मेज़',
    'door': 'दरवाज़ा'
  },
  gu: {
    'stop': 'થોભો',
    'danger': 'જોખમ',
    'caution': 'સાવધાન',
    'entrance': 'પ્રવેશ દ્વાર',
    'exit': 'બહાર નીકળવાનો રસ્તો',
    'push': 'ધકેલો',
    'pull': 'ખેંચો',
    'open': 'ખુલ્લું',
    'closed': 'બંધ',
    'warning': 'ચેતવણી',
    'hospital': 'હોસ્પિટલ',
    'pharmacy': 'દવાની દુકાન',
    'medicine': 'દવા',
    'doctor': 'ડૉક્ટર',
    'stairs': 'પગથિયાં',
    'elevator': 'લિફ્ટ',
    'restroom': 'શૌચાલય',
    'toilet': 'શૌચાલય',
    'welcome': 'સ્વાગત છે',
    'thank you': 'આભાર',
    'please': 'કૃપા કરીને',
    'ticket': 'ટિકિટ',
    'bus': 'બસ',
    'train': 'ટ્રેન',
    'water': 'પાણી',
    'food': 'ખોરાક',
    'chair': 'ખુરશી',
    'table': 'ટેબલ',
    'door': 'દરવાજો'
  }
};

export async function translateText(text, targetLang = 'hi', backendUrl = '') {
  if (!text || !text.trim() || targetLang === 'en') {
    return {
      original: text,
      translated: text,
      lang: 'en',
      provider: 'none'
    };
  }

  const cleanText = text.trim();

  // Try free Google Translate proxy endpoint first if connected
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanText)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translatedParts = data[0]?.map(part => part[0]).filter(Boolean);
      if (translatedParts && translatedParts.length > 0) {
        return {
          original: cleanText,
          translated: translatedParts.join(' '),
          lang: targetLang,
          provider: 'online'
        };
      }
    }
  } catch (err) {
    console.warn('Online translation unavailable, using offline dictionary fallback:', err);
  }

  // Fallback: Word by word dictionary replacement
  const dict = COMMON_DICTIONARY[targetLang] || {};
  let translated = cleanText;

  Object.entries(dict).forEach(([enWord, localizedWord]) => {
    const regex = new RegExp(`\\b${enWord}\\b`, 'gi');
    translated = translated.replace(regex, localizedWord);
  });

  return {
    original: cleanText,
    translated,
    lang: targetLang,
    provider: 'offline-dictionary'
  };
}
