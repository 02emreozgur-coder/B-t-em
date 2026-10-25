import { Account, BudgetPlan, MarketRate, Transaction } from '../types';

/**
 * Reverts the financial effects of a transaction on accounts.
 * Used when a transaction is deleted, or as the first step when a transaction is edited.
 */
export const revertTransactionEffects = (
  accounts: Account[],
  tx: Transaction,
  marketRates: MarketRate[]
): Account[] => {
  const absAmt = Math.abs(tx.amount);
  const xauRate = marketRates.find(r => r.code === 'XAU')?.sellPrice || 6640;

  const acc1 = accounts.find(a => a.id === tx.accountId);
  const acc2 = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : undefined;

  return accounts.map(acc => {
    // 1. PAYMENT (odeme) - e.g. Loan, Debt, Credit Card Payment
    if (tx.type === 'odeme') {
      const isAcc1Debt = acc1?.type === 'borc_alacak' || acc1?.type === 'kredi_karti';
      const isAcc2Debt = acc2 ? (acc2.type === 'borc_alacak' || acc2.type === 'kredi_karti') : false;

      // Determine debt account vs paying bank/cash account
      let debtAccountId: string | undefined;
      let payingAccountId: string | undefined;

      if (isAcc1Debt) {
        debtAccountId = acc1?.id;
        payingAccountId = acc2?.id;
      } else if (isAcc2Debt) {
        debtAccountId = acc2?.id;
        payingAccountId = acc1?.id;
      } else {
        // Neither or both standard accounts
        payingAccountId = acc1?.id;
        debtAccountId = acc2?.id;
      }

      // If this account is the debt account: REVERT PAYMENT -> INCREASE DEBT BACK
      if (debtAccountId && acc.id === debtAccountId) {
        let newBal = acc.balance - absAmt;
        if (Math.abs(newBal) < 0.005) {
          newBal = 0;
        } else {
          newBal = Math.round(newBal * 100) / 100;
        }
        let newRem = acc.remainingInstallments;
        if (acc.remainingInstallments !== undefined) {
          newRem = Math.min(acc.totalInstallments || 999, (acc.remainingInstallments || 0) + 1);
        }
        let newGrams = acc.gramWeight;
        if (acc.currency === 'XAU') {
          const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt / xauRate;
          newGrams = (acc.gramWeight || 0) - grams;
          newGrams = Math.round(newGrams * 10000) / 10000;
        }
        return {
          ...acc,
          balance: newBal,
          remainingInstallments: newRem,
          gramWeight: newGrams
        };
      }

      // If this account is the paying account: REVERT PAYMENT -> REFUND MONEY
      if (payingAccountId && acc.id === payingAccountId) {
        return {
          ...acc,
          balance: Math.round((acc.balance + absAmt) * 100) / 100
        };
      }
    }

    // 2. RECEIVABLE COLLECTION (tahsilat)
    if (tx.type === 'tahsilat') {
      const isAcc1Receivable = acc1?.type === 'borc_alacak';
      const isAcc2Receivable = acc2 ? acc2.type === 'borc_alacak' : false;

      let recAccountId: string | undefined;
      let collectingAccountId: string | undefined;

      if (isAcc1Receivable) {
        recAccountId = acc1?.id;
        collectingAccountId = acc2?.id;
      } else if (isAcc2Receivable) {
        recAccountId = acc2?.id;
        collectingAccountId = acc1?.id;
      } else {
        recAccountId = acc1?.id;
        collectingAccountId = acc2?.id;
      }

      if (recAccountId && acc.id === recAccountId) {
        // Reverting collection: RESTORE RECEIVABLE BALANCE
        return {
          ...acc,
          balance: acc.balance + absAmt
        };
      }

      if (collectingAccountId && acc.id === collectingAccountId) {
        // Reverting collection: DEDUCT MONEY FROM COLLECTING BANK/CASH
        return {
          ...acc,
          balance: acc.balance - absAmt
        };
      }
    }

    // 3. EXPENSE (gider)
    if (tx.type === 'gider') {
      if (acc.id === tx.accountId) {
        // Reverting expense: REFUND TO ACCOUNT (or reduce card debt towards 0)
        return {
          ...acc,
          balance: acc.balance + absAmt
        };
      }
    }

    // 4. INCOME (gelir or baslangic_bakiyesi)
    if (tx.type === 'gelir' || tx.type === 'baslangic_bakiyesi') {
      if (acc.id === tx.accountId) {
        return {
          ...acc,
          balance: acc.balance - absAmt
        };
      }
    }

    // 5. TRANSFER (transfer)
    if (tx.type === 'transfer') {
      if (acc.id === tx.accountId) {
        // Reverting transfer: REFUND SOURCE ACCOUNT
        if (acc.gramWeight !== undefined && acc.currency === 'XAU') {
          const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
          return {
            ...acc,
            gramWeight: (acc.gramWeight || 0) + grams,
            balance: acc.balance + absAmt
          };
        }
        return {
          ...acc,
          balance: acc.balance + absAmt
        };
      }
      if (acc.id === tx.toAccountId) {
        // Reverting transfer: DEDUCT FROM DESTINATION ACCOUNT
        if (acc.gramWeight !== undefined && acc.currency === 'XAU') {
          const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
          return {
            ...acc,
            gramWeight: Math.max(0, (acc.gramWeight || 0) - grams),
            balance: Math.max(0, acc.balance - absAmt)
          };
        }
        return {
          ...acc,
          balance: acc.balance - absAmt
        };
      }
    }

    // 6. INVESTMENT PURCHASE (alis)
    if (tx.type === 'alis') {
      if (acc.type === 'birikim' || acc.id === tx.accountId) {
        const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
        const livePrice = marketRates.find(r => r.code === acc.currency)?.sellPrice || 1;
        const totalTRY = tx.currency === 'TRY' ? absAmt : grams * livePrice;
        return {
          ...acc,
          gramWeight: Math.max(0, (acc.gramWeight || 0) - grams),
          balance: Math.max(0, acc.balance - totalTRY)
        };
      }
      if (acc.id === tx.toAccountId) {
        // Paying bank gets refunded
        const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
        const livePrice = marketRates.find(r => r.code === tx.currency)?.sellPrice || 1;
        const totalTRY = tx.currency === 'TRY' ? absAmt : grams * livePrice;
        return {
          ...acc,
          balance: acc.balance + totalTRY
        };
      }
    }

    // 7. INVESTMENT SALE (satis)
    if (tx.type === 'satis') {
      if (acc.type === 'birikim' || acc.id === tx.accountId) {
        const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
        const livePrice = marketRates.find(r => r.code === acc.currency)?.buyPrice || 1;
        const totalTRY = tx.currency === 'TRY' ? absAmt : grams * livePrice;
        return {
          ...acc,
          gramWeight: (acc.gramWeight || 0) + grams,
          balance: acc.balance + totalTRY
        };
      }
      if (acc.id === tx.toAccountId) {
        // Receiving bank has TRY deducted
        const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
        const livePrice = marketRates.find(r => r.code === tx.currency)?.buyPrice || 1;
        const totalTRY = tx.currency === 'TRY' ? absAmt : grams * livePrice;
        return {
          ...acc,
          balance: acc.balance - totalTRY
        };
      }
    }

    // 8. PHYSICAL ENTRY (giris)
    if (tx.type === 'giris' && acc.id === tx.accountId) {
      const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
      return {
        ...acc,
        gramWeight: Math.max(0, (acc.gramWeight || 0) - grams),
        balance: Math.max(0, acc.balance - absAmt)
      };
    }

    // 9. PHYSICAL EXIT (cikis)
    if (tx.type === 'cikis' && acc.id === tx.accountId) {
      const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
      return {
        ...acc,
        gramWeight: (acc.gramWeight || 0) + grams,
        balance: acc.balance + absAmt
      };
    }

    return acc;
  });
};

