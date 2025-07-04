
-- Remove all loan data records for "Unsecured consumer loans" dataset
DELETE FROM public.loan_data 
WHERE dataset_name = 'Unsecured consumer loans';

-- Remove all sharing records for "Unsecured consumer loans" dataset
DELETE FROM public.dataset_shares 
WHERE dataset_name = 'Unsecured consumer loans';
