// agent/custom_scripts/listeners/finance-email-tracker.ts
import type { ListenerConfig, ListenerContext, ListenerResult, Email } from '../types';
import type { FinancialDashboardState, Expense } from '../ui-states/financial-dashboard';

export const config: ListenerConfig = {
  id: 'finance-email-tracker',
  name: 'Finance Email Tracker',
  description: 'Automatically tracks expenses and income from emails (receipts, invoices, payment confirmations)',
  enabled: true,
  event: 'email_received'
};

interface FinancialClassification {
  isFinancial: boolean;
  confidence: number;
  amount?: number;
  category?: string;
  type?: 'expense' | 'income' | 'other';
  date?: string;
  description?: string;
}

export async function handler(
  email: Email,
  context: ListenerContext
): Promise<ListenerResult> {
  try {
    // Use AI to classify financial email
    const classification = await context.callAgent<FinancialClassification>({
      prompt: `Analyze this email and extract financial information:

Subject: ${email.subject}
From: ${email.from}
Body: ${email.body.substring(0, 1000)}

Questions:
1. Is this a financial email (receipt, invoice, payment confirmation, bill, income notification)?
2. If yes, extract: amount (number), category (Food/Transportation/Shopping/Entertainment/Utilities/Healthcare/Travel/Other), type (expense or income), date (ISO format), and a brief description.

Return confidence score 0-1.`,
      schema: {
        type: 'object',
        properties: {
          isFinancial: { type: 'boolean' },
          confidence: { type: 'number' },
          amount: { type: 'number' },
          category: { type: 'string' },
          type: { type: 'string', enum: ['expense', 'income', 'other'] },
          date: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['isFinancial', 'confidence']
      },
      model: 'haiku'
    });

    if (!classification.isFinancial || classification.confidence < 0.7) {
      return {
        executed: false,
        reason: `Not a financial email (confidence: ${classification.confidence?.toFixed(2) || 0})`
      };
    }

    if (!classification.amount || !classification.type) {
      return {
        executed: false,
        reason: 'Financial email detected but could not extract amount or type'
      };
    }

    const stateId = 'financial_dashboard';

    // Get current state (or initialize if doesn't exist)
    let state = await context.uiState.get<FinancialDashboardState>(stateId);
    if (!state) {
      state = {
        expenses: [],
        income: [],
        categories: {},
        monthlyTotals: {}
      };
    }

    // Only handle expenses for now
    if (classification.type === 'expense') {
      const category = classification.category || 'Other';
      const expenseDate = classification.date || email.date;

      // Create expense
      const expense: Expense = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: classification.amount,
        category,
        description: classification.description || email.subject,
        date: expenseDate,
        source: email.messageId
      };

      // Add expense
      state.expenses.push(expense);

      // Update category totals
      if (!state.categories[category]) {
        state.categories[category] = { total: 0, count: 0 };
      }
      state.categories[category].total += classification.amount;
      state.categories[category].count += 1;

      // Update monthly totals
      const month = expenseDate.substring(0, 7);
      if (!state.monthlyTotals[month]) {
        state.monthlyTotals[month] = { expenses: 0, income: 0, net: 0 };
      }
      state.monthlyTotals[month].expenses += classification.amount;
      state.monthlyTotals[month].net =
        state.monthlyTotals[month].income - state.monthlyTotals[month].expenses;

      // Save updated state
      await context.uiState.set(stateId, state);

      // Label the email
      await context.addLabel(email.messageId, 'Finance');
      await context.addLabel(email.messageId, `Finance/${category}`);

      return {
        executed: true,
        reason: `Tracked expense of $${classification.amount} in ${category}`,
        actions: [
          'labeled:Finance',
          `labeled:Finance/${category}`
        ]
      };
    } else if (classification.type === 'income') {
      // Handle income
      const incomeDate = classification.date || email.date;

      state.income.push({
        id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: classification.amount,
        source: classification.description || email.subject,
        date: incomeDate
      });

      // Update monthly totals
      const month = incomeDate.substring(0, 7);
      if (!state.monthlyTotals[month]) {
        state.monthlyTotals[month] = { expenses: 0, income: 0, net: 0 };
      }
      state.monthlyTotals[month].income += classification.amount;
      state.monthlyTotals[month].net =
        state.monthlyTotals[month].income - state.monthlyTotals[month].expenses;

      // Save updated state
      await context.uiState.set(stateId, state);

      // Label the email
      await context.addLabel(email.messageId, 'Finance');
      await context.addLabel(email.messageId, 'Finance/Income');

      return {
        executed: true,
        reason: `Tracked income of $${classification.amount}`,
        actions: [
          'labeled:Finance',
          'labeled:Finance/Income'
        ]
      };
    }

    return {
      executed: false,
      reason: 'Financial email type not recognized'
    };
  } catch (error) {
    return {
      executed: false,
      reason: `Error: ${(error as Error).message}`
    };
  }
}
