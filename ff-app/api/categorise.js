export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ error: 'API key not configured' });

  const today = new Date().toISOString().slice(0, 10);

  const INC = [
    'Salary - Chandrahas (full time)',
    'Uber earnings - Chandrahas',
    'Salary - Rohitha',
    'Casual pay - Rohitha',
    'Business sales - snacks',
    'Business sales - other',
    'Cash income',
    'Centrelink / government',
    'Freelance / contract',
    'Tax refund',
    'Investment / interest',
    'Opening balance',
    'Other income'
  ];

  const EXP = [
    'Rent / mortgage',
    'Electricity & gas',
    'Water',
    'Internet & phone',
    'Groceries',
    'Dining out / takeaway',
    'Coffee & snacks',
    'Fuel',
    'Public transport',
    'Car - rego & insurance',
    'Health & medical',
    'Pharmacy',
    'Gym & fitness',
    'Clothing & personal care',
    'Household supplies',
    'Furniture & appliances',
    'Subscriptions & apps',
    'Entertainment & leisure',
    'Education & training',
    'Sent to India / remittance',
    'Health insurance',
    'Car insurance',
    'Home & contents insurance',
    'Life insurance',
    'Other insurance',
    'Business - raw materials',
    'Business - packaging',
    'Business - equipment',
    'Business - marketing',
    'Business - other',
    'Tax payment',
    'Cash withdrawal',
    'Transfer between accounts',
    'Other expense'
  ];

  const prompt = `You are a finance categoriser for an Australian family living in Sydney. 
Chandrahas (husband) works full time and also drives Uber. 
Rohitha (wife) works casual clinical research roles and runs a small snack-making business. 
They send money to India regularly. They have multiple bank accounts.

Accounts available: "Rohitha - CBA", "Rohitha - NAB", "Chandrahas - Bank", "Cash", "Unknown"

User input: "${text}"

Respond ONLY with valid JSON, no explanation, no markdown:
{"type":"income or expense","amount":number,"account":"one of the accounts above","person":"Rohitha or Chandrahas or Both","date":"YYYY-MM-DD","category":"exact category from list","note":"short plain description"}

Income categories: ${INC.join(', ')}
Expense categories: ${EXP.join(', ')}

Rules:
- amount must be a positive number
- If CBA or Commonwealth mentioned → "Rohitha - CBA"
- If NAB or savings mentioned → "Rohitha - NAB"  
- If Chandrahas/husband/his account mentioned → "Chandrahas - Bank"
- If cash mentioned → "Cash"
- If unclear → "Unknown"
- If person not mentioned, default to "Rohitha"
- If no date, use ${today}
- For Uber earnings always use "Uber earnings - Chandrahas"
- For snack sales always use "Business sales - snacks"
- For money sent to India/family back home use "Sent to India / remittance"
- Pick the most specific matching category`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300
      })
    });
    const rawText = await r.text();
    if (!r.ok) return res.status(500).json({ error: 'Groq API error', details: rawText.slice(0, 300) });
    const data = JSON.parse(rawText);
    let raw = data.choices?.[0]?.message?.content || '';
    if (!raw) return res.status(500).json({ error: 'Empty response from Groq' });
    raw = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'AI error', details: e.message });
  }
}
