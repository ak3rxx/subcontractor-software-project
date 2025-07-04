
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface VariationFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

interface FileCache {
  [variationId: string]: {
    data: VariationFile[];
    timestamp: number;
    loading: boolean;
  };
}

export const useVariationFileManagement = () => {
  const [cache, setCache] = useState<FileCache>({});
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const pendingRequests = useRef<Set<string>>(new Set());

  // Smart fetch with caching and deduplication
  const fetchFiles = useCallback(async (variationId: string, forceRefresh = false) => {
    if (!variationId) return [];

    // Check cache first (5 minute cache)
    const cacheEntry = cache[variationId];
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (!forceRefresh && cacheEntry && !cacheEntry.loading && (now - cacheEntry.timestamp) < CACHE_DURATION) {
      return cacheEntry.data;
    }

    // Prevent duplicate requests
    if (pendingRequests.current.has(variationId)) {
      return cacheEntry?.data || [];
    }

    pendingRequests.current.add(variationId);

    // Set loading state
    setCache(prev => ({
      ...prev,
      [variationId]: {
        data: prev[variationId]?.data || [],
        timestamp: prev[variationId]?.timestamp || 0,
        loading: true
      }
    }));

    try {
      const { data, error } = await supabase
        .from('variation_attachments')
        .select('*')
        .eq('variation_id', variationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }

      const files = data || [];

      // Update cache
      setCache(prev => ({
        ...prev,
        [variationId]: {
          data: files,
          timestamp: now,
          loading: false
        }
      }));

      return files;
    } catch (error) {
      console.error('Error fetching variation files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      });
      
      // Reset loading state on error
      setCache(prev => ({
        ...prev,
        [variationId]: {
          data: prev[variationId]?.data || [],
          timestamp: prev[variationId]?.timestamp || 0,
          loading: false
        }
      }));

      return [];
    } finally {
      pendingRequests.current.delete(variationId);
    }
  }, [cache, toast]);

  // Optimistic upload with rollback capability
  const uploadFile = useCallback(async (variationId: string, file: File) => {
    if (!variationId || !user) return null;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticFile: VariationFile = {
      id: tempId,
      file_name: file.name,
      file_path: '',
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user.id,
      created_at: new Date().toISOString()
    };

    // Optimistic update
    setCache(prev => ({
      ...prev,
      [variationId]: {
        data: [optimisticFile, ...(prev[variationId]?.data || [])],
        timestamp: prev[variationId]?.timestamp || Date.now(),
        loading: false
      }
    }));

    setUploading(true);

    try {
      const { data, error } = await supabase
        .from('variation_attachments')
        .insert({
          variation_id: variationId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: `variations/${variationId}/${file.name}`,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic update with real data
      setCache(prev => ({
        ...prev,
        [variationId]: {
          data: prev[variationId]?.data.map(f => 
            f.id === tempId ? data : f
          ) || [data],
          timestamp: Date.now(),
          loading: false
        }
      }));

      toast({
        title: "Success",
        description: `File "${file.name}" uploaded successfully`
      });

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Rollback optimistic update
      setCache(prev => ({
        ...prev,
        [variationId]: {
          data: prev[variationId]?.data.filter(f => f.id !== tempId) || [],
          timestamp: prev[variationId]?.timestamp || 0,
          loading: false
        }
      }));

      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });

      return null;
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  // Delete with optimistic update
  const deleteFile = useCallback(async (variationId: string, fileId: string) => {
    if (!user) return false;

    const originalFile = cache[variationId]?.data.find(f => f.id === fileId);
    if (!originalFile) return false;

    // Optimistic update - remove file immediately
    setCache(prev => ({
      ...prev,
      [variationId]: {
        data: prev[variationId]?.data.filter(f => f.id !== fileId) || [],
        timestamp: prev[variationId]?.timestamp || 0,
        loading: false
      }
    }));

    try {
      const { error } = await supabase
        .from('variation_attachments')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      
      // Rollback - restore the file
      setCache(prev => ({
        ...prev,
        [variationId]: {
          data: [...(prev[variationId]?.data || []), originalFile].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
          timestamp: prev[variationId]?.timestamp || 0,
          loading: false
        }
      }));

      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });

      return false;
    }
  }, [user, toast, cache]);

  // Invalidate cache for a specific variation
  const invalidateCache = useCallback((variationId: string) => {
    setCache(prev => {
      const { [variationId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Get files from cache
  const getFiles = useCallback((variationId: string) => {
    return {
      files: cache[variationId]?.data || [],
      loading: cache[variationId]?.loading || false,
      lastFetched: cache[variationId]?.timestamp || 0
    };
  }, [cache]);

  return {
    fetchFiles,
    uploadFile,
    deleteFile,
    getFiles,
    invalidateCache,
    uploading,
    cache
  };
};
