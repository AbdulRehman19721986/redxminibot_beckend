/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *****************************************************************************/

// ==================== Game Logic ====================
class CoinFlip {
    constructor(creator) {
        this.players = [creator, null];
        this.choices = [null, null];
        this.stage = 'waiting'; // waiting, choosing, flipping, done
        this.winner = null;
        this.bet = 0;
    }

    join(player) {
        if (this.players[1]) return { error: 'Game is full' };
        this.players[1] = player;
        this.stage = 'choosing';
        return { success: true };
    }

    choose(player, choice) {
        const idx = this.players.indexOf(player);
        if (idx === -1) return { error: 'Not a player' };
        if (this.stage !== 'choosing') return { error: 'Not choosing phase' };
        if (choice !== 'heads' && choice !== 'tails') return { error: 'Choose heads or tails' };

        this.choices[idx] = choice;
        
        if (this.choices[0] && this.choices[1]) {
            this.stage = 'flipping';
        }
        return { success: true, both: this.choices[0] && this.choices[1] };
    }

    flip() {
        if (this.stage !== 'flipping') return { error: 'Not flipping phase' };
        
        // Animated flip sequence
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        // Determine winner
        if (this.choices[0] === result && this.choices[1] === result) {
            // Both guessed same, tie
            this.winner = null;
        } else if (this.choices[0] === result) {
            this.winner = this.players[0];
        } else if (this.choices[1] === result) {
            this.winner = this.players[1];
        }
        
        this.stage = 'done';
        return { success: true, result };
    }

    getDisplayBoard(flipping = false) {
        const player1Name = this.players[0]?.split('@')[0] || 'Waiting';
        const player2Name = this.players[1]?.split('@')[0] || 'Waiting';

        let status = '';
        if (this.stage === 'waiting') {
            status = `⏳ Waiting for opponent...\nJoin with \`.coin join\``;
        } else if (this.stage === 'choosing') {
            status = `🪙 Choose heads or tails:\n`;
            if (!this.choices[0]) status += `• ${player1Name}: waiting\n`;
            else status += `• ${player1Name}: ✅ chosen\n`;
            if (!this.choices[1]) status += `• ${player2Name}: waiting\n`;
            else status += `• ${player2Name}: ✅ chosen\n`;
            status += `\nUse \`.coin heads\` or \`.coin tails\``;
        } else if (this.stage === 'flipping') {
            status = flipping ? `🪙 *FLIPPING...*` : `🪙 Ready to flip! Use \`.coin flip\``;
        } else if (this.stage === 'done') {
            if (this.winner) {
                const winnerName = this.winner.split('@')[0];
                status = `🎉 *${winnerName} wins!* 🎉`;
            } else {
                status = `🤝 *It's a tie!* 🤝`;
            }
        }

        return `🪙 *COIN FLIP DUEL* 🪙\n\n` +
               `${player1Name}  vs  ${player2Name}\n\n` +
               status;
    }
}

// ==================== Storage ====================
const games = new Map(); // key = `coin-${chatId}`

