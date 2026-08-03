// ============================================
// CONFIGURATION API - VOTRE CLÉ API
// ============================================
const API_KEY = 'bk_v1_9pCni731it5e7wTFtqKjzo7Wa4Eh0qUcPsuHToXVqH90bMwkAWnoSgnu0KiPpit4yknBnKrUBG3UUztSILklvgQ3RLYXmhfeLYInAqHXHkLketc8ts-XAa-0hnRPgLFOKt4s5CCIAJrCP3d8FmkA9Y5Lgec0ND3IF1Y-qwVFR05iX0-54TsqZFDcidMIMXIKbJ0drjNtwsUzIdI1Qnmn-RljDtJESd8bdqis7lngd0UmkemGzMx9IwoKkKp_JzcMqt3Eq0YYX33ulPvgSuHeRBSTGq3sZ3ynj71gPBmxQAKDgFgVidSg4OPVctV6fLdC8AnGxqyEriWWKUJPRamY72dwlbdKGDleZs26seZGN-crqP-At4A_TPNcS-S89SEIpewxz644vIy9-VJ9RHTYn5Ij5Lh9Jb1-6wkwxbI6CAzpR9DY5BY2xtpXexGa-dPE-rK2aeaSSa9zcdeEGhmftagsHm-IEpb0Ii2pdnLFW3UzpkVwekx5PU3yH61RUu4287GK29XsLTtEvYcgGDm2KCXDoVdmuR55XzRmkNHClv0ySB5vzRvzhyQE';

// ⚠️ METTEZ LA VRAIE URL DE VOTRE API ICI
const API_URL = 'https://votre-api.com/check'; 

// ============================================
// FONCTION DE VÉRIFICATION - APPEL RÉEL À L'API
// ============================================
async function checkNumber(number) {
    try {
        const formattedNumber = formatPhoneNumber(number);
        
        // ✅ APPEL RÉEL À VOTRE API
        const response = await fetch(API_URL, {
            method: 'POST', // ou GET selon votre API
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                number: formattedNumber
                // Ajoutez d'autres paramètres si votre API en demande
            })
        });

        // Vérifier si la réponse est OK
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // ============================================
        // ADAPTEZ SELON LE FORMAT DE RÉPONSE DE VOTRE API
        // ============================================
        
        // Exemple 1: Si votre API retourne { excluded: true/false }
        return {
            number: formattedNumber,
            isExcluded: data.excluded === true || data.isExcluded === true,
            status: (data.excluded === true || data.isExcluded === true) ? 'excluded' : 'valid',
            message: data.message || data.reason || ''
        };

        /* 
        // Exemple 2: Si votre API retourne { status: "blocked" }
        return {
            number: formattedNumber,
            isExcluded: data.status === 'blocked' || data.status === 'excluded',
            status: (data.status === 'blocked' || data.status === 'excluded') ? 'excluded' : 'valid',
            message: data.message || data.reason || ''
        };
        */

        /* 
        // Exemple 3: Si votre API retourne { data: { blocked: true } }
        return {
            number: formattedNumber,
            isExcluded: data.data?.blocked === true || data.data?.excluded === true,
            status: (data.data?.blocked === true || data.data?.excluded === true) ? 'excluded' : 'valid',
            message: data.data?.reason || data.message || ''
        };
        */

    } catch (error) {
        console.error(`❌ Erreur pour ${number}:`, error);
        return {
            number: formatPhoneNumber(number),
            isExcluded: null,
            status: 'error',
            message: `Erreur: ${error.message}`
        };
    }
}

// ============================================
// LE RESTE DU CODE EST IDENTIQUE
// ============================================
// ... (gardez tout le reste du code inchangé)
