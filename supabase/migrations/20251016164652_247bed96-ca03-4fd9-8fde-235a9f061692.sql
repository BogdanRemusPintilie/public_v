-- Allow offer owners to update responses to their offers (for issuer_response field)
CREATE POLICY "Offer owners can update responses to their offers"
ON offer_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM offers
    WHERE offers.id = offer_responses.offer_id
    AND offers.user_id = auth.uid()
  )
);