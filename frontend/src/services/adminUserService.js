import { supabase } from '@/lib/supabase'

const adminUserService = {
  async getUsers() {
    const { data, error } = await supabase.rpc('get_users_admin')
    if (error) throw error
    return data || []
  },

  async setUserAdmin(userId, isAdmin) {
    const { error } = await supabase.rpc('set_user_admin', {
      p_user_id: userId,
      p_is_admin: isAdmin
    })
    if (error) throw error
    return true
  }
}

export default adminUserService
