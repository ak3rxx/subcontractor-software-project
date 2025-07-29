import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizations } from '@/hooks/useOrganizations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Search, Link, FileText, MapPin, Paperclip } from 'lucide-react';
import SimpleFileUpload from '@/components/projects/qa-itp/SimpleFileUpload';
import { useSimpleFileUpload } from '@/hooks/useSimpleFileUpload';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => Promise<void>;
  projectId?: string;
  linkedModule?: string;
}

interface LinkedItem {
  id: string;
  number: string;
  title: string;
  type: 'variation' | 'rfi' | 'qa' | 'milestone';
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  linkedModule,
}) => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { organizationUsers } = useOrganizations();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<Task> & { url_link?: string; drawing_number?: string; location?: string }>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    category: linkedModule || 'general',
    project_id: projectId,
    assigned_to: '',
    due_date: '',
    linked_module: '',
    linked_id: '',
    reference_number: '',
    url_link: '',
    drawing_number: '',
    location: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [selectedLinkedItem, setSelectedLinkedItem] = useState<LinkedItem | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // File upload integration
  const { files, uploadFiles, removeFile, clearFiles, isUploading } = useSimpleFileUpload({
    bucket: 'taskfiles'
  });

  // Load team members when project is selected
  useEffect(() => {
    if (formData.project_id && organizationUsers) {
      const members: TeamMember[] = organizationUsers.map(ou => ({
        id: ou.user_id,
        name: ou.user_profile?.full_name || ou.user_profile?.email || 'Unknown User',
        email: ou.user_profile?.email || '',
        role: ou.role
      }));
      setTeamMembers(members);
    }
  }, [formData.project_id, organizationUsers]);

  // Search for linkable items when search term changes
  useEffect(() => {
    const searchLinkedItems = async () => {
      if (!searchTerm || searchTerm.length < 3 || !formData.project_id) {
        setLinkedItems([]);
        return;
      }

      try {
        const results: LinkedItem[] = [];

        // Search variations
        const { data: variations } = await supabase
          .from('variations')
          .select('id, variation_number, title')
          .eq('project_id', formData.project_id)
          .ilike('variation_number', `%${searchTerm}%`)
          .limit(5);

        if (variations) {
          results.push(...variations.map(v => ({
            id: v.id,
            number: v.variation_number,
            title: v.title,
            type: 'variation' as const
          })));
        }

        // Search RFIs
        const { data: rfis } = await supabase
          .from('rfis')
          .select('id, rfi_number, title')
          .eq('project_id', formData.project_id)
          .ilike('rfi_number', `%${searchTerm}%`)
          .limit(5);

        if (rfis) {
          results.push(...rfis.map(r => ({
            id: r.id,
            number: r.rfi_number,
            title: r.title,
            type: 'rfi' as const
          })));
        }

        // Search QA Inspections
        const { data: inspections } = await supabase
          .from('qa_inspections')
          .select('id, inspection_number, task_area')
          .eq('project_id', formData.project_id)
          .ilike('inspection_number', `%${searchTerm}%`)
          .limit(5);

        if (inspections) {
          results.push(...inspections.map(i => ({
            id: i.id,
            number: i.inspection_number,
            title: i.task_area,
            type: 'qa' as const
          })));
        }

        // Search Milestones
        const { data: milestones } = await supabase
          .from('programme_milestones')
          .select('id, reference_number, milestone_name')
          .eq('project_id', formData.project_id)
          .ilike('reference_number', `%${searchTerm}%`)
          .limit(5);

        if (milestones) {
          results.push(...milestones.map(m => ({
            id: m.id,
            number: m.reference_number || '',
            title: m.milestone_name,
            type: 'milestone' as const
          })));
        }

        setLinkedItems(results);
      } catch (error) {
        console.error('Error searching linked items:', error);
      }
    };

    searchLinkedItems();
  }, [searchTerm, formData.project_id]);

  const handleLinkedItemSelect = (item: LinkedItem) => {
    setSelectedLinkedItem(item);
    setFormData(prev => ({
      ...prev,
      linked_module: item.type,
      linked_id: item.id,
      reference_number: item.number,
      category: item.type,
      title: prev.title || `${item.type.toUpperCase()}: ${item.title}`
    }));
    setSearchTerm('');
    setLinkedItems([]);
  };

  const clearLinkedItem = () => {
    setSelectedLinkedItem(null);
    setFormData(prev => ({
      ...prev,
      linked_module: '',
      linked_id: '',
      reference_number: '',
      category: linkedModule || 'general'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.project_id) return;

    setLoading(true);
    try {
      // Prepare attachments data from uploaded files
      const attachments = files.map(file => ({
        id: file.id,
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString()
      }));

      await onSubmit({
        ...formData,
        attachments: attachments.length > 0 ? attachments : []
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      category: linkedModule || 'general',
      project_id: projectId,
      assigned_to: '',
      due_date: '',
      linked_module: '',
      linked_id: '',
      reference_number: '',
      url_link: '',
      drawing_number: '',
      location: '',
    });
    setSelectedLinkedItem(null);
    setSearchTerm('');
    setLinkedItems([]);
    clearFiles();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {linkedModule ? `Create ${linkedModule.toUpperCase()} Task` : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Selection */}
          {!projectId && (
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select 
                value={formData.project_id || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Module Link Search */}
          {formData.project_id && (
            <div className="space-y-2">
              <Label>Link to Module (Optional)</Label>
              {selectedLinkedItem ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Badge variant="secondary" className="capitalize">
                    {selectedLinkedItem.type}
                  </Badge>
                  <span className="font-medium">{selectedLinkedItem.number}</span>
                  <span className="text-sm text-muted-foreground flex-1">
                    {selectedLinkedItem.title}
                  </span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={clearLinkedItem}
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type Variation, RFI, QA, or Milestone number..."
                      className="pl-10"
                    />
                  </div>
                  {linkedItems.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {linkedItems.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                          onClick={() => handleLinkedItemSelect(item)}
                        >
                          <Badge variant="outline" className="capitalize text-xs">
                            {item.type}
                          </Badge>
                          <span className="font-medium">{item.number}</span>
                          <span className="text-sm text-muted-foreground truncate">
                            {item.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the task..."
              rows={3}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select 
              value={formData.assigned_to || 'unassigned'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value === 'unassigned' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <span>{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status, Priority and Category */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Task['status'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Task['priority'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={!!selectedLinkedItem}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="trade">Trade</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="variation">Variation</SelectItem>
                  <SelectItem value="rfi">RFI</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Additional Information</h4>
            
            <div className="grid grid-cols-1 gap-4">
              {/* URL Link */}
              <div className="space-y-2">
                <Label htmlFor="url_link" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URL Link
                </Label>
                <Input
                  id="url_link"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url_link || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, url_link: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Drawing Number */}
                <div className="space-y-2">
                  <Label htmlFor="drawing_number" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Drawing Number
                  </Label>
                  <Input
                    id="drawing_number"
                    placeholder="DWG-001"
                    value={formData.drawing_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, drawing_number: e.target.value }))}
                  />
                  {formData.drawing_number && (
                    <p className="text-xs text-muted-foreground">
                      Will auto-link to drawings folder
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="Building A, Level 2"
                    value={formData.location || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              {/* File Attachments */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </Label>
                <SimpleFileUpload
                  accept="*/*"
                  multiple={true}
                  maxFiles={10}
                  onFilesChange={() => {}}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || isUploading || !formData.title || !formData.project_id}
            >
              {loading || isUploading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};