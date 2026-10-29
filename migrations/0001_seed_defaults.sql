-- Insert default user for self-hosted single tenant / Cloudflare Access
INSERT OR IGNORE INTO `users` (`id`, `email`, `name`, `default_currency`, `created_at`) 
VALUES ('usr_owner', 'me@simplicity.local', 'Account Owner', 'THB', datetime('now'));

-- Insert default primary cash wallet
INSERT OR IGNORE INTO `wallets` (`id`, `user_id`, `name`, `type`, `currency`, `starting_balance`, `current_balance`, `color`, `icon`, `order_index`, `status`, `created_at`)
VALUES ('wal_default', 'usr_owner', 'Cash Wallet', 'cash', 'THB', 0, 0, '#12C48B', 'wallet', 0, 'active', datetime('now'));

-- Insert Spendee default categories
INSERT OR IGNORE INTO `categories` (`id`, `user_id`, `name`, `type`, `color`, `icon`, `position`, `status`) VALUES
('cat_food', NULL, 'Food & Drinks', 'expense', '#FF735C', 'Utensils', 1, 'active'),
('cat_shopping', NULL, 'Shopping', 'expense', '#38A3F1', 'ShoppingBag', 2, 'active'),
('cat_housing', NULL, 'Housing & Rent', 'expense', '#FFAA2C', 'Home', 3, 'active'),
('cat_transport', NULL, 'Transportation', 'expense', '#16A085', 'Bus', 4, 'active'),
('cat_vehicle', NULL, 'Vehicle & Fuel', 'expense', '#2ECC71', 'Car', 5, 'active'),
('cat_entertainment', NULL, 'Entertainment & Fun', 'expense', '#E91E63', 'Film', 6, 'active'),
('cat_tech', NULL, 'Communication & PC', 'expense', '#9065ED', 'Smartphone', 7, 'active'),
('cat_financial', NULL, 'Financial Expenses & Fees', 'expense', '#4A6572', 'Receipt', 8, 'active'),
('cat_investments', NULL, 'Investments & Savings', 'expense', '#00ACC1', 'TrendingUp', 9, 'active'),
('cat_health', NULL, 'Healthcare & Fitness', 'expense', '#F55353', 'HeartPulse', 10, 'active'),
('cat_travel', NULL, 'Travel & Vacation', 'expense', '#2980B9', 'Plane', 11, 'active'),
('cat_education', NULL, 'Education', 'expense', '#8E44AD', 'GraduationCap', 12, 'active'),
('cat_gifts', NULL, 'Gifts & Charity', 'expense', '#D81B60', 'Gift', 13, 'active'),
('cat_bills', NULL, 'Utilities & Bills', 'expense', '#F39C12', 'Zap', 14, 'active'),
('cat_other_exp', NULL, 'Other Expenses', 'expense', '#7F8C8D', 'MoreHorizontal', 15, 'active'),
('cat_salary', NULL, 'Salary', 'income', '#12C48B', 'Banknote', 16, 'active'),
('cat_business', NULL, 'Business Income', 'income', '#00BCD4', 'Briefcase', 17, 'active'),
('cat_dividends', NULL, 'Dividends & Interest', 'income', '#F1C40F', 'LineChart', 18, 'active'),
('cat_extra_inc', NULL, 'Extra Income & Freelance', 'income', '#3498DB', 'Coins', 19, 'active'),
('cat_gift_inc', NULL, 'Gifts Received', 'income', '#E91E63', 'Gift', 20, 'active'),
('cat_other_inc', NULL, 'Other Income', 'income', '#95A5A6', 'PlusCircle', 21, 'active');
