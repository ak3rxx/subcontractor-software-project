
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useVariationFiles = (variationId?: string) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAttachments = useCallback(async () => {
    if (!variationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('variation_attachments')
        .select('*')
        .eq('variation_id', variationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching attachments:', error);
        toast({
          title: "Error",
          description: "Failed to load attachments",
          variant: "destructive"
        });
        return;
      }

      setAttachments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [variationId, toast]);

  const uploadFile = useCallback(async (file: File) => {
    if (!variationId || !user) return null;

    setUploading(true);
    try {
      // Create attachment record (this will trigger the audit log)
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

      if (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: `File "${file.name}" uploaded successfully`
      });

      // Refresh attachments
      await fetchAttachments();
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [variationId, user, toast, fetchAttachments]);

  const deleteFile = useCallback(async (attachmentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('variation_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) {
        console.error('Error deleting file:', error);
        toast({
          title: "Error",
          description: "Failed to delete file",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      // Refresh attachments
      await fetchAttachments();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast, fetchAttachments]);

  return {
    attachments,
    loading,
    uploading,
    fetchAttachments,
    uploadFile,
    deleteFile
  };
};
