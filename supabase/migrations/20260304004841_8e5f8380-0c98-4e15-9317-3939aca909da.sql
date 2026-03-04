-- Enable realtime for faturas so buyers get notified of new invoices
ALTER PUBLICATION supabase_realtime ADD TABLE public.faturas;