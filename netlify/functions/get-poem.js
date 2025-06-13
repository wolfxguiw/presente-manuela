exports.handler = async function(event, context) {
    const fetch = require('node-fetch');

    // A sua chave de API secreta virá do Netlify, não do código
    const apiKey = process.env.VITE_GEMINI_API_KEY; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const prompt = "Escreva um poema curto e romântico, com no máximo 4 versos, sobre girassóis que olham para a pessoa amada como se ela fosse o sol. Inclua gatos na cena.";
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            return { statusCode: apiResponse.status, body: apiResponse.statusText };
        }

        const result = await apiResponse.json();
        const poem = result.candidates[0]?.content?.parts[0]?.text || "Um poema de amor floresce aqui.";

        return {
            statusCode: 200,
            body: JSON.stringify({ poem })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};