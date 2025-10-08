-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para gerar conteúdo diário automaticamente
-- Roda todo dia às 00:00 UTC (21:00 horário de Brasília no horário de verão)
SELECT cron.schedule(
  'generate-daily-content',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
        url := 'https://vaynvghwdiaviglqkadu.supabase.co/functions/v1/generate-daily-content',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheW52Z2h3ZGlhdmlnbHFrYWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Njc0MzMsImV4cCI6MjA3NTA0MzQzM30.BVZuUDzm14P42D845wPCtDVPwPcXfEwh1cihA5-li8o"}'::jsonb,
        body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Comentário explicativo
COMMENT ON EXTENSION pg_cron IS 'Job scheduler para PostgreSQL - usado para gerar conteúdo diário automaticamente';
