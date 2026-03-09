-- Inspeção simples de deployments por mês no lake.
-- Ajuste nomes de schema/tabelas conforme sua instalação real.

SELECT
  DATE_FORMAT(deployment_finished_date, '%Y-%m') AS month,
  COUNT(DISTINCT cicd_deployment_id) AS deployments
FROM cicd_deployment_commits
WHERE deployment_finished_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(deployment_finished_date, '%Y-%m')
ORDER BY month;
