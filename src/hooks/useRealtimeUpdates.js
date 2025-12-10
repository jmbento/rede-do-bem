import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook para subscrever atualizações em tempo real
 */
export const useRealtimeUpdates = (table, onUpdate) => {
  useEffect(() => {
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          onUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onUpdate])
}

/**
 * Hook para monitorar mudanças em itens específicos
 */
export const useItemRealtime = (itemId, callback) => {
  useEffect(() => {
    if (!itemId) return

    const channel = supabase
      .channel(`item:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: `id=eq.${itemId}`,
        },
        callback
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [itemId, callback])
}

/**
 * Hook para monitorar novas missões disponíveis
 */
export const useMissionsRealtime = (userRole, callback) => {
  useEffect(() => {
    if (userRole !== 'distribuidor') return

    const channel = supabase
      .channel('new-missions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'missions',
        },
        callback
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userRole, callback])
}

export default {
  useRealtimeUpdates,
  useItemRealtime,
  useMissionsRealtime
}
