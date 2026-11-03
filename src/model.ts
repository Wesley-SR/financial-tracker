export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
};

export type FinancialProfile = {
  income: number;
  fixedExpenses: number;
  plannedMonthlyInvestment: number;
  financialAssets: number;
  emergencyFundTarget: number;
  apartmentValue: number;
  mortgageBalance: number;
  mortgagePayment: number;
  mortgageRemainingMonths: number;
  mortgageAnnualRate: number;
  vehicleValue: number;
  otherAssets: number;
  otherDebt: number;
  millionGoal: number;
  annualRealReturn: number;
};

export type AppState = {
  profile: FinancialProfile;
  transactions: Transaction[];
  configured: boolean;
};

export const initialState: AppState = {
  configured: false,
  transactions: [],
  profile: {
    income: 0,
    fixedExpenses: 0,
    plannedMonthlyInvestment: 0,
    financialAssets: 0,
    emergencyFundTarget: 0,
    apartmentValue: 0,
    mortgageBalance: 0,
    mortgagePayment: 0,
    mortgageRemainingMonths: 0,
    mortgageAnnualRate: 0,
    vehicleValue: 0,
    otherAssets: 0,
    otherDebt: 0,
    millionGoal: 1_000_000,
    annualRealReturn: 4,
  },
};

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function getHomeEquity(profile: FinancialProfile) {
  return Math.max(profile.apartmentValue - profile.mortgageBalance, 0);
}

export function getNetWorth(profile: FinancialProfile) {
  return (
    profile.financialAssets +
    getHomeEquity(profile) +
    profile.vehicleValue +
    profile.otherAssets -
    profile.otherDebt
  );
}

export function getMonthlyMargin(profile: FinancialProfile) {
  return profile.income - profile.fixedExpenses;
}

export function projectYearsToGoal(
  current: number,
  goal: number,
  monthlyContribution: number,
  annualRealReturnPercent: number,
) {
  if (current >= goal) return 0;
  if (monthlyContribution <= 0 && annualRealReturnPercent <= 0) return null;

  const monthlyRate = Math.pow(1 + annualRealReturnPercent / 100, 1 / 12) - 1;
  let balance = Math.max(current, 0);
  const maxMonths = 100 * 12;

  for (let month = 1; month <= maxMonths; month += 1) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    if (balance >= goal) return month / 12;
  }

  return null;
}
