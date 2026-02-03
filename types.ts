
export interface RateChange {
  id: string;
  date: string;
  newRate: number;
}

export type RepaymentMethod = 'EMI' | 'EQUAL_PRINCIPAL';

export interface MortgageInputs {
  principal: number;
  annualRate: number;
  totalMonths: number;
  startDate: string;
  rateChanges: RateChange[];
  repaymentMethod: RepaymentMethod;
}

export interface EarlyRepaymentInputs {
  oneTimeAmount: number;
  oneTimeMonth: number;
  monthlyExtra: number;
  strategy: 'REDUCE_TERM' | 'REDUCE_MONTHLY';
}

export interface PaymentMonth {
  month: number;
  date: string;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  extraPaid: number;
  currentRate: number;
}

export interface CalculationResult {
  totalInterest: number;
  totalPayment: number;
  payoffDate: string;
  totalMonths: number;
  schedule: PaymentMonth[];
}

export interface Comparison {
  baseline: CalculationResult;
  optimized: CalculationResult;
  savings: {
    interest: number;
    months: number;
    money: number;
  };
}
