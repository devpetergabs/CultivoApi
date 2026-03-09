-- Lista simples para inspeção manual dos deployments recentes.
-- Ajuste nomes de schema/tabelas conforme sua instalação real.

SELECT
  cicd_deployment_id,
  deployment_finished_date,
  result,
  environment,
  repo_url
FROM cicd_deployments
WHERE deployment_finished_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
ORDER BY deployment_finished_date DESC
LIMIT 200;
