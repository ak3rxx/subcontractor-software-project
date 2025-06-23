
-- Create full access policies for variations table for huy.nguyen@dcsquared.com.au
CREATE POLICY "Full access user can view all variations" ON public.variations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can update all variations" ON public.variations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can insert all variations" ON public.variations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can delete all variations" ON public.variations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );
