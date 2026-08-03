// ============================================
// CONFIGURATION
// ============================================
const API_URL = 'https://baron0.com/free';

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
// ✅ VÉRIFIER UN NUMÉRO - VERSION SIMPLIFIÉE
// ============================================
async function checkNumber(number) {
    try {
        const formattedNumber = formatPhoneNumber(number);
        
        console.log(`📞 Vérification de: ${formattedNumber}`);
        
        // Essayer différentes méthodes
        let response;
        let data;
        
        // Méthode 1: POST avec FormData
        try {
            const formData = new FormData();
            formData.append('number', formattedNumber);
            
            response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });
            
            data = await response.json();
            console.log('📡 Réponse (POST FormData):', data);
        } catch (error1) {
            console.log('❌ Méthode 1 échouée, essai méthode 2...');
            
            // Méthode 2: POST avec JSON
            try {
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        number: formattedNumber
                    })
                });
                
                data = await response.json();
                console.log('📡 Réponse (POST JSON):', data);
            } catch (error2) {
                console.log('❌ Méthode 2 échouée, essai méthode 3...');
                
                // Méthode 3: GET avec paramètre
                response = await fetch(`${API_URL}?number=${formattedNumber}`, {
                    method: 'GET'
                });
                
                data = await response.json();
                console.log('📡 Réponse (GET):', data);
            }
        }

        // ============================================
        // ANALYSER LA RÉPONSE
        // ============================================
        
        // Essayer de trouver si le numéro est exclu
        let isExcluded = false;
        let reason = '';
        let banTime = '';
        
        // Vérifier différents formats de réponse possibles
        if (data.status === 'banned' || data.status === 'excluded' || data.status === 'blocked') {
            isExcluded = true;
        }
        
        if (data.excluded === true || data.blocked === true) {
            isExcluded = true;
        }
        
        if (data.isExcluded === true || data.isBlocked === true) {
            isExcluded = true;
        }
        
        // Chercher la raison
        reason = data.reason || data.message || data.msg || '';
        banTime = data.ban_time || data.date || data.time || '';
        
        // Si la réponse est un texte simple
        if (typeof data === 'string') {
            if (data.toLowerCase().includes('banned') || 
                data.toLowerCase().includes('excluded') ||
                data.toLowerCase().includes('blocked')) {
                isExcluded = true;
                reason = data;
            }
        }

        console.log(`✅ Résultat pour ${formattedNumber}: ${isExcluded ? 'EXCLU' : 'VALIDE'}`);

        return {
            number: formattedNumber,
            isExcluded: isExcluded,
            status: isExcluded ? 'excluded' : 'valid',
            message: isExcluded 
                ? `🚫 ${reason || 'Banni'} ${banTime ? '| 📅 '+banTime : ''}` 
                : '✅ Numéro actif',
            reason: reason,
            banTime: banTime,
            rawData: data // Pour déboguer
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
        
        // Petit délai pour ne pas surcharger l'API
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
            </div>
        `;
    }
    
    // Afficher les données brutes pour déboguer
    if (result.rawData) {
        extraInfo += `
            <div style="font-size:0.7rem;color:#665544;margin-top:3px;word-break:break-all;">
                📦 ${JSON.stringify(result.rawData).substring(0, 100)}
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