module.exports = {
    command: 'coin',
    aliases: ['coinflip', 'flip'],
    category: 'games',
    description: 'Flip a coin against another player.',
    usage: 
        '.coin start                 – Start a new game\n' +
        '.coin join                   – Join waiting game\n' +
        '.coin heads / .coin tails    – Choose your side\n' +
        '.coin flip                    – Flip the coin\n' +
        '.coin guide                    – Show game guide',
    groupOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const senderId = (context.senderId || message.key.participant || message.key.remoteJid).split(':')[0];
        const channelInfo = context.channelInfo || {};

        const reply = async (text, mentions = []) => 
            await sock.sendMessage(chatId, { text, mentions, ...channelInfo }, { quoted: message });

        if (args.length === 0) {
            return await reply(
                `🪙 *Coin Flip Commands*\n\n` +
                `• \`.coin start\` – Host a new game\n` +
                `• \`.coin join\` – Join waiting game\n` +
                `• \`.coin heads/tails\` – Choose your side\n` +
                `• \`.coin flip\` – Flip the coin\n` +
                `• \`.coin guide\` – Show guide`
            );
        }

        const subCmd = args[0].toLowerCase();

        if (subCmd === 'guide') {
            return await reply(
                `📖 *Coin Flip Guide*\n\n` +
                `1. Host a game: \`.coin start\`\n` +
                `2. Opponent joins: \`.coin join\`\n` +
                `3. Each player chooses heads or tails\n` +
                `4. Host flips the coin: \`.coin flip\`\n` +
                `5. Winner is the one who guessed correctly\n` +
                `6. Watch the coin spin animation!`
            );
        }

        // Find existing game in this chat
        let gameKey = null;
        let game = null;
        for (let [key, g] of games.entries()) {
            if (key.startsWith(`coin-${chatId}`)) {
                gameKey = key;
                game = g;
                break;
            }
        }

        if (subCmd === 'start') {
            if (game) games.delete(gameKey);
            const newGame = new CoinFlip(senderId);
            const newKey = `coin-${chatId}-${Date.now()}`;
            games.set(newKey, newGame);
            return await reply(
                `🪙 *Coin Flip Started!*\n\n` +
                `${newGame.getDisplayBoard()}\n\n` +
                `Waiting for opponent to join with \`.coin join\``,
                [senderId]
            );
        }

        if (!game) return await reply('❌ No game in progress. Start one with `.coin start`');

        if (subCmd === 'join') {
            const result = game.join(senderId);
            if (result.error) return await reply(`❌ ${result.error}`);
            await reply(
                `${game.getDisplayBoard()}\n\n` +
                `Both players now choose heads or tails`,
                game.players
            );
            return;
        }

        if (subCmd === 'heads' || subCmd === 'tails') {
            const result = game.choose(senderId, subCmd);
            if (result.error) return await reply(`❌ ${result.error}`);

            if (result.both) {
                await reply(
                    `${game.getDisplayBoard()}\n\n` +
                    `Both chose! Host can now flip with \`.coin flip\``,
                    game.players
                );
            } else {
                await reply(
                    `${game.getDisplayBoard()}\n\n` +
                    `Choice recorded. Waiting for opponent...`,
                    game.players
                );
            }
            return;
        }

        if (subCmd === 'flip') {
            if (game.stage !== 'flipping') {
                return await reply('❌ Both players must choose first');
            }

            // Animated flip sequence
            const flipMsg = await reply('🪙 *FLIPPING...*\n\n🪙\n\n🔄');
            
            // Update animation frames
            setTimeout(async () => {
                await sock.sendMessage(chatId, { 
                    text: '🪙 *FLIPPING...*\n\n  🪙\n\n↪️', 
                    ...channelInfo,
                    edit: flipMsg.key?.id 
                });
            }, 400);
            
            setTimeout(async () => {
                await sock.sendMessage(chatId, { 
                    text: '🪙 *FLIPPING...*\n\n    🪙\n\n⤴️', 
                    ...channelInfo,
                    edit: flipMsg.key?.id 
                });
            }, 800);
            
            setTimeout(async () => {
                await sock.sendMessage(chatId, { 
                    text: '🪙 *FLIPPING...*\n\n🪙\n\n✨', 
                    ...channelInfo,
                    edit: flipMsg.key?.id 
                });
            }, 1200);
            
            setTimeout(async () => {
                const result = game.flip();
                const resultText = result.result === 'heads' ? '🪙 HEADS' : '🪙 TAILS';
                await sock.sendMessage(chatId, { 
                    text: `${game.getDisplayBoard()}\n\nResult: *${resultText}*`, 
                    ...channelInfo,
                    edit: flipMsg.key?.id 
                });
                
                // Remove game after delay
                setTimeout(() => games.delete(gameKey), 10000);
            }, 1600);
            
            return;
        }

        await reply('❌ Unknown subcommand. Use `.coin guide` for help.');
    }
};
