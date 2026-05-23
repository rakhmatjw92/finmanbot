import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  initDb,
  getTransactions,
  addTransaction,
  deleteTransaction,
  getBotConfig,
  updateBotConfig,
  getBudgetConfig,
  updateBudgetConfig
} from './src/server/db.js';
import { Transaction, FinancialSummary } from './src/types.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK lazily to avoid crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined. Please add it via the Settings secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Global state initialization
initDb();

// Helper: Parse message using server-side Gemini AI
async function parseFinanceMessage(text: string): Promise<{
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  currency: string;
}> {
  try {
    const ai = getAiClient();
    const currentDate = new Date().toLocaleDateString();
    const standardCategories = [
      'Food & Dining', 'Groceries', 'Transport', 'Shopping',
      'Entertainment', 'Salary', 'Investment', 'Utilities',
      'Freelance', 'Other'
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Parse this transaction message into structured financial data.
Message: "${text}"
Current Date: ${currentDate}

Rules:
1. "type": Must be "income" if the user received money, got paid, was rewarded, sold an item, or earned salary. Must be "expense" if they bought, paid, spent, lost, or donated money.
2. "amount": Must be a positive decimal number representing the cost or earnings. If the user mentions "k" (e.g. 50k, 15k, 100k), convert it to thousands (e.g. 50000, 15000, 100000).
3. "category": Must be one of only: ${standardCategories.join(', ')}. Match as closely as possible.
4. "description": A short, clean description describing the transaction, e.g. "Dinner at Italian restaurant" or "Weekly salary payout". Capitalize first letter.
5. "currency": Deduce the currency or symbol (like $, Rp, €, £). Use capital letters (e.g. IDR, USD, EUR, SGD). If none detected or inferred, default to IDR (Indonesian Rupiah).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ['income', 'expense'],
              description: 'Transaction direction.'
            },
            amount: {
              type: Type.NUMBER,
              description: 'The positive monetary quantity.'
            },
            category: {
              type: Type.STRING,
              description: 'Primary expenditure/income grouping.'
            },
            description: {
              type: Type.STRING,
              description: 'Explicit topic description of the transaction.'
            },
            currency: {
              type: Type.STRING,
              description: 'The standard three-letter currency code.'
            }
          },
          required: ['type', 'amount', 'category', 'description', 'currency']
        }
      }
    });

    const bodyText = response.text;
    if (!bodyText) {
      throw new Error('Gemini API returned an empty response text.');
    }

    const parsed = JSON.parse(bodyText.trim());
    // Fallback category validation
    const foundCategory = standardCategories.find(
      c => c.toLowerCase() === parsed.category?.toLowerCase()
    ) || 'Other';

    return {
      type: parsed.type === 'income' ? 'income' : 'expense',
      amount: Math.abs(Number(parsed.amount)) || 0,
      category: foundCategory,
      description: parsed.description || text,
      currency: (parsed.currency || 'IDR').toUpperCase().substring(0, 3)
    };
  } catch (err) {
    console.error('Gemini parsing failed, using hardcoded fallback:', err);
    // Simple regex parsing fallback in case of API failure or missing keys
    // Handle 'k' multiplier (e.g., 50k -> 50000)
    let parsedAmount = 10000;
    const cleanText = text.toLowerCase();
    const kMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*k/);
    if (kMatch) {
      parsedAmount = parseFloat(kMatch[1]) * 1000;
    } else {
      const amountMatch = cleanText.match(/\d+(?:\.\d+)?/);
      if (amountMatch) {
        parsedAmount = parseFloat(amountMatch[0]);
      }
    }
    const isIncome = cleanText.includes('salary') || cleanText.includes('earn') || cleanText.includes('received') || cleanText.includes('gaji') || cleanText.includes('bonus') || text.includes('+');
    return {
      type: isIncome ? 'income' : 'expense',
      amount: parsedAmount,
      category: isIncome ? 'Salary' : 'Other',
      description: text,
      currency: 'IDR'
    };
  }
}

