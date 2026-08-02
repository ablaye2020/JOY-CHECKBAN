// Configuration de l'API
const API_URL = 'https://api.bk.com/v1/check'; // Remplacez par l'URL réelle de votre API
const API_KEY = 'bk_v1_9pCni731it5e7wTFtqKjzo7Wa4Eh0qUcPsuHToXVqH90bMwkAWnoSgnu0KiPpit4yknBnKrUBG3UUztSILklvgQ3RLYXmhfeLYInAqHXHkLketc8ts-XAa-0hnRPgLFOKt4s5CCIAJrCP3d8FmkA9Y5Lgec0ND3IF1Y-qwVFR05iX0-54TsqZFDcidMIMXIKbJ0drjNtwsUzIdI1Qnmn-RljDtJESd8bdqis7lngd0UmkemGzMx9IwoKkKp_JzcMqt3Eq0YYX33ulPvgSuHeRBSTGq3sZ3ynj71gPBmxQAKDgFgVidSg4OPVctV6fLdC8AnGxqyEriWWKUJPRamY72dwlbdKGDleZs26seZGN-crqP-At4A_TPNcS-S89SEIpewxz644vIy9-VJ9RHTYn5Ij5Lh9Jb1-6wkwxbI6CAzpR9DY5BY2xtpXexGa-dPE-rK2aeaSSa9zcdeEGhmftagsHm-IEpb0Ii2pdnLFW3UzpkVwekx5PU3yH61RUu4287GK29XsLTtEvYcgGDm2KCXDoVdmuR55XzRmkNHClv0ySB5vzRvzhyQE';

// Éléments DOM
const numbersInput = document.getElementById('numbersInput');
const checkBtn = document.getElementById('checkBtn');
const resultsList = document.getElementById('resultsList');
const totalCount = document.getElementById('totalCount');
const excludedCount = document.getElementById('excludedCount');
const validCount = document.getElementById('validCount');
const showExcluded = document.getElementById('showExcluded');
const showValid = document.getElementById('showValid');
const clearBtn = document.getElementById('clearBtn');

let results = [];
let isChecking = false;

// Fonction pour formater les numéros
function formatPhoneNumber(number) {
    // Nettoie le numéro (enlève les espaces, tirets, etc.)
    let clean = number.replace(/[\s\-\(\)]/g, '');
    
    // Si le numéro commence par +221, on le garde
    if (clean.startsWith('+221')) {
        return clean;
    }
    
    // Si le numéro commence par 221 sans +, on ajoute +
    if (clean.startsWith('221')) {
        return '+' + clean;
    }
    
    // Si c'est un numéro local (77, 70, 76, 78, etc.)
    if (clean.match(/^(77|70|76|78|75)\d{7}/)) {
        return '+221' + clean;
    }
    
    return clean;
}

// Fonction pour vérifier un numéro via l'API
async function checkNumber(number) {
    try {
        const formattedNumber = formatPhoneNumber(number);
        
        // Simulation d'appel API (remplacez par votre vraie API)
        // const response = await fetch(`${API_URL}?number=${formattedNumber}`, {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': `Bearer ${API_KEY}`,
        //         'Content-Type': 'application/json'
        //     }
        // });
        // const data = await response.json();
        
        // Simulation de réponse (à remplacer par votre vraie API)
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        
        // Simulation de résultat aléatoire (à remplacer par les données réelles de l'API)
        const isExcluded = Math.random() > 0.6;
        
        return {
            number: formattedNumber,
            isExcluded: isExcluded,
            status: isExcluded ? 'excluded' : 'valid',
            message: isExcluded ? 'Numéro exclu de WhatsApp' : 'Numéro valide'
        };
        
        // Exemple avec vraie API (décommentez et adaptez)
        /*
        return {
            number: formattedNumber,
            isExcluded: data.excluded || false,
            status: data.excluded ? 'excluded' : 'valid',
            message: data.message || (data.excluded ? 'Numéro exclu' : 'Numéro valide')
        };
        */
    } catch (error) {
        console.error(`Erreur pour ${number}:`, error);
        return {
            number: formatPhoneNumber(number),
            isExcluded: null,
            status: 'error',
            message: 'Erreur de vérification'
        };
    }
}

// Fonction pour vérifier tous les numéros
async function checkAllNumbers() {
    if (isChecking) return;
    
    const rawNumbers = numbersInput.value.split('\n')
        .map(n => n.trim())
        .filter(n => n.length > 0);
    
    if (rawNumbers.length === 0) {
        resultsList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                Entrez des numéros à vérifier
            </div>
        `;
        return;
    }
    
    isChecking = true;
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<span class="btn-icon">⏳</span> VÉRIFICATION...';
    
    results = [];
    resultsList.innerHTML = '';
    
    // Afficher les statuts de chargement
    rawNumbers.forEach((num, index) => {
        const item = document.createElement('div');
        item.className = 'result-item loading';
        item.id = `result-${index}`;
        item.innerHTML = `
            <span class="result-number">${formatPhoneNumber(num)}</span>
            <span class="result-status loading">⏳ Vérification...</span>
        `;
        resultsList.appendChild(item);
    });
    
    // Vérifier chaque numéro
    for (let i = 0; i < rawNumbers.length; i++) {
        const result = await checkNumber(rawNumbers[i]);
        results.push(result);
        updateResultItem(i, result);
        updateStats();
    }
    
    isChecking = false;
    checkBtn.disabled = false;
    checkBtn.innerHTML = '<span class="btn-icon">⚔️</span> VÉRIFIER';
}

// Fonction pour mettre à jour un élément de résultat
function updateResultItem(index, result) {
    const item = document.getElementById(`result-${index}`);
    if (!item) return;
    
    item.className = `result-item ${result.status}`;
    item.innerHTML = `
        <span class="result-number">${result.number}</span>
        <span class="result-status ${result.status}">
            ${result.status === 'excluded' ? '🚫 Exclu' : 
              result.status === 'valid' ? '✅ Valide' : 
              '❌ Erreur'}
        </span>
        ${result.message ? `<span style="font-size:0.8rem;color:#b8a58a;">${result.message}</span>` : ''}
    `;
}

// Fonction pour mettre à jour les statistiques
function updateStats() {
    const total = results.length;
    const excluded = results.filter(r => r.isExcluded === true).length;
    const valid = results.filter(r => r.isExcluded === false).length;
    
    totalCount.textContent = total;
    excludedCount.textContent = excluded;
    validCount.textContent = valid;
    
    // Appliquer les filtres
    applyFilters();
}

// Fonction pour appliquer les filtres
function applyFilters() {
    const showExcl = showExcluded.checked;
    const showVal = showValid.checked;
    
    document.querySelectorAll('.result-item').forEach((item, index) => {
        if (index >= results.length) return;
        const result = results[index];
        if (!result) return;
        
        if (result.status === 'excluded' && !showExcl) {
            item.style.display = 'none';
        } else if (result.status === 'valid' && !showVal) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
}

// Fonction pour effacer tout
function clearAll() {
    numbersInput.value = '';
    results = [];
    resultsList.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">☠️</span>
            Entrez des numéros pour commencer
        </div>
    `;
    totalCount.textContent = '0';
    excludedCount.textContent = '0';
    validCount.textContent = '0';
}

// Événements
checkBtn.addEventListener('click', checkAllNumbers);

clearBtn.addEventListener('click', clearAll);

showExcluded.addEventListener('change', applyFilters);
showValid.addEventListener('change', applyFilters);

// Enter pour lancer la vérification
numbersInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        checkAllNumbers();
    }
});

// Initialisation
clearAll();
