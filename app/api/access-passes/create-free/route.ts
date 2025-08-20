import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QUOTA } from '@/lib/payment/quota'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: '用户未登录' }, { status: 401 })
    }

    // 检查用户是否已经有通行证
    const { data: existingPass, error: checkError } = await supabase
      .from('access_passes')
      .select('*')
      .eq('user_id', user.id)
      .gt('end_at', new Date().toISOString())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing access pass:', checkError)
      return NextResponse.json({ error: '检查通行证状态失败' }, { status: 500 })
    }

    // 如果用户已经有有效通行证，直接返回成功
    if (existingPass) {
      return NextResponse.json({ 
        message: 'User already has an active pass',
        accessPass: existingPass 
      })
    }

    // 检查用户是否有任何通行证历史（包括已过期的）
    const { data: accessPasses, error: historyError } = await supabase
      .from('access_passes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (historyError) {
      console.error('Error checking access pass history:', historyError)
      return NextResponse.json({ error: '检查通行证历史失败' }, { status: 500 })
    }

    // 如果用户之前试用过任何通行证，拒绝创建免费通行证
    if (accessPasses && accessPasses.length > 0) {
      return NextResponse.json({ 
        error: '您已经试用过该产品，请选择付费套餐继续使用',
        code: 'ALREADY_TRIED'
      }, { status: 400 })
    }

    // 计算免费通行证的有效期（3天）
    const startAt = new Date()
    const endAt = new Date()
    endAt.setDate(startAt.getDate() + 3)

    // 创建免费通行证
    const { data: accessPass, error: insertError } = await supabase
      .from('access_passes')
      .insert({
        user_id: user.id,
        plan: 'FREE',
        source: 'free_trial',
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        quota_full_optimize: QUOTA.FREE.quota_full_optimize,
        quota_block_optimize: QUOTA.FREE.quota_block_optimize,
        quota_motivation_letter: QUOTA.FREE.quota_motivation_letter,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating free access pass:', insertError)
      return NextResponse.json({ error: 'Failed to create free pass' }, { status: 500 })
    }

    console.log('Successfully created free access pass for user:', user.id)

    return NextResponse.json({ 
      message: 'Free pass created successfully',
      accessPass 
    })

  } catch (error: any) {
    console.error('Create free access pass failed:', error.message)
    return NextResponse.json({ error: '创建免费通行证失败' }, { status: 500 })
  }
}
