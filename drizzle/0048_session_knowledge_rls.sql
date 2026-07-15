-- Tenant RLS for Talk sessions + knowledge (hot paths).
-- Default app.bypass_rls remains 'on' for Neon HTTP until callers use withTenantContext.
-- Also allow home-org writes on published catalog employees (app layer still
-- blocks non-home catalog mutation).
-- Idempotent: safe to re-run after a partial apply.

DROP POLICY IF EXISTS digital_employee_tenant_write ON digital_employee;
--> statement-breakpoint
CREATE POLICY digital_employee_tenant_write ON digital_employee
  FOR ALL
  USING (
    app_rls_bypass()
    OR organization_id::text = app_current_org_id()
  )
  WITH CHECK (
    app_rls_bypass()
    OR organization_id::text = app_current_org_id()
  );
--> statement-breakpoint

ALTER TABLE employee_session ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE employee_session FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS employee_session_tenant ON employee_session;
--> statement-breakpoint
CREATE POLICY employee_session_tenant ON employee_session
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint

ALTER TABLE employee_session_message ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE employee_session_message FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS employee_session_message_tenant ON employee_session_message;
--> statement-breakpoint
CREATE POLICY employee_session_message_tenant ON employee_session_message
  FOR ALL
  USING (
    app_rls_bypass()
    OR EXISTS (
      SELECT 1
      FROM employee_session es
      WHERE es.id = employee_session_message.session_id
        AND es.organization_id::text = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_bypass()
    OR EXISTS (
      SELECT 1
      FROM employee_session es
      WHERE es.id = employee_session_message.session_id
        AND es.organization_id::text = app_current_org_id()
    )
  );
--> statement-breakpoint

ALTER TABLE knowledge_source ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE knowledge_source FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS knowledge_source_tenant_select ON knowledge_source;
--> statement-breakpoint
CREATE POLICY knowledge_source_tenant_select ON knowledge_source
  FOR SELECT
  USING (
    app_rls_bypass()
    OR EXISTS (
      SELECT 1
      FROM digital_employee de
      WHERE de.id = knowledge_source.employee_id
        AND (
          de.organization_id::text = app_current_org_id()
          OR EXISTS (
            SELECT 1
            FROM platform_employee_catalog pec
            WHERE pec.employee_id = de.id
              AND pec.is_published = true
          )
        )
    )
  );
--> statement-breakpoint
DROP POLICY IF EXISTS knowledge_source_tenant_write ON knowledge_source;
--> statement-breakpoint
CREATE POLICY knowledge_source_tenant_write ON knowledge_source
  FOR ALL
  USING (
    app_rls_bypass()
    OR EXISTS (
      SELECT 1
      FROM digital_employee de
      WHERE de.id = knowledge_source.employee_id
        AND de.organization_id::text = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_bypass()
    OR EXISTS (
      SELECT 1
      FROM digital_employee de
      WHERE de.id = knowledge_source.employee_id
        AND de.organization_id::text = app_current_org_id()
    )
  );
--> statement-breakpoint

ALTER TABLE knowledge_chunk ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE knowledge_chunk FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS knowledge_chunk_tenant_select ON knowledge_chunk;
--> statement-breakpoint
CREATE POLICY knowledge_chunk_tenant_select ON knowledge_chunk
  FOR SELECT
  USING (
    app_rls_bypass()
    OR EXISTS (
      SELECT 1
      FROM knowledge_source ks
      INNER JOIN digital_employee de ON de.id = ks.employee_id
      WHERE ks.id = knowledge_chunk.source_id
        AND (
          de.organization_id::text = app_current_org_id()
          OR EXISTS (
            SELECT 1
            FROM platform_employee_catalog pec
            WHERE pec.employee_id = de.id
              AND pec.is_published = true
          )
        )
    )
  );
--> statement-breakpoint
DROP POLICY IF EXISTS knowledge_chunk_tenant_write ON knowledge_chunk;
--> statement-breakpoint
CREATE POLICY knowledge_chunk_tenant_write ON knowledge_chunk
  FOR ALL
  USING (
    app_rls_bypass()
    OR EXISTS (
      SELECT 1
      FROM knowledge_source ks
      INNER JOIN digital_employee de ON de.id = ks.employee_id
      WHERE ks.id = knowledge_chunk.source_id
        AND de.organization_id::text = app_current_org_id()
    )
  )
  WITH CHECK (
    app_rls_bypass()
    OR EXISTS (
      SELECT 1
      FROM knowledge_source ks
      INNER JOIN digital_employee de ON de.id = ks.employee_id
      WHERE ks.id = knowledge_chunk.source_id
        AND de.organization_id::text = app_current_org_id()
    )
  );
