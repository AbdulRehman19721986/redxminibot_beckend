/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *****************************************************************************/

// ==================== Game Logic ====================
class LudoDice {
    constructor() {
        this.players = [];
        this.currentPlayer = 0;
        this.rolls = [];
        this.gameOver = false;
        this.winner = null;
    }

    addPlayer(playerId, name) {
        if (this.players.length >= 4) return false;
        this.players.push({ id: playerId, name, position: 0, pieces: [0,0,0,0] }); // 4 pieces
        return true;
    }

    roll() {
        const dice = Math.floor(Math.random() * 6) + 1;
        return dice;
    }

    move(playerIndex, pieceIndex) {
        const player = this.players[playerIndex];
        const dice = this.rolls[this.rolls.length-1];
        // Simplified: just move piece forward, no complex rules
        player.pieces[pieceIndex] += dice;
        if (player.pieces[pieceIndex] >= 57) { // approximate win condition
            this.gameOver = true;
            this.winner = player;
        }
    }

    nextTurn() {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    }

    getDisplayBoard() {
        let board = '🎲 *LUDO DICE* 🎲\n\n';
        this.players.forEach((p, i) => {
            board += `${i === this.currentPlayer ? '👉 ' : '   '}${p.name}: `;
            p.pieces.forEach((pos, j) => {
                board += `[${pos}] `;
            });
            board += '\n';
        });
        return board;
    }

    getDiceEmoji(roll) {
        const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return dice[roll-1];
    }
}

const games = new Map(); // key = chatId

module.exports = {
    command: 'dice',
    aliases: ['ludo'],
    category: 'games',
    description: 'Play Ludo-style dice game (up to 4 players).',
    usage: 
        '.dice start                – Start a new game\n' +
        '.dice join                  – Join the game\n' +
        '.dice roll                   – Roll the dice\n' +
        '.dice move <piece>           – Move piece (1-4)\n' +
        '.dice guide                   – Show game guide',
    groupOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const senderId = (context.senderId || message.key.participant || message.key.remoteJid).split(':')[0];
        const senderName = message.pushName || senderId.split('@')[0];
        const channelInfo = context.channelInfo || {};

        const reply = async (text, mentions = []) => 
            await sock.sendMessage(chatId, { text, mentions, ...channelInfo }, { quoted: message });

        if (args.length === 0) {
            return await reply(
                `🎲 *Dice Commands*\n\n` +
                `• \`.dice start\` – Host a new game\n` +
                `• \`.dice join\` – Join waiting game\n` +
                `• \`.dice roll\` – Roll the dice\n` +
                `• \`.dice move <piece>\` – Move piece (1-4)\n` +
                `• \`.dice guide\` – Show guide`
            );
        }

        const subCmd = args[0].toLowerCase();

        if (subCmd === 'guide') {
            return await reply(
                `📖 *Dice Game Guide*\n\n` +
                `1. Host starts a game: \`.dice start\`\n` +
                `2. Players join with \`.dice join\` (max 4)\n` +
                `3. Players take turns rolling with \`.dice roll\`\n` +
                `4. After rolling, move a piece: \`.dice move 1\`\n` +
                `5. First to get all pieces around the board wins!\n` +
                `6. Dice roll shown as 🎲 emoji.`
            );
        }

        let game = games.get(chatId);

        if (subCmd === 'start') {
            if (game) games.delete(chatId);
            game = new LudoDice();
            game.addPlayer(senderId, senderName);
            games.set(chatId, game);
            return await reply(
                `🎲 *Dice Game Started!*\n\n` +
                `${game.getDisplayBoard()}\n\n` +
                `Players can join with \`.dice join\`\n` +
                `Use \`.dice roll\` when it's your turn.`,
                [senderId]
            );
        }

        if (!game) return await reply('❌ No game in progress. Start one with `.dice start`');

        if (subCmd === 'join') {
            if (game.players.length >= 4) return await reply('❌ Game is full (max 4 players).');
            if (game.players.some(p => p.id === senderId)) return await reply('❌ You are already in the game.');
            game.addPlayer(senderId, senderName);
            await reply(
                `✅ @${senderName} joined!\n\n${game.getDisplayBoard()}`,
                game.players.map(p => p.id)
            );
            return;
        }

        if (subCmd === 'roll') {
            const playerIndex = game.players.findIndex(p => p.id === senderId);
            if (playerIndex !== game.currentPlayer) return await reply('❌ Not your turn!');
            
            const roll = game.roll();
            game.rolls.push(roll);
            const diceEmoji = game.getDiceEmoji(roll);
            
            const rollMsg = await reply(`🎲 *Rolling...* ${diceEmoji}`);
            
            setTimeout(async () => {
                await sock.sendMessage(chatId, {
                    text: `🎲 You rolled ${diceEmoji} (${roll})!\nNow move a piece with \`.dice move <piece>\``,
                    ...channelInfo,
                    edit: rollMsg.key?.id
                });
            }, 1000);
            return;
        }

        if (subCmd === 'move') {
            if (args.length < 2) return await reply('❌ Usage: `.dice move <piece>`');
            const piece = parseInt(args[1]);
            if (isNaN(piece) || piece < 1 || piece > 4) return await reply('❌ Piece must be 1-4.');

            const playerIndex = game.players.findIndex(p => p.id === senderId);
            if (playerIndex !== game.currentPlayer) return await reply('❌ Not your turn!');
            if (game.rolls.length === 0) return await reply('❌ You need to roll first!');

            game.move(playerIndex, piece-1);
            
            let msg = game.getDisplayBoard();
            if (game.gameOver) {
                msg += `\n\n🏆 *${game.winner.name} wins!* 🏆`;
                games.delete(chatId);
            } else {
                game.nextTurn();
                msg += `\n\nNext turn: ${game.players[game.currentPlayer].name}`;
            }
            await reply(msg, game.players.map(p => p.id));
            return;
        }

        await reply('❌ Unknown subcommand. Use `.dice guide` for help.');
    }
};
