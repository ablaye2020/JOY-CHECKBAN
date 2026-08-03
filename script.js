// ============================================
// CONFIGURATION API - BARON0 AVEC CLÉ
// ============================================
const API_KEY = 'bk_v1_9pCni731it5e7wTFtqKjzo7Wa4Eh0qUcPsuHToXVqH90bMwkAWnoSgnu0KiPpit4yknBnKrUBG3UUztSILklvgQ3RLYXmhfeLYInAqHXHkLketc8ts-XAa-0hnRPgLFOKt4s5CCIAJrCP3d8FmkA9Y5Lgec0ND3IF1Y-qwVFR05iX0-54TsqZFDcidMIMXIKbJ0drjNtwsUzIdI1Qnmn-RljDtJESd8bdqis7lngd0UmkemGzMx9IwoKkKp_JzcMqt3Eq0YYX33ulPvgSuHeRBSTGq3sZ3ynj71gPBmxQAKDgFgVidSg4OPVctV6fLdC8AnGxqyEriWWKUJPRamY72dwlbdKGDleZs26seZGN-crqP-At4A_TPNcS-S89SEIpewxz644vIy9-VJ9RHTYn5Ij5Lh9Jb1-6wkwxbI6CAzpR9DY5BY2xtpXexGa-dPE-rK2aeaSSa9zcdeEGhmftagsHm-IEpb0Ii2pdnLFW3UzpkVwekx5PU3yH61RUu4287GK29XsLTtEvYcgGDm2KCXDoVdmuR55XzRmkNHClv0ySB5vzRvzhyQE';

// L'URL de l'API avec votre clé
const API_URL = 'https://baron0.com/api/v1/check'; // À adapter selon leur documentation

// ============================================
// FONCTION DE VÉRIFICATION AVEC CLÉ API
// ============================================
async function checkNumber(number) {
    try {
        const formattedNumber = formatPhoneNumber(number);
        
        // ✅ APPEL À L'API AVEC LA CLÉ
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'X-API-Key': API_KEY, // Essaie aussi ce format
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                number: formattedNumber,
                // ou phone: formattedNumber
                // ou number: formattedNumber.replace('+', '')
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('📡 Réponse API:', data); // Pour voir ce que retourne l'API

        // ============================================
        // ADAPTEZ SELON LE FORMAT DE RÉPONSE
        // ============================================
        // Si l'API retourne { status: "banned", reason: "..." }
        const isExcluded = data.status === 'banned' || 
                          data.status === 'excluded' || 
                          data.status === 'blocked' ||
                          data.blocked === true;

        return {
            number: formattedNumber,
            isExcluded: isExcluded,
            status: isExcluded ? 'excluded' : 'valid',
            message: isExcluded 
                ? `🚫 ${data.reason || 'Banni'} ${data.ban_time ? '| 📅 '+data.ban_time : ''}` 
                : '✅ Numéro actif',
            reason: data.reason || data.message || null,
            banTime: data.ban_time || data.date || null,
            appealTime: data.appeal_time || null
        };

    } catch (error) {
        console.error(`❌ Erreur pour ${number}:`, error);
        return {
            number: formatPhoneNumber(number),
            isExcluded: null,
            status: 'error',
            message: `❌ ${error.message}`
        };
    }
}

// ============================================
// LE RESTE DU CODE (IDENTIQUE)
// ============================================
// ... Gardez tout le reste du code inchangé
