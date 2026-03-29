/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/AbdulRehman19721986/redxbot302          *
 *  ▶️  YouTube  : https://youtube.com/@rootmindtech                         *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10     *
 *  🔗  Telegram : https://t.me/TeamRedxhacker2                              *
 *                                                                           *
 *    © 2026 Abdul Rehman Rajpoot. All rights reserved.                      *
 *                                                                           *
 *****************************************************************************/

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Sound effects library with descriptions
const soundEffects = {
  // Gaali sound effects (text will be converted to speech)
  gaalis: [
    { text: "Madarchod! Bhenchod!", emotion: "angry", emoji: "🤬" },
    { text: "Teri maa ka bhosda!", emotion: "aggressive", emoji: "💢" },
    { text: "Bhen ke lode!", emotion: "angry", emoji: "🖕" },
    { text: "Tatti chod! Randi ke!", emotion: "disgust", emoji: "💩" },
    { text: "Gaand mara! Chutiye!", emotion: "rude", emoji: "🍑" },
    { text: "Mia Khalifa ki aulad!", emotion: "sarcastic", emoji: "🔥" },
    { text: "Johny Sins ki aulaad!", emotion: "funny", emoji: "😈" },
    { text: "Bhan ka taka!", emotion: "angry", emoji: "🍆" },
    { text: "Teri ma ko lun!", emotion: "aggressive", emoji: "💦" },
    { text: "Fuck your whole family!", emotion: "screaming", emoji: "👪" }
  ],
  
  // Sound effect URLs (replace with actual hosted audio files)
  soundFiles: {
    slap: "https://example.com/sounds/slap.mp3",
    thappad: "https://example.com/sounds/thappad.mp3",
    chudai: "https://example.com/sounds/chudai.mp3",
    moan: "https://example.com/sounds/moan.mp3",
    spit: "https://example.com/sounds/spit.mp3",
    punch: "https://example.com/sounds/punch.mp3",
    kiss: "https://example.com/sounds/kiss.mp3",
    laugh: "https://example.com/sounds/evil_laugh.mp3",
    scream: "https://example.com/sounds/scream.mp3",
    fart: "https://example.com/sounds/fart.mp3"
  }
};

module.exports = {
  command: 'sound',
  aliases: ['audio', 'gaalisound', 'bol', 'tts'],
  category: 'fun',
  description: '🎵 Play sound effects and gaalis as audio',
  usage: '.sound [gaali/slap/thappad/etc]',
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      // Show available sounds if no args
      if (!args || args.length === 0) {
        const soundList = [
          "*🎵 Available Sound Effects:*",
          "",
          "*🎤 Gaali Generator (TTS):*",
          ...soundEffects.gaalis.map((g, i) => `  ${i+1}. .sound gaali${i+1} - ${g.emoji} ${g.text}`),
          "",
          "*🔊 Pre-recorded Sounds:*",
          ...Object.keys(soundEffects.soundFiles).map(s => `  • .sound ${s} - ${s}`),
          "",
          "*📝 Examples:*",
          "  .sound gaali1 - Plays 'Madarchod'",
          "  .sound slap - Plays slap sound",
          "  .sound custom teri ma ka lora - Custom TTS"
        ].join('\n');
        
        return await sock.sendMessage(chatId, {
          text: soundList,
          ...channelInfo
        }, { quoted: message });
      }
      
      const command = args[0].toLowerCase();
      const initialMsg = await sock.sendMessage(chatId, {
        text: '🎵 *Generating sound effect...*',
        ...channelInfo
      }, { quoted: message });
      
      // Handle pre-recorded sound files
      if (soundEffects.soundFiles[command]) {
        await delay(800);
        await sock.relayMessage(
          chatId,
          {
            protocolMessage: {
              key: initialMsg.key,
              type: 14,
              editedMessage: { conversation: `🔊 Playing: ${command}` }
            }
          },
          {}
        );
        
        // Send audio file
        await sock.sendMessage(chatId, {
          audio: { url: soundEffects.soundFiles[command] },
          mimetype: 'audio/mpeg',
          ptt: true // Send as voice note
        }, { quoted: message });
        
        return;
      }
      
      // Handle gaali TTS generation
      if (command.startsWith('gaali')) {
        const index = parseInt(command.replace('gaali', '')) - 1;
        if (index >= 0 && index < soundEffects.gaalis.length) {
          const gaali = soundEffects.gaalis[index];
          
          // Show emoji sequence while generating
          const sequence = [gaali.emoji, "🎤", "🔊", "📢", "🎵", gaali.emoji];
          for (const em of sequence) {
            await delay(400);
            await sock.relayMessage(
              chatId,
              {
                protocolMessage: {
                  key: initialMsg.key,
                  type: 14,
                  editedMessage: { conversation: em }
                }
              },
              {}
            );
          }
          
          // Generate TTS audio
          const audioUrl = await generateTTS(gaali.text, gaali.emotion);
          
          await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: true
          }, { quoted: message });
        }
      }
      
      // Handle custom TTS
      if (command === 'custom' && args.length > 1) {
        const customText = args.slice(1).join(' ');
        
        await delay(500);
        await sock.relayMessage(
          chatId,
          {
            protocolMessage: {
              key: initialMsg.key,
              type: 14,
              editedMessage: { conversation: `🎤 Speaking: "${customText}"` }
            }
          },
          {}
        );
        
        const audioUrl = await generateTTS(customText, 'default');
        await sock.sendMessage(chatId, {
          audio: { url: audioUrl },
          mimetype: 'audio/mpeg',
          ptt: true
        }, { quoted: message });
      }
      
    } catch (error) {
      console.error('Sound command error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};

/**
 * Generate TTS audio using free API or local method
 */
async function generateTTS(text, emotion = 'default') {
  try {
    // Option 1: Using a free TTS API (replace with your preferred service)
    const response = await axios({
      method: 'post',
      url: 'https://api.streamelements.com/kappa/v2/speech',
      params: {
        voice: getVoiceForEmotion(emotion),
        text: text
      },
      responseType: 'arraybuffer'
    });
    
    // Convert to base64 data URL
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:audio/mpeg;base64,${base64}`;
    
  } catch (error) {
    console.error('TTS generation failed:', error);
    
    // Option 2: Fallback to local espeak (requires espeak installed)
    try {
      const filename = path.join(__dirname, `../temp/tts_${Date.now()}.mp3`);
      await execPromise(`espeak "${text}" -w ${filename.replace('.mp3', '.wav')} && ffmpeg -i ${filename.replace('.mp3', '.wav')} -codec:a libmp3lame -qscale:a 2 ${filename}`);
      
      // Read file and convert to base64
      const audioData = fs.readFileSync(filename);
      const base64 = audioData.toString('base64');
      
      // Clean up temp files
      fs.unlinkSync(filename);
      fs.unlinkSync(filename.replace('.mp3', '.wav'));
      
      return `data:audio/mpeg;base64,${base64}`;
    } catch (espeakError) {
      throw new Error('TTS failed - install espeak or configure API');
    }
  }
}

/**
 * Map emotion to voice type
 */
function getVoiceForEmotion(emotion) {
  const voiceMap = {
    angry: 'Brian',      // Deep angry voice
    aggressive: 'Brian',
    default: 'Joanna',
    funny: 'Matthew',
    sarcastic: 'Kimberly',
    screaming: 'Ivy',
    disgust: 'Justin'
  };
  return voiceMap[emotion] || 'Joanna';
}
