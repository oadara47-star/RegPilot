import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: caller } = await admin.from('profiles').select('*').eq('id', userData.user.id).single();
    if (!caller || caller.role !== 'regulatory_manager') {
      return NextResponse.json({ error: 'Only the Regulatory Manager can create users.' }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, email, password, role, department, lineIds } = body;
    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const { data: newAuthUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, department },
    });
    if (createError || !newAuthUser.user) {
      return NextResponse.json({ error: createError?.message || 'User creation failed.' }, { status: 400 });
    }

    const newUserId = newAuthUser.user.id;
    const { error: profileError } = await admin.from('profiles').insert({
      id: newUserId,
      company_id: caller.company_id,
      full_name: fullName,
      email,
      role,
      department,
    });
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    if (Array.isArray(lineIds) && lineIds.length > 0) {
      const rows = lineIds.map((lineId: string) => ({ user_id: newUserId, regulatory_line_id: lineId }));
      await admin.from('user_line_access').insert(rows);
    }

    return NextResponse.json({ ok: true, userId: newUserId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
