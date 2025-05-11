
-- Create a function to insert cashier reconciliation
CREATE OR REPLACE FUNCTION public.insert_cashier_reconciliation(
  p_cashier_id UUID,
  p_payment_method TEXT,
  p_reported_amount NUMERIC,
  p_user_id UUID
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.cashier_reconciliation (
    cashier_id,
    payment_method,
    reported_amount,
    user_id
  ) VALUES (
    p_cashier_id,
    p_payment_method,
    p_reported_amount,
    p_user_id
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
