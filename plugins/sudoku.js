/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *****************************************************************************/

// ==================== Game Logic ====================
class Sudoku {
    constructor() {
        // Predefined 4x4 puzzle (0 = empty)
        this.puzzle = [
            [1, 0, 0, 4],
            [0, 3, 2, 0],
            [0, 1, 4, 0],
            [2, 0, 0, 3]
        ];
        this.solution = [
            [1, 2, 3, 4],
            [4, 3, 2, 1],
            [3, 1, 4, 2],
            [2, 4, 1, 3]
        ];
        this.board = JSON.parse(JSON.stringify(this.puzzle)); // copy
        this.completed = false;
    }

    place(row, col, num) {
        const r = row - 1, c = col - 1;
        if (this.completed) return { error: 'Game already completed' };
        if (r < 0 || r >= 4 || c < 0 || c >= 4) return { error: 'Invalid row/col (use 1-4)' };
        if (this.puzzle[r][c] !== 0) return { error: 'That cell is fixed (cannot change)' };
        if (num < 1 || num > 4) return { error: 'Number must be 1-4' };

        this.board[r][c] = num;

        // Check win
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] !== this.solution[i][j]) return { success: true };
            }
        }
        this.completed = true;
        return { success: true, win: true };
    }

    getDisplayBoard() {
        const emoji = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣'];
        let str = '```\n   ';
        for (let c = 0; c < 4; c++) str += ` ${c+1} `;
        str += '\n';
        for (let r = 0; r < 4; r++) {
            str += ` ${r+1} `;
            for (let c = 0; c < 4; c++) {
                const val = this.board[r][c];
                if (val === 0) str += '⬜';
                else str += emoji[val];
                str += ' ';
            }
            str += '\n';
        }
        str += '```';
        return str;
    }
}

// ==================== Storage ====================
const games = new Map(); // key = `sudoku-${chatId}:${player}`

module.exports = {
    command: 'sudoku',
    aliases: ['sd'],
    category: 'games',
    description: 'Solve a 4x4 Sudoku puzzle.',
    usage: 
        '.sd start                  – Start a new puzzle\n' +
        '.sd place <row> <col> <num> – Place a number (1-4)\n' +
        '.sd guide                   – Show game guide',

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const senderId = (context.senderId || message.key.participant || message.key.remoteJid).split(':')[0];
        const channelInfo = context.channelInfo || {};

        const reply = async (text) => 
            await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });

        if (args.length === 0) {
            return await reply(
                `🧩 *Sudoku Commands*\n\n` +
                `• \`.sd start\` – New puzzle\n` +
                `• \`.sd place <row> <col> <num>\` – Place a number\n` +
                `• \`.sd guide\` – Show guide`
            );
        }

        const subCmd = args[0].toLowerCase();

        if (subCmd === 'guide') {
            return await reply(
                `📖 *Sudoku Guide*\n\n` +
                `1. Start a game: \`.sd start\`\n` +
                `2. Fill empty cells (⬜) with numbers 1-4\n` +
                `3. Each row, column, and 2x2 box must contain 1-4 exactly once\n` +
                `4. Fixed cells cannot be changed\n` +
                `5. Use \`.sd place <row> <col> <num>\` (e.g., \`.sd place 2 3 1\`)\n` +
                `6. When the board matches the solution, you win!`
            );
        }

        // Find existing game
        let gameKey = null;
        let game = null;
        for (let [key, g] of games.entries()) {
            if (key.startsWith(`sudoku-${chatId}:${senderId}`)) {
                gameKey = key;
                game = g;
                break;
            }
        }

        if (subCmd === 'start') {
            if (game) games.delete(gameKey);
            const newGame = new Sudoku();
            const newKey = `sudoku-${chatId}:${senderId}-${Date.now()}`;
            games.set(newKey, newGame);
            return await reply(
                `🧩 *Sudoku Started!*\n\n${newGame.getDisplayBoard()}\n\nPlace numbers with \`.sd place <row> <col> <num>\``
            );
        }

        if (!game) return await reply('❌ No game in progress. Start one with `.sd start`');

        if (subCmd === 'place') {
            if (args.length < 4) return await reply('❌ Usage: `.sd place <row> <col> <num>`');
            const row = parseInt(args[1]);
            const col = parseInt(args[2]);
            const num = parseInt(args[3]);
            if (isNaN(row) || isNaN(col) || isNaN(num)) return await reply('❌ Invalid numbers');
            const result = game.place(row, col, num);
            if (result.error) return await reply(`❌ ${result.error}`);

            if (result.win) {
                games.delete(gameKey);
                return await reply(`🎉 *You Win!*\n\n${game.getDisplayBoard()}`);
            }

            await reply(game.getDisplayBoard());
            return;
        }

        await reply('❌ Unknown subcommand. Use `.sd guide` for help.');
    }
};