/**
 * Applies the financial effects of a transaction on accounts.
 * Used when a new transaction is added or when an edited transaction is applied.
 */
export const applyTransactionEffects = (
  accounts: Account[],
  tx: Transaction,
  marketRates: MarketRate[]
): Account[] => {
  const absAmt = Math.abs(tx.amount);
  const xauRate = marketRates.find(r => r.code === 'XAU')?.sellPrice || 6640;

  const acc1 = accounts.find(a => a.id === tx.accountId);
  const acc2 = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : undefined;

  return accounts.map(acc => {
    // 1. PAYMENT (odeme) - e.g. Loan, Debt, Credit Card Payment
    if (tx.type === 'odeme') {
      const isAcc1Debt = acc1?.type === 'borc_alacak' || acc1?.type === 'kredi_karti';
      const isAcc2Debt = acc2 ? (acc2.type === 'borc_alacak' || acc2.type === 'kredi_karti') : false;

      let debtAccountId: string | undefined;
      let payingAccountId: string | undefined;

      if (isAcc1Debt) {
        debtAccountId = acc1?.id;
        payingAccountId = acc2?.id;
      } else if (isAcc2Debt) {
        debtAccountId = acc2?.id;
        payingAccountId = acc1?.id;
      } else {
        payingAccountId = acc1?.id;
        debtAccountId = acc2?.id;
      }

      // Debt account: REDUCE DEBT (balance increases towards 0)
      if (debtAccountId && acc.id === debtAccountId) {
        let newBal = acc.balance + absAmt;
        if (Math.abs(newBal) < 0.005) {
          newBal = 0;
        } else {
          newBal = Math.round(newBal * 100) / 100;
        }
        let newRem = acc.remainingInstallments;
        if (acc.remainingInstallments !== undefined && acc.remainingInstallments > 0) {
          newRem = Math.max(0, acc.remainingInstallments - 1);
        }
        let newGrams = acc.gramWeight;
        if (acc.currency === 'XAU') {
          const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt / xauRate;
          newGrams = Math.min(0, (acc.gramWeight || 0) + grams);
          newGrams = Math.round(newGrams * 10000) / 10000;
        }
        return {
          ...acc,
          balance: newBal,
          remainingInstallments: newRem,
          gramWeight: newGrams
        };
      }

      // Paying account: DEDUCT MONEY
      if (payingAccountId && acc.id === payingAccountId) {
        return {
          ...acc,
          balance: Math.round((acc.balance - absAmt) * 100) / 100
        };
      }
    }

    // 2. RECEIVABLE COLLECTION (tahsilat)
    if (tx.type === 'tahsilat') {
      const isAcc1Receivable = acc1?.type === 'borc_alacak';
      const isAcc2Receivable = acc2 ? acc2.type === 'borc_alacak' : false;

      let recAccountId: string | undefined;
      let collectingAccountId: string | undefined;

      if (isAcc1Receivable) {
        recAccountId = acc1?.id;
        collectingAccountId = acc2?.id;
      } else if (isAcc2Receivable) {
        recAccountId = acc2?.id;
        collectingAccountId = acc1?.id;
      } else {
        recAccountId = acc1?.id;
        collectingAccountId = acc2?.id;
      }

      if (recAccountId && acc.id === recAccountId) {
        return {
          ...acc,
          balance: Math.max(0, acc.balance - absAmt)
        };
      }

      if (collectingAccountId && acc.id === collectingAccountId) {
        return {
          ...acc,
          balance: acc.balance + absAmt
        };
      }
    }

    // 3. EXPENSE (gider)
    if (tx.type === 'gider') {
      if (acc.id === tx.accountId) {
        return {
          ...acc,
          balance: acc.balance - absAmt
        };
      }
    }

    // 4. INCOME (gelir or baslangic_bakiyesi)
    if (tx.type === 'gelir' || tx.type === 'baslangic_bakiyesi') {
      if (acc.id === tx.accountId) {
        return {
          ...acc,
          balance: acc.balance + absAmt
        };
      }
    }

    // 5. TRANSFER (transfer)
    if (tx.type === 'transfer') {
      if (acc.id === tx.accountId) {
        if (acc.gramWeight !== undefined && acc.currency === 'XAU') {
          const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
          return {
            ...acc,
            gramWeight: Math.max(0, (acc.gramWeight || 0) - grams),
            balance: acc.balance - absAmt
          };
        }
        return {
          ...acc,
          balance: acc.balance - absAmt
        };
      }
      if (acc.id === tx.toAccountId) {
        if (acc.gramWeight !== undefined && acc.currency === 'XAU') {
          const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
          return {
            ...acc,
            gramWeight: (acc.gramWeight || 0) + grams,
            balance: acc.balance + absAmt
          };
        }
        return {
          ...acc,
          balance: acc.balance + absAmt
        };
      }
    }

    // 6. INVESTMENT PURCHASE (alis)
    if (tx.type === 'alis') {
      if (acc.type === 'birikim' || acc.id === tx.accountId) {
        const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
        const livePrice = marketRates.find(r => r.code === acc.currency)?.sellPrice || 1;
        const totalTRY = tx.currency === 'TRY' ? absAmt : grams * livePrice;
        return {
          ...acc,
          gramWeight: (acc.gramWeight || 0) + grams,
          balance: acc.balance + totalTRY
        };
      }
      if (acc.id === tx.toAccountId) {
        const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
        const livePrice = marketRates.find(r => r.code === tx.currency)?.sellPrice || 1;
        const totalTRY = tx.currency === 'TRY' ? absAmt : grams * livePrice;
        return {
          ...acc,
          balance: acc.balance - totalTRY
        };
      }
    }

    // 7. INVESTMENT SALE (satis)
    if (tx.type === 'satis') {
      if (acc.type === 'birikim' || acc.id === tx.accountId) {
        const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
        const livePrice = marketRates.find(r => r.code === acc.currency)?.buyPrice || 1;
        const totalTRY = tx.currency === 'TRY' ? absAmt : grams * livePrice;
        return {
          ...acc,
          gramWeight: Math.max(0, (acc.gramWeight || 0) - grams),
          balance: Math.max(0, acc.balance - totalTRY)
        };
      }
      if (acc.id === tx.toAccountId) {
        const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
        const livePrice = marketRates.find(r => r.code === tx.currency)?.buyPrice || 1;
        const totalTRY = tx.currency === 'TRY' ? absAmt : grams * livePrice;
        return {
          ...acc,
          balance: acc.balance + totalTRY
        };
      }
    }

    // 8. PHYSICAL ENTRY (giris)
    if (tx.type === 'giris' && acc.id === tx.accountId) {
      const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
      return {
        ...acc,
        gramWeight: (acc.gramWeight || 0) + grams,
        balance: acc.balance + absAmt
      };
    }

    // 9. PHYSICAL EXIT (cikis)
    if (tx.type === 'cikis' && acc.id === tx.accountId) {
      const grams = tx.metalGram ? Math.abs(tx.metalGram) : absAmt;
      return {
        ...acc,
        gramWeight: Math.max(0, (acc.gramWeight || 0) - grams),
        balance: Math.max(0, acc.balance - absAmt)
      };
    }

    return acc;
  });
};

/**
 * Reverts the budget spent amount for an expense.
 */
export const revertBudgetEffects = (budgetPlans: BudgetPlan[], tx: Transaction): BudgetPlan[] => {
  if (tx.type !== 'gider') return budgetPlans;
  const absAmt = Math.abs(tx.amount);
  return budgetPlans.map(plan => {
    if (plan.categoryName.toLowerCase() === tx.category.toLowerCase()) {
      return { ...plan, spent: Math.max(0, plan.spent - absAmt) };
    }
    return plan;
  });
};

/**
 * Applies the budget spent amount for an expense.
 */
export const applyBudgetEffects = (budgetPlans: BudgetPlan[], tx: Transaction): BudgetPlan[] => {
  if (tx.type !== 'gider') return budgetPlans;
  const absAmt = Math.abs(tx.amount);
  return budgetPlans.map(plan => {
    if (plan.categoryName.toLowerCase() === tx.category.toLowerCase()) {
      return { ...plan, spent: plan.spent + absAmt };
    }
    return plan;
  });
};
