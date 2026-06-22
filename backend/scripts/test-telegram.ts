/**
 * Test script — sends a test message to Telegram.
 * Run: npm run test:telegram
 *
 * Make sure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set in .env first.
 */
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function testTelegram(): Promise<void> {
  if (!token || token === 'your-telegram-bot-token') {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set in backend/.env');
    console.log('   Get it from @BotFather on Telegram. See SETUP-GUIDE.md');
    process.exit(1);
  }

  if (!chatId || chatId === 'your-telegram-chat-id') {
    console.error('❌ TELEGRAM_CHAT_ID is not set in backend/.env');
    console.log('   Message your bot, then open:');
    console.log(`   https://api.telegram.org/bot${token.slice(0, 10)}.../getUpdates`);
    process.exit(1);
  }

  const message = [
    '✅ <b>Telegram Test Successful!</b>',
    '',
    'Your Boss Appointment Scheduler is connected.',
    'You will receive notifications when appointments are created, updated, or deleted.',
  ].join('\n');

  console.log('Sending test message to Telegram...');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  const data = (await response.json()) as { ok: boolean; description?: string };

  if (data.ok) {
    console.log('✅ Test message sent! Check your Telegram app.');
  } else {
    console.error('❌ Failed:', data.description ?? 'Unknown error');
    console.log('\nCommon fixes:');
    console.log('  1. Click Start on your bot in Telegram first');
    console.log('  2. Double-check TELEGRAM_CHAT_ID in .env');
    console.log('  3. Verify TELEGRAM_BOT_TOKEN is correct');
    process.exit(1);
  }
}

testTelegram().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
