-- Manually approve user huruykid@gmail.com
UPDATE user_verifications 
SET verification_status = 'approved',
    updated_at = now(),
    notes = 'Manually approved by admin'
WHERE user_id = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed';