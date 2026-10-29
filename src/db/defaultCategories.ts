export interface DefaultCategory {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  position: number;
  status: 'active';
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Expense Categories
  { id: 'cat_food', name: 'Food & Drinks', type: 'expense', color: '#FF735C', icon: 'Utensils', position: 1, status: 'active' },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', color: '#38A3F1', icon: 'ShoppingBag', position: 2, status: 'active' },
  { id: 'cat_housing', name: 'Housing & Rent', type: 'expense', color: '#FFAA2C', icon: 'Home', position: 3, status: 'active' },
  { id: 'cat_transport', name: 'Transportation', type: 'expense', color: '#16A085', icon: 'Bus', position: 4, status: 'active' },
  { id: 'cat_vehicle', name: 'Vehicle & Fuel', type: 'expense', color: '#2ECC71', icon: 'Car', position: 5, status: 'active' },
  { id: 'cat_entertainment', name: 'Entertainment & Fun', type: 'expense', color: '#E91E63', icon: 'Film', position: 6, status: 'active' },
  { id: 'cat_tech', name: 'Communication & PC', type: 'expense', color: '#9065ED', icon: 'Smartphone', position: 7, status: 'active' },
  { id: 'cat_financial', name: 'Financial Expenses & Fees', type: 'expense', color: '#4A6572', icon: 'Receipt', position: 8, status: 'active' },
  { id: 'cat_investments', name: 'Investments & Savings', type: 'expense', color: '#00ACC1', icon: 'TrendingUp', position: 9, status: 'active' },
  { id: 'cat_health', name: 'Healthcare & Fitness', type: 'expense', color: '#F55353', icon: 'HeartPulse', position: 10, status: 'active' },
  { id: 'cat_travel', name: 'Travel & Vacation', type: 'expense', color: '#2980B9', icon: 'Plane', position: 11, status: 'active' },
  { id: 'cat_education', name: 'Education', type: 'expense', color: '#8E44AD', icon: 'GraduationCap', position: 12, status: 'active' },
  { id: 'cat_gifts', name: 'Gifts & Charity', type: 'expense', color: '#D81B60', icon: 'Gift', position: 13, status: 'active' },
  { id: 'cat_bills', name: 'Utilities & Bills', type: 'expense', color: '#F39C12', icon: 'Zap', position: 14, status: 'active' },
  { id: 'cat_other_exp', name: 'Other Expenses', type: 'expense', color: '#7F8C8D', icon: 'MoreHorizontal', position: 15, status: 'active' },

  // Income Categories
  { id: 'cat_salary', name: 'Salary', type: 'income', color: '#12C48B', icon: 'Banknote', position: 16, status: 'active' },
  { id: 'cat_business', name: 'Business Income', type: 'income', color: '#00BCD4', icon: 'Briefcase', position: 17, status: 'active' },
  { id: 'cat_dividends', name: 'Dividends & Interest', type: 'income', color: '#F1C40F', icon: 'LineChart', position: 18, status: 'active' },
  { id: 'cat_extra_inc', name: 'Extra Income & Freelance', type: 'income', color: '#3498DB', icon: 'Coins', position: 19, status: 'active' },
  { id: 'cat_gift_inc', name: 'Gifts Received', type: 'income', color: '#E91E63', icon: 'Gift', position: 20, status: 'active' },
  { id: 'cat_other_inc', name: 'Other Income', type: 'income', color: '#95A5A6', icon: 'PlusCircle', position: 21, status: 'active' },
];
