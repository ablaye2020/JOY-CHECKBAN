// ============================================
// CONFIGURATION - UTILISE VOTRE SERVEUR
// ============================================
const API_URL = 'http://localhost:3000/check'; // ← Votre serveur local

// ============================================
// ÉLÉMENTS DOM
// ============================================
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

// ============================================
// FORMATER UN NUMÉRO
// ============================================
function formatPhoneNumber(number) {
    let clean = number.replace(/[\s\-\(\)]/g, '');
    
    if (clean.startsWith('+221')) {
        return clean;
    }
    
    if (clean.startsWith('221')) {
        return '+' + clean;
    }
    
    if (clean.match(/^(77|70|76|78|75)\d{7}/)) {
        return '+221' + clean;
    }
    
    return clean;
}

// ============================================
// ✅ VÉRIFIER UN NUMÉRO - APPEL À VOTRE SERVEUR
// ============================================
async function checkNumber(number) {
    try {
        const formattedNumber = formatPhoneNumber(number);
        
        console.log(`📞 Vérification de: ${formattedNumber}`);
        console.log(`🔗 Appel à: ${API_URL}`);

        // ✅ Appel à VOTRE serveur (pas de CORS)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                number: formattedNumber
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('📡 Réponse du serveur:', data);

        return {
            number: data.number || formattedNumber,
            isExcluded: data.isExcluded || false,
            status: data.status || (data.isExcluded ? 'excluded' : 'valid'),
            message: data.message || (data.isExcluded ? '🚫 Exclu' : '✅ Valide'),
            reason: data.reason || '',
            banTime: data.banTime || null,
            appealTime: data.appealTime || null,
            rawData: data.rawData || null
        };

    } catch (error) {
        console.error(`❌ Erreur pour ${number}:`, error);
        return {
            number: formatPhoneNumber(number),
            isExcluded: null,
            status: 'error',
            message: `❌ Erreur: ${error.message}`,
            rawData: null
        };
    }
}

// ============================================
// LE RESTE DU CODE EST IDENTIQUE
// ============================================
// (Gardez toutes les autres fonctions inchangées)
// checkAllNumbers(), updateResultItem(), updateStats(), etc.

// ============================================
// VÉRIFIER TOUS LES NUMÉROS
// ============================================
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
    
    for (let i = 0; i < rawNumbers.length; i++) {
        const result = await checkNumber(rawNumbers[i]);
        results.push(result);
        updateResultItem(i, result);
        updateStats();
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    isChecking = false;
    checkBtn.disabled = false;
    checkBtn.innerHTML = '<span class="btn-icon">⚔️</span> VÉRIFIER';
}

// ============================================
// METTRE À JOUR UN RÉSULTAT
// ============================================
function updateResultItem(index, result) {
    const item = document.getElementById(`result-${index}`);
    if (!item) return;
    
    const statusText = {
        'excluded': '🚫 Exclu',
        'valid': '✅ Valide',
        'error': '❌ Erreur'
    };
    
    let extraInfo = '';
    if (result.status === 'excluded' && result.reason) {
        extraInfo = `
            <div style="font-size:0.8rem;color:#ff6b6b;margin-top:5px;">
                ⚠️ ${result.reason} ${result.banTime ? '| 📅 '+result.banTime : ''}
                ${result.appealTime ? '| 📅 Appel: '+result.appealTime : ''}
            </div>
        `;
    }
    
    item.className = `result-item ${result.status}`;
    item.innerHTML = `
        <div style="display:flex;flex-direction:column;width:100%;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="result-number">${result.number}</span>
                <span class="result-status ${result.status}">${statusText[result.status] || '❓ Inconnu'}</span>
            </div>
            ${extraInfo}
            ${result.message && result.status !== 'excluded' ? `<span style="font-size:0.8rem;color:#b8a58a;">${result.message}</span>` : ''}
        </div>
    `;
}

// ============================================
// STATISTIQUES
// ============================================
function updateStats() {
    const total = results.length;
    const excluded = results.filter(r => r.isExcluded === true).length;
    const valid = results.filter(r => r.isExcluded === false).length;
    
    totalCount.textContent = total;
    excludedCount.textContent = excluded;
    validCount.textContent = valid;
    
    applyFilters();
}

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

// ============================================
// EFFACER
// ============================================
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

// ============================================
// ÉVÉNEMENTS
// ============================================
checkBtn.addEventListener('click', checkAllNumbers);
clearBtn.addEventListener('click', clearAll);
showExcluded.addEventListener('change', applyFilters);
showValid.addEventListener('change', applyFilters);

numbersInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        checkAllNumbers();
    }
});

// ============================================
// INITIALISATION
// ============================================
clearAll();

console.log('☠️ Joy Boy Checker chargé !');
console.log('🔗 API URL:', API_URL);
console.log('💡 Entrez un numéro et cliquez sur VÉRIFIER');
