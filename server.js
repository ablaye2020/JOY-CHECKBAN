// ============================================
// SERVEUR BACKEND - POINT DE RELAIS
// ============================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Configuration
const PORT = 3000;
const BARON0_API = 'https://baron0.com/free';

// Middleware
app.use(cors()); // ✅ Permet à votre frontend d'appeler ce serveur
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTE PRINCIPALE - VÉRIFICATION
// ============================================
app.post('/check', async (req, res) => {
    try {
        const { number } = req.body;
        
        if (!number) {
            return res.status(400).json({
                error: 'Numéro requis',
                message: 'Veuillez fournir un numéro de téléphone'
            });
        }

        console.log(`📞 Vérification du numéro: ${number}`);

        // ============================================
        // APPEL À L'API BARON0
        // ============================================
        const response = await axios({
            method: 'POST',
            url: BARON0_API,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            data: {
                number: number
            },
            timeout: 30000 // 30 secondes
        });

        console.log('📡 Réponse de baron0:', response.data);

        // ============================================
        // ANALYSE ET FORMATAGE DE LA RÉPONSE
        // ============================================
        const data = response.data;
        
        // Déterminer si le numéro est exclu
        let isExcluded = false;
        let reason = '';
        let banTime = '';
        let appealTime = '';
        let status = '';

        // Analyser différents formats de réponse possibles
        if (data.status) {
            status = data.status;
            if (['banned', 'excluded', 'blocked', 'blacklisted'].includes(data.status.toLowerCase())) {
                isExcluded = true;
                reason = data.reason || data.message || 'Banni';
                banTime = data.ban_time || data.date || '';
                appealTime = data.appeal_time || '';
            } else if (['active', 'valid', 'clean', 'allowed'].includes(data.status.toLowerCase())) {
                isExcluded = false;
                reason = 'Numéro actif';
            }
        }

        // Vérifier si "excluded" ou "blocked" est un booléen
        if (data.excluded === true || data.blocked === true || data.isExcluded === true) {
            isExcluded = true;
            reason = data.reason || data.message || 'Banni';
            banTime = data.ban_time || data.date || '';
        }

        // Si le message contient des mots-clés
        if (data.message && typeof data.message === 'string') {
            const msg = data.message.toLowerCase();
            if (msg.includes('banned') || msg.includes('excluded') || msg.includes('blocked')) {
                isExcluded = true;
                reason = data.message;
            }
        }

        // Formatage de la réponse pour votre frontend
        const result = {
            number: number,
            isExcluded: isExcluded,
            status: isExcluded ? 'excluded' : 'valid',
            reason: reason || (isExcluded ? 'Banni' : 'Actif'),
            banTime: banTime || null,
            appealTime: appealTime || null,
            rawData: data, // Données brutes pour déboguer
            message: isExcluded 
                ? `🚫 ${reason || 'Banni'} ${banTime ? '| 📅 '+banTime : ''}`
                : '✅ Numéro actif'
        };

        console.log(`✅ Résultat pour ${number}: ${isExcluded ? 'EXCLU' : 'VALIDE'}`);
        res.json(result);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        
        // Gestion des erreurs spécifiques
        if (error.response) {
            // L'API a répondu avec une erreur
            console.error('📡 Réponse d\'erreur:', error.response.data);
            return res.status(error.response.status || 500).json({
                error: 'API_ERROR',
                message: error.response.data?.message || 'Erreur de l\'API baron0',
                details: error.response.data
            });
        } else if (error.request) {
            // Pas de réponse de l'API
            return res.status(503).json({
                error: 'NO_RESPONSE',
                message: 'L\'API baron0 ne répond pas',
                details: error.message
            });
        } else {
            // Autre erreur
            return res.status(500).json({
                error: 'SERVER_ERROR',
                message: 'Erreur interne du serveur',
                details: error.message
            });
        }
    }
});

// ============================================
// ROUTE DE TEST
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '🚀 Serveur Joy Boy Checker en ligne',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ROUTE D'INFO
// ============================================
app.get('/', (req, res) => {
    res.json({
        name: '☠️ Joy Boy Checker API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            check: '/check (POST)',
            info: '/'
        }
    });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
app.listen(PORT, () => {
    console.log(`
☠️  Joy Boy Checker - Serveur démarré !
====================================
📍 http://localhost:${PORT}
🏴‍☠️  API baron0: ${BARON0_API}
📡 En attente des requêtes...

➡️  POST /check - Vérifier un numéro
➡️  GET /health - Vérifier l'état du serveur
====================================
    `);
});