// Telegram Bot Helper API functions
async function sendTelegramMessage(token: string, chatId: number, text: string) {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Telegram message failed to send to ${chatId}:`, errText);
    }
  } catch (err) {
    console.error('Error sending Telegram message:', err);
  }
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Get Summary & Analytics
app.get('/api/summary', (req, res) => {
  const transactions = getTransactions();
  const budget = getBudgetConfig();

  let totalIncome = 0;
  let totalExpense = 0;

  // Category counts and totals
  const catTotals: Record<string, { amount: number; count: number }> = {};
  const dailyRaw: Record<string, { income: number; expense: number }> = {};

  // Sort and process
  const sortedTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  transactions.forEach(tx => {
    const amt = tx.amount;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }

    // Category
    if (!catTotals[tx.category]) {
      catTotals[tx.category] = { amount: 0, count: 0 };
    }
    catTotals[tx.category].amount += amt;
    catTotals[tx.category].count += 1;

    // Daily breakdown
    const dateStr = new Date(tx.date).toISOString().split('T')[0];
    if (!dailyRaw[dateStr]) {
      dailyRaw[dateStr] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      dailyRaw[dateStr].income += amt;
    } else {
      dailyRaw[dateStr].expense += amt;
    }
  });

  const categoryBreakdown = Object.entries(catTotals).map(([category, data]) => {
    return {
      category,
      amount: parseFloat(data.amount.toFixed(2)),
      percentage: totalExpense > 0 ? parseFloat(((data.amount / (totalExpense + totalIncome)) * 100).toFixed(1)) : 0,
      count: data.count
    };
  }).sort((a, b) => b.amount - a.amount);

  // Take the last 7 active days for visualization chart
  const dailyBreakdown = Object.entries(dailyRaw).map(([date, data]) => ({
    date,
    income: parseFloat(data.income.toFixed(2)),
    expense: parseFloat(data.expense.toFixed(2))
  })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14); // up to 14 days

  const netBalance = parseFloat((totalIncome - totalExpense).toFixed(2));
  const budgetProgress = budget.monthlyLimit > 0 
    ? parseFloat(((totalExpense / budget.monthlyLimit) * 100).toFixed(1))
    : 0;

  const summary: FinancialSummary = {
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    totalExpense: parseFloat(totalExpense.toFixed(2)),
    netBalance,
    budgetProgress,
    categoryBreakdown,
    recentActivity: sortedTx.slice(0, 8),
    dailyBreakdown
  };

  res.json(summary);
});

// 2. Load Transactions
app.get('/api/transactions', (req, res) => {
  res.json(getTransactions());
});

// 3. Add Transaction manually
app.post('/api/transactions', (req, res) => {
  const { type, amount, category, description, currency, date } = req.body;
  if (!type || !amount || !category || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transaction = addTransaction({
    type,
    amount: parseFloat(amount),
    category,
    description,
    currency: currency || 'IDR',
    date: date || new Date().toISOString()
  });

  res.json(transaction);
});

// 4. Delete Transaction
app.delete('/api/transactions/:id', (req, res) => {
  const success = deleteTransaction(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// 5. Get Bot Status & Config
app.get('/api/status', (req, res) => {
  const config = getBotConfig();
  res.json({
    telegramBotToken: config.telegramBotToken ? '••••••••' + config.telegramBotToken.slice(-5) : '',
    botUsername: config.botUsername || '',
    webhookUrl: config.webhookUrl || '',
    webhookRegistered: config.webhookRegistered || false,
    isActive: config.isActive || false,
    appUrl: process.env.APP_URL || ''
  });
});

// 6. Update Bot Token & register webhook
app.post('/api/config', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const verifyUrl = `https://api.telegram.org/bot${token}/getMe`;
    const verifyRes = await fetch(verifyUrl);
    if (!verifyRes.ok) {
      return res.status(400).json({ error: 'Invalid Bot Token. Telegram did not accept this.' });
    }

    const botData = await verifyRes.json();
    const botUsername = botData.result.username;

    // Register Webhook
    const appUrl = process.env.APP_URL || '';
    let webhookRegistered = false;
    let targetWebhookUrl = '';

    if (appUrl) {
      targetWebhookUrl = `${appUrl.trim().replace(/\/$/, '')}/api/telegram/webhook`;
      const webhookRegUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}`;
      const webRegRes = await fetch(webhookRegUrl);
      if (webRegRes.ok) {
        webhookRegistered = true;
        console.log('Webhook registered successfully with Telegram:', targetWebhookUrl);
      } else {
        console.error('Failed to register webhook with Telegram:', await webRegRes.text());
      }
    }

    const updatedConfig = updateBotConfig(token, botUsername, targetWebhookUrl, webhookRegistered);
    res.json({
      success: true,
      botUsername: updatedConfig.botUsername,
      webhookRegistered: updatedConfig.webhookRegistered,
      webhookUrl: updatedConfig.webhookUrl
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// 7. Delete Bot Config (Unregister Webhook)
app.delete('/api/config', async (req, res) => {
  const config = getBotConfig();
  const token = config.telegramBotToken;

  if (token) {
    try {
      const delUrl = `https://api.telegram.org/bot${token}/deleteWebhook`;
      await fetch(delUrl);
    } catch (e) {
      console.error('Failed to delete webhook on deletion:', e);
    }
  }

  updateBotConfig('', '', '', false);
  res.json({ success: true });
});

// 8. Load Budget
app.get('/api/budget', (req, res) => {
  res.json(getBudgetConfig());
});

// 9. Update Budget
app.post('/api/budget', (req, res) => {
  const { monthlyLimit, currency } = req.body;
  const config = updateBudgetConfig({
    monthlyLimit: parseFloat(monthlyLimit) || 0,
    currency: currency || 'IDR'
  });
  res.json(config);
});

