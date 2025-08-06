import "server-only"
import {createClient} from "@/lib/supabase/server";
import {Database} from "@/types/supabase";

type QuotaObj<Col> = {
  total: number,
  used: number,
  colName: Col
}

type Quota = {
  fullOptimize: QuotaObj<"full_optimize">,
  blockOptimize: QuotaObj<"block_optimize">,
  motivationLetter: QuotaObj<"motivation_letter">
}

type DBAccessPass = Database["public"]["Tables"]["access_passes"]["Row"]

type QuotaKey = keyof Quota

// 用户订阅信息类型
type UserSubscription = {
  plan: 'FREE' | 'LITE' | 'PRO' | null
  planName: string
  expiryDate: string | null
  isActive: boolean
  quotas: {
    fullOptimize: { used: number; total: number }
    blockOptimize: { used: number; total: number }
    motivationLetter: { used: number; total: number }
  }
}

// 获取用户有效订阅的方法
export async function getActiveAccessPass(userId: string): Promise<DBAccessPass | null> {
  const supabase = await createClient()

  const { data: accessPass, error } = await supabase
    .from('access_passes')
    .select('*')
    .eq('user_id', userId)
    .gt('end_at', new Date().toISOString())
    .order('end_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return accessPass
}


// 新增：获取用户订阅信息
export async function getUserSubscription(): Promise<UserSubscription> {
  const supabase = await createClient()

  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('用户未登录')
  }

  // 获取用户有效订阅
  const accessPass = await getActiveAccessPass(user.id)

  // 如果没有有效订阅，返回默认值
  if (!accessPass) {
    return {
      plan: null,
      planName: '无套餐',
      expiryDate: null,
      isActive: false,
      quotas: {
        fullOptimize: { used: 0, total: 0 },
        blockOptimize: { used: 0, total: 0 },
        motivationLetter: { used: 0, total: 0 }
      }
    }
  }

  const planNames = {
    'FREE': '免费试用',
    'LITE': 'Lite 14天',
    'PRO': 'Pro 30天'
  }

  return {
    plan: accessPass.plan,
    planName: planNames[accessPass.plan] || '未知套餐',
    expiryDate: accessPass.end_at,
    isActive: true,
    quotas: {
      fullOptimize: { 
        used: accessPass.used_full_optimize, 
        total: accessPass.quota_full_optimize 
      },
      blockOptimize: { 
        used: accessPass.used_block_optimize,
        total: accessPass.quota_block_optimize 
      },
      motivationLetter: { 
        used: accessPass.used_motivation_letter, 
        total: accessPass.quota_motivation_letter 
      }
    }
  }
}

const buildQuotas = (accessPass: DBAccessPass): Quota => {
  return {
    fullOptimize: {
      total: accessPass.quota_full_optimize!!,
      used: accessPass.used_full_optimize!!,
      colName: "full_optimize"
    },
    blockOptimize: {
      total: accessPass.quota_block_optimize!!,
      used: accessPass.used_block_optimize!!,
      colName: "block_optimize"
    },
    motivationLetter: {
      total: accessPass.quota_motivation_letter!!,
      used: accessPass.used_motivation_letter!!,
      colName: "motivation_letter"
    }
  }
}

// TODO: 在各个地方调用来消耗配额
export async function consumeQuota(key: QuotaKey) {
  const supabase = await createClient()
  const {data: accessPass, error} = await supabase
    .from("access_passes")
    .select("*").single()

  if (error) {
    throw error
  }

  const quotas = buildQuotas(accessPass)

  const updateParams = verifyAndUpdateQuota(key, quotas)

  await supabase
    .from("access_passes")
    .update({
      ...updateParams
    })
    .eq('id', accessPass.id)
}

function verifyAndUpdateQuota(key: QuotaKey, quotas: Quota) {
  const quotaItem = quotas[key]
  if (quotaItem.used >= quotaItem.total) {
    throw new Error("Limit reached")
  }

  return {
    [`used_${quotaItem.colName}`]: quotaItem.used + 1
  }
}

// 目前不做配额的限制，但是需要限制用户申请岗位的数量， 未来考虑设计进配额
export async function verifyJobApplicationLimit() {
  const supabase = await createClient()

  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('用户未登录')
  }

  const {data: jobApplications, error} = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)

  if (error) {
    throw error
  }

  if (jobApplications.length >= 10) {
    throw new Error('您已达岗位申请上限, 请尝试删除一些已申请的岗位')
  }
}

