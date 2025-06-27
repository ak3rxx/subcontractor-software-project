
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VariationAttachment {
  id: string;
  variation_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
}

export const useVariationAttachments = (variationId?: string) => {
  const [attachments, setAttachments] = useState<VariationAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAttachments = useCallback(async () => {
    if (!variationId) {
      setAttachments([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching attachments for variation:', variationId);
      const { data, error } = await supabase
        .from('variation_attachments')
        .select('*')
        .eq('variation_id', variationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching attachments:', error);
        throw error;
      }

      console.log('Attachments fetched:', data);
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attachments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [variationId, toast]);

  const uploadAttachment = useCallback(async (file: File): Promise<VariationAttachment | null> => {
    if (!variationId) {
      console.error('Cannot upload attachment: no variation ID');
      return null;
    }

    setLoading(true);
    try {
      console.log('Uploading file:', file.name, 'for variation:', variationId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${variationId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('variation-attachments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data, error } = await supabase
        .from('variation_attachments')
        .insert({
          variation_id: variationId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);
      setAttachments(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "File uploaded successfully"
      });

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [variationId, toast]);

  const downloadAttachment = useCallback(async (attachment: VariationAttachment) => {
    try {
      console.log('Downloading attachment:', attachment.file_name);
      
      const { data, error } = await supabase.storage
        .from('variation-attachments')
        .download(attachment.file_path);

      if (error) {
        console.error('Download error:', error);
        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteAttachment = useCallback(async (attachmentId: string) => {
    try {
      console.log('Deleting attachment:', attachmentId);
      
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) {
        console.error('Attachment not found:', attachmentId);
        return;
      }

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('variation-attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error } = await supabase
        .from('variation_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) {
        console.error('Database delete error:', error);
        throw error;
      }

      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      
      toast({
        title: "Success",
        description: "File deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  }, [attachments, toast]);

  return {
    attachments,
    loading,
    fetchAttachments,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment
  };
};
