// GoogleSheetGenerator.js
// This generates Apps Script code that users paste into their Google Sheet

export function generateGoogleAppsScript(setup) {
  const categories = setup.expenseCategories.join(', ');
  const person1 = setup.person1.name;
  const person2 = setup.person2.name;
  const currency = setup.currency;
  const dateFormat = setup.dateFormat;

  const appsScript = `
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const action = e.parameter.action;

  if (action === 'read') {
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'add') {
    const date = e.parameter.date;
    const type = e.parameter.type;
    const category = e.parameter.category;
    const amount = e.parameter.amount;
    const person = e.parameter.person;
    const notes = e.parameter.notes || '';

    sheet.appendRow([new Date(), person, type, category, amount, notes]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Finance Tracker')
    .addItem('Refresh Data', 'refreshData')
    .addSeparator()
    .addItem('Show Summary', 'showSummary')
    .addToUi();
}

function refreshData() {
  // Reload data from sheet
  SpreadsheetApp.getActiveSheet().getRange(1, 1).activate();
}

function showSummary() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  let totalIncome = 0;
  let totalExpense = 0;

  for (let i = 1; i < data.length; i++) {
    const type = data[i][2];
    const amount = parseFloat(data[i][4]) || 0;
    
    if (type === 'Income') {
      totalIncome += amount;
    } else if (type === 'Expense') {
      totalExpense += amount;
    }
  }

  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Monthly Summary\\n\\n' +
    'Total Income: ${currency} ' + totalIncome.toFixed(2) + '\\n' +
    'Total Expenses: ${currency} ' + totalExpense.toFixed(2) + '\\n' +
    'Net: ${currency} ' + (totalIncome - totalExpense).toFixed(2)
  );
}
`;

  return appsScript;
}

export function generateSheetTemplate(setup) {
  // Returns the structure for the Google Sheet
  const sheetStructure = {
    sheetName: 'Family Finance Tracker',
    headers: [
      'Date',
      'Person',
      'Type',
      'Category',
      'Amount',
      'Notes'
    ],
    columns: {
      A: { header: 'Date', width: 100, format: setup.dateFormat },
      B: { header: 'Person', width: 150, values: [setup.person1.name, setup.person2.name] },
      C: { header: 'Type', width: 100, values: ['Income', 'Expense'] },
      D: { header: 'Category', width: 150, values: setup.expenseCategories },
      E: { header: 'Amount', width: 100, format: `${setup.currency} #,##0.00` },
      F: { header: 'Notes', width: 200 }
    },
    frozenRows: 1
  };

  return sheetStructure;
}

export function generateSetupInstructions(setup, scriptUrl) {
  const instructions = `
### Setup Instructions for ${setup.person1.name} & ${setup.person2.name}

**Your Custom Configuration:**
- 💱 Currency: ${setup.currency}
- 📅 Date Format: ${setup.dateFormat}
- 🎯 Dashboard: ${setup.dashboardLayout}

**Bank Accounts:**
- ${setup.person1.name}: ${setup.person1.bank} (Opening: ${setup.person1.balance})
- ${setup.person2.name}: ${setup.person2.bank} (Opening: ${setup.person2.balance})

**Your Expense Categories:**
${setup.expenseCategories.map(cat => \`- \${cat}\`).join('\\n')}

**Next Steps:**
1. Create a new Google Sheet
2. Go to Extensions → Apps Script
3. Paste the provided Apps Script code
4. Deploy as Web App
5. Copy the deployment URL back to the tracker

Done! You're ready to track. 🎉
`;

  return instructions;
}
