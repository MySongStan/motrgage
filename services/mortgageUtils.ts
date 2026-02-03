
import { MortgageInputs, EarlyRepaymentInputs, CalculationResult, PaymentMonth, RateChange } from '../types';

export function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate <= 0) return principal / months;
  if (months <= 0) return principal;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

export function simulateMortgage(
  mortgage: MortgageInputs,
  early: EarlyRepaymentInputs | null = null
): CalculationResult {
  const totalMonthsOriginal = mortgage.totalMonths;
  let currentAnnualRate = mortgage.annualRate;
  let monthlyRate = currentAnnualRate / 100 / 12;
  let remainingBalance = mortgage.principal;
  let repaymentMethod = mortgage.repaymentMethod;
  
  // For EMI: constant payment
  // For Equal Principal: constant principal
  let currentMonthlyPayment = 0;
  let currentMonthlyPrincipal = 0;

  if (repaymentMethod === 'EMI') {
    currentMonthlyPayment = calculateMonthlyPayment(mortgage.principal, currentAnnualRate, totalMonthsOriginal);
  } else {
    currentMonthlyPrincipal = mortgage.principal / totalMonthsOriginal;
  }
  
  const schedule: PaymentMonth[] = [];
  let totalInterest = 0;
  let totalPayment = 0;
  let month = 1;

  const start = new Date(mortgage.startDate);
  const sortedRateChanges = [...mortgage.rateChanges].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  while (remainingBalance > 0.005 && month <= 600) {
    const currentDate = new Date(start);
    currentDate.setMonth(start.getMonth() + month - 1);
    const currentDateStr = currentDate.toISOString().split('T')[0];

    // 1. Check for Interest Rate Changes
    const activeChange = sortedRateChanges.find(rc => {
        const rcDate = new Date(rc.date);
        return rcDate.getFullYear() === currentDate.getFullYear() && rcDate.getMonth() === currentDate.getMonth();
    });

    if (activeChange && activeChange.newRate !== currentAnnualRate) {
      currentAnnualRate = activeChange.newRate;
      monthlyRate = currentAnnualRate / 100 / 12;
      
      const remainingMonths = totalMonthsOriginal - month + 1;
      const calcMonths = Math.max(1, remainingMonths);
      
      if (repaymentMethod === 'EMI') {
        currentMonthlyPayment = calculateMonthlyPayment(remainingBalance, currentAnnualRate, calcMonths);
      } else {
        // Equal principal usually recalculates principal if the plan is adjusted, 
        // but standard bank logic keeps original principal per month.
        // We recalculate based on remaining balance to handle any previous extra payments.
        currentMonthlyPrincipal = remainingBalance / calcMonths;
      }
    }

    // 2. Calculate current month interest and principal
    const interestForMonth = remainingBalance * monthlyRate;
    let principalForMonth = 0;

    if (repaymentMethod === 'EMI') {
      principalForMonth = Math.min(remainingBalance, currentMonthlyPayment - interestForMonth);
    } else {
      principalForMonth = Math.min(remainingBalance, currentMonthlyPrincipal);
    }
    
    if (principalForMonth < 0) principalForMonth = 0;
    const standardPayment = principalForMonth + interestForMonth;

    // 3. Apply Early Repayment
    let extraPayment = 0;
    if (early) {
      if (month >= early.oneTimeMonth) {
        extraPayment += early.monthlyExtra;
      }
      if (month === early.oneTimeMonth) {
        extraPayment += early.oneTimeAmount;
      }
    }

    extraPayment = Math.min(remainingBalance - principalForMonth, extraPayment);
    
    totalInterest += interestForMonth;
    totalPayment += (standardPayment + extraPayment);
    remainingBalance -= (principalForMonth + extraPayment);

    schedule.push({
      month,
      date: currentDateStr,
      payment: standardPayment,
      principalPaid: principalForMonth,
      interestPaid: interestForMonth,
      remainingBalance: Math.max(0, remainingBalance),
      extraPaid: extraPayment,
      currentRate: currentAnnualRate
    });

    // 4. Handle "Reduce Monthly" Strategy
    if (early?.strategy === 'REDUCE_MONTHLY' && extraPayment > 0) {
      const remainingOriginalMonths = totalMonthsOriginal - month;
      if (remainingOriginalMonths > 0) {
        if (repaymentMethod === 'EMI') {
          currentMonthlyPayment = calculateMonthlyPayment(remainingBalance, currentAnnualRate, remainingOriginalMonths);
        } else {
          currentMonthlyPrincipal = remainingBalance / remainingOriginalMonths;
        }
      }
    }

    month++;
  }

  const lastDate = schedule.length > 0 ? schedule[schedule.length - 1].date : mortgage.startDate;

  return {
    totalInterest,
    totalPayment,
    payoffDate: lastDate,
    totalMonths: schedule.length,
    schedule
  };
}