// 10. Simulate Bot Message / Bot Playground
app.post('/api/simulate', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Message body empty' });
  }

  // Use AI parsing
  const parsed = await parseFinanceMessage(text);
  const newTx = addTransaction({
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    currency: parsed.currency,
    rawMessage: text,
    telegramUserId: 'simulated_user_123',
    telegramUsername: 'SimulatedTester'
  });

  const formattedSimAmount = parsed.currency === 'IDR'
    ? `Rp ${parsed.amount.toLocaleString('id-ID')}`
    : `${parsed.amount.toFixed(2)} ${parsed.currency}`;

  const reply = `<b>✅ Transaction Saved in Dashboard!</b>\n\n` +
                `<b>Type:</b> ${parsed.type === 'income' ? '📈 Income' : '📉 Expense'}\n` +
                `<b>Amount:</b> ${formattedSimAmount}\n` +
                `<b>Category:</b> 🏷️ ${parsed.category}\n` +
                `<b>Item:</b> ✏️ ${parsed.description}\n` +
                `<b>Date:</b> 📅 ${new Date(newTx.date).toLocaleDateString()}`;

  res.json({
    parsedTransaction: newTx,
    botReply: reply
  });
});

// 11. Telegram Webhook Endpoint
app.post('/api/telegram/webhook', async (req, res) => {
  const update = req.body;
  console.log('Received Telegram Update:', JSON.stringify(update));

  if (!update || !update.message) {
    return res.sendStatus(200); // Always answer Telegram with 200 OK
  }

  const message = update.message;
  const chatId = message.chat.id;
  const text = message.text || '';
  const fromUser = message.from || {};
  const tgUser = fromUser.username || fromUser.first_name || 'User';

  const config = getBotConfig();
  const token = config.telegramBotToken;

  if (!token) {
    return res.sendStatus(200);
  }

  // Handle Command Commands
  if (text.startsWith('/start') || text.startsWith('/help')) {
    const welcome = `<b>👋 Welcome to your Financial Assistant, ${tgUser}!</b>\n\n` +
                    `Send me standard personal finance messages and I'll parse them with artificial intelligence into your dashboard.\n\n` +
                    `<b>✏️ Examples (defaulting to Indonesian Rupiah):</b>\n` +
                    `• <i>"makan siang di warteg 25000"</i>\n` +
                    `• <i>"beli kopi starbucks 55k"</i>\n` +
                    `• <i>"gaji bulanan +15000000"</i>\n` +
                    `• <i>"gojek ke rumah 18000"</i>\n\n` +
                    `<b>📊 Web Dashboard Link:</b>\n` +
                    `${process.env.APP_URL || 'Open the web application preview'}`;
    await sendTelegramMessage(token, chatId, welcome);
    return res.sendStatus(200);
  }

  // Handle Transaction logs
  try {
    // Notify user we are parsing
    await sendTelegramMessage(token, chatId, '<i>Parsing transaction with Gemini AI... 🧠</i>');

    const parsed = await parseFinanceMessage(text);
    const newTx = addTransaction({
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      currency: parsed.currency,
      rawMessage: text,
      telegramUserId: String(fromUser.id),
      telegramUsername: fromUser.username
    });

    const formattedWebAmount = parsed.currency === 'IDR'
      ? `Rp ${parsed.amount.toLocaleString('id-ID')}`
      : `${parsed.amount.toFixed(2)} ${parsed.currency}`;

    const reply = `<b>✅ Transaction Saved!</b>\n\n` +
                  `<b>Type:</b> ${parsed.type === 'income' ? '📈 Income' : '📉 Expense'}\n` +
                  `<b>Amount:</b> ${formattedWebAmount}\n` +
                  `<b>Category:</b> 🏷️ ${parsed.category}\n` +
                  `<b>Item:</b> ✏️ ${parsed.description}\n` +
                  `<b>Date:</b> 📅 ${new Date(newTx.date).toLocaleDateString()}\n\n` +
                  `<b>📊 View Realtime Dashboard:</b>\n` +
                  `${process.env.APP_URL || 'Link'}`;

    await sendTelegramMessage(token, chatId, reply);
  } catch (err) {
    console.error('Failed to parse or notify in Webhook:', err);
    await sendTelegramMessage(
      token,
      chatId,
      '⚠️ Oh no! Something went wrong while parsing with AI. Please make sure your transaction message has an amount!'
    );
  }

  return res.sendStatus(200);
});

// 12. Export to CSV Link
app.get('/api/export', (req, res) => {
  const transactions = getTransactions();
  let csv = 'ID,Date,Type,Amount,Currency,Category,Description,Source\n';
  transactions.forEach(tx => {
    const rawMsgSafe = tx.rawMessage ? `"${tx.rawMessage.replace(/"/g, '""')}"` : '';
    const descSafe = `"${tx.description.replace(/"/g, '""')}"`;
    const userSafe = tx.telegramUsername ? `Telegram (@${tx.telegramUsername})` : 'Manual Dashboard';
    csv += `${tx.id},${tx.date},${tx.type},${tx.amount},${tx.currency},${tx.category},${descSafe},${userSafe}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=personal_finance_transactions.csv');
  res.status(200).send(csv);
});

// -------------------------------------------------------------
// VITE OR STATIC ASSETS SERVING MIDDLEWARE
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegram Finance Bot Server running at http://0.0.0.0:${PORT}`);
    console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
