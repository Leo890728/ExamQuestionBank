/**
 * Tag Service - Supabase RPC (per docs/supabase-rpc-api.md)
 */
import { supabase } from '@/lib/supabase'

const tagService = {
  // Get tags with optional search/pagination
  async getTags(params = {}) {
    const { data, error } = await supabase.rpc('get_tags', {
      p_search: params.search || null,
      p_limit: params.limit || 50,
      p_offset: params.offset || 0
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  // Get single tag by id
  async getTagDetail(id) {
    const { data, error } = await supabase.rpc('get_tag_detail', {
      p_id: Number(id)
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  // Create tag (admin/service role)
  async createTag(tag) {
    const name = typeof tag === 'string' ? tag : tag?.name
    const { data, error } = await supabase.rpc('create_tag', {
      p_name: name
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  // Update tag (admin/service role)
  async updateTag(id, tag) {
    const name = typeof tag === 'string' ? tag : tag?.name
    const { data, error } = await supabase.rpc('update_tag', {
      p_id: Number(id),
      p_name: name
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  // Delete tag (admin/service role)
  async deleteTag(id) {
    const { data, error } = await supabase.rpc('delete_tag', {
      p_id: Number(id)
    })
    if (error) throw new Error(error.message)
    return { data }
  }
}

export default tagService
