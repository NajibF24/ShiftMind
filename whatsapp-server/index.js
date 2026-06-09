const express = require('express');
const { Server } = require('socket.io');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const http = require('http');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

let waSocket = null;
let isConnected = false;
let currentQR = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
    
    waSocket = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    waSocket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('Scan the QR code above to log in to WhatsApp');
            try {
                currentQR = await QRCode.toDataURL(qr);
            } catch (err) {
                console.error('Failed to generate QR data url', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
            isConnected = false;
            currentQR = null;
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connection is open');
            isConnected = true;
            currentQR = null;
        }
    });

    waSocket.ev.on('creds.update', saveCreds);
}

// Ensure numbers have country code suffix
function formatWhatsAppNumber(number) {
    let formatted = number.replace(/\D/g, ''); // Remove non-digits
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substring(1); // Default to ID (+62)
    }
    if (!formatted.endsWith('@s.whatsapp.net')) {
        formatted += '@s.whatsapp.net';
    }
    return formatted;
}

// Socket.io integration
io.on('connection', (socket) => {
    console.log('Client connected via WebSocket:', socket.id);

    socket.on('message', async (data) => {
        const { to, body } = data;
        if (waSocket && isConnected) {
            try {
                const jid = formatWhatsAppNumber(to);
                await waSocket.sendMessage(jid, { text: body });
                console.log(`[WS] Message sent to ${to}`);
            } catch (error) {
                console.error(`[WS] Failed to send message to ${to}:`, error);
            }
        } else {
            console.log(`[WS] Cannot send message, WhatsApp not connected`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// REST HTTP endpoint fallback
app.post('/api/send', async (req, res) => {
    const { to, message } = req.body;
    
    if (!to || !message) {
        return res.status(400).json({ error: 'Missing to or message' });
    }

    if (!waSocket || !isConnected) {
        return res.status(503).json({ error: 'WhatsApp is not connected yet' });
    }

    try {
        const jid = formatWhatsAppNumber(to);
        await waSocket.sendMessage(jid, { text: message });
        console.log(`[REST] Message sent to ${to}`);
        return res.json({ status: 'sent', to });
    } catch (error) {
        console.error(`[REST] Failed to send message to ${to}:`, error);
        return res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
});

app.get('/api/status', (req, res) => {
    return res.json({ connected: isConnected, qr: currentQR });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WhatsApp Server running on port ${PORT}`);
    connectToWhatsApp();
});
