-- ==========================================================
-- STICKLE SUPABASE SEED DATA
-- Primary Dev User: vbhavya269@gmail.com (TEAMS plan)
-- ==========================================================

DO $$
DECLARE
  target_email TEXT := 'vbhavya269@gmail.com';
  dev_user_id UUID;
  alex_user_id UUID := '22222222-2222-2222-2222-222222222222';
  ws_id UUID := '33333333-3333-3333-3333-333333333333';
  existing_ws_id UUID;
BEGIN
  -- 1. Locate existing auth user for vbhavya269@gmail.com or fallback
  SELECT id INTO dev_user_id FROM auth.users WHERE email = target_email LIMIT 1;

  IF dev_user_id IS NULL THEN
    dev_user_id := '11111111-1111-1111-1111-111111111111';
    BEGIN
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES 
        (dev_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', target_email, '$2a$10$Wp.u9JvK9wH7c3Z/7Q.o2e1.234567890abcdefghijklm', now(), '{"provider":"email","providers":["email"]}', '{"name":"Bhavya V", "avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocI-sample-bhavya", "picture":"https://lh3.googleusercontent.com/a/ACg8ocI-sample-bhavya"}', now(), now())
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping dev auth.user insert';
    END;
  END IF;

  -- Insert Alex teammate auth user if not present
  BEGIN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
      (alex_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex@stickle.app', '$2a$10$Wp.u9JvK9wH7c3Z/7Q.o2e1.234567890abcdefghijklm', now(), '{"provider":"email","providers":["email"]}', '{"name":"Alex Teammate", "avatar_url":"https://avatars.githubusercontent.com/u/10101?v=4", "picture":"https://avatars.githubusercontent.com/u/10101?v=4"}', now(), now())
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping alex auth.user insert';
  END;

  -- 2. Upsert Profiles & Upgrade vbhavya269@gmail.com to team_member plan
  INSERT INTO public.profiles (id, email, tier, license_key, avatar_url)
  VALUES 
    (dev_user_id, target_email, 'team_member', 'PRO-STICKLE-DEV-001', 'https://lh3.googleusercontent.com/a/ACg8ocI-sample-bhavya'),
    (alex_user_id, 'alex@stickle.app', 'team_member', 'PRO-STICKLE-ALEX-002', 'https://avatars.githubusercontent.com/u/10101?v=4')
  ON CONFLICT (id) DO UPDATE SET
    tier = 'team_member',
    avatar_url = EXCLUDED.avatar_url;

  -- 3. Detect or Create Workspace owned by dev_user_id
  SELECT id INTO existing_ws_id FROM public.workspaces WHERE owner_id = dev_user_id LIMIT 1;
  IF existing_ws_id IS NOT NULL THEN
    ws_id := existing_ws_id;
  ELSE
    INSERT INTO public.workspaces (id, name, slug, owner_id)
    VALUES (ws_id, 'Acme Engineering', 'acme-engineering', dev_user_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 4. Add Workspace Memberships
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES 
    (ws_id, dev_user_id, 'owner'),
    (ws_id, alex_user_id, 'member')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- 5. Insert / Update Sample Shared Web Notes (Forces anchor update if present)
  INSERT INTO public.notes (
    id, local_id, user_id, workspace_id, url, domain, page_title, content, color, border_style, tags, anchor
  ) VALUES 
    (
      '44444444-4444-4444-4444-444444444444',
      'local_note_dev_1',
      dev_user_id,
      ws_id,
      'https://en.wikipedia.org/wiki/React_(software)',
      'wikipedia.org',
      'React (software) - Wikipedia',
      'Acme Team: Core architectural overview note pinned to Wikipedia.',
      'lime',
      'solid',
      ARRAY['architecture', 'team-review'],
      '{"cssSelector": "p", "domIndex": 2, "domTag": "p", "tier": "selector", "offsetX": 10, "offsetY": 20, "pageX": 180, "pageY": 350, "textFingerprint": "React is a free and open-source front-end JavaScript library"}'::jsonb
    ),
    (
      '55555555-5555-5555-5555-555555555555',
      'local_note_alex_1',
      alex_user_id,
      ws_id,
      'https://en.wikipedia.org/wiki/React_(software)',
      'wikipedia.org',
      'React (software) - Wikipedia',
      'Teammate note by Alex: Checked performance metrics for V18 concurrent features.',
      'lilac',
      'solid',
      ARRAY['perf', 'react18'],
      '{"cssSelector": "p", "domIndex": 5, "domTag": "p", "tier": "selector", "offsetX": 15, "offsetY": 30, "pageX": 180, "pageY": 550, "textFingerprint": "React can be used to develop single-page applications"}'::jsonb
    )
  ON CONFLICT (id) DO UPDATE SET
    anchor = EXCLUDED.anchor,
    workspace_id = EXCLUDED.workspace_id,
    user_id = EXCLUDED.user_id,
    content = EXCLUDED.content;

  -- 6. Insert Waitlist Lead
  INSERT INTO public.waitlist (email, use_case, source)
  VALUES ('researcher@example.com', 'Academic Research', 'seed_script')
  ON CONFLICT (email) DO NOTHING;

END $$;
