-- Tenant RLS (defense-in-depth). App sets:
--   SET LOCAL app.organization_id = '<uuid>';
--   SET LOCAL app.bypass_rls = 'off';
-- Service / migrate / Inngest:
--   SET LOCAL app.bypass_rls = 'on';
-- Neon HTTP `db` connections should call withRlsBypass or rely on session default
-- until all paths use withTenantContext.

CREATE OR REPLACE FUNCTION app_rls_bypass() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.bypass_rls', true), ''), 'on') = 'on'
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_current_org_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.organization_id', true), '')
$$;
--> statement-breakpoint
ALTER TABLE digital_employee ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE digital_employee FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS digital_employee_tenant_select ON digital_employee;
--> statement-breakpoint
CREATE POLICY digital_employee_tenant_select ON digital_employee
  FOR SELECT
  USING (
    app_rls_bypass()
    OR organization_id::text = app_current_org_id()
    OR EXISTS (
      SELECT 1
      FROM platform_employee_catalog pec
      WHERE pec.employee_id = digital_employee.id
        AND pec.is_published = true
    )
  );
--> statement-breakpoint
DROP POLICY IF EXISTS digital_employee_tenant_write ON digital_employee;
--> statement-breakpoint
CREATE POLICY digital_employee_tenant_write ON digital_employee
  FOR ALL
  USING (
    app_rls_bypass()
    OR (
      organization_id::text = app_current_org_id()
      AND NOT EXISTS (
        SELECT 1
        FROM platform_employee_catalog pec
        WHERE pec.employee_id = digital_employee.id
          AND pec.is_published = true
      )
    )
  )
  WITH CHECK (
    app_rls_bypass()
    OR (
      organization_id::text = app_current_org_id()
      AND NOT EXISTS (
        SELECT 1
        FROM platform_employee_catalog pec
        WHERE pec.employee_id = digital_employee.id
          AND pec.is_published = true
      )
    )
  );
--> statement-breakpoint
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE membership FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS membership_tenant ON membership;
--> statement-breakpoint
CREATE POLICY membership_tenant ON membership
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE api_key ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE api_key FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS api_key_tenant ON api_key;
--> statement-breakpoint
CREATE POLICY api_key_tenant ON api_key
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE audit_event ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_event FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS audit_event_tenant ON audit_event;
--> statement-breakpoint
CREATE POLICY audit_event_tenant ON audit_event
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE employee_mission ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE employee_mission FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS employee_mission_tenant ON employee_mission;
--> statement-breakpoint
CREATE POLICY employee_mission_tenant ON employee_mission
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE employee_task ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE employee_task FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS employee_task_tenant ON employee_task;
--> statement-breakpoint
CREATE POLICY employee_task_tenant ON employee_task
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE organization_settings FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS organization_settings_tenant ON organization_settings;
--> statement-breakpoint
CREATE POLICY organization_settings_tenant ON organization_settings
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE employee_work_event ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE employee_work_event FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS employee_work_event_tenant ON employee_work_event;
--> statement-breakpoint
CREATE POLICY employee_work_event_tenant ON employee_work_event
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE export_job ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE export_job FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS export_job_tenant ON export_job;
--> statement-breakpoint
CREATE POLICY export_job_tenant ON export_job
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
