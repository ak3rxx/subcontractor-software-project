
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, Clock, AlertTriangle, FileText, Download, MapPin, MessageSquare, Calculator, Wrench, Edit } from 'lucide-react';
import { useVariations } from '@/hooks/useVariations';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';
import EnhancedVariationDetailsModal from './variations/EnhancedVariationDetailsModal';
import QuotationVariationForm from './variations/QuotationVariationForm';
import { useAuth } from '@/contexts/AuthContext';

interface VariationManagerProps {
  projectName: string;
  projectId: string;
}

const VariationManager: React.FC<VariationManagerProps> = ({ projectName, projectId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { variations, loading, createVariation, updateVariation, sendVariationEmail } = useVariations(projectId);
  const [showNewVariation, setShowNewVariation] = useState(false);
  const [editingVariation, setEditingVariation] = useState<any>(null);
  const [emailingSending, setEmailSending] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Permission checks
  const userRole = user?.role || 'user';
  const userEmail = user?.email || '';
  const isFullAccessUser = userEmail === 'huy.nguyen@dcsquared.com.au';
  const canEdit = [
    'project_manager', 
    'contract_administrator', 
    'project_engineer',
    'admin',
    'manager'
  ].includes(userRole) || isFullAccessUser || !userRole;

  const handleViewDetails = (variation: any) => {
    setSelectedVariation(variation);
    setShowDetailsModal(true);
  };

  const handleEditVariation = (variation: any) => {
    setEditingVariation(variation);
    setShowDetailsModal(false);
  };

  const handleSendEmail = async (variationId: string) => {
    setEmailSending(variationId);
    const success = await sendVariationEmail(variationId);
    setEmailSending(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Approval</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">📝 Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  const getTradeBadge = (trade: string) => {
    if (!trade) return <Badge variant="outline">Not specified</Badge>;
    
    const tradeColors: { [key: string]: string } = {
      'carpentry': 'bg-orange-100 text-orange-800',
      'tiling': 'bg-blue-100 text-blue-800',
      'painting': 'bg-purple-100 text-purple-800',
      'rendering': 'bg-green-100 text-green-800',
      'builder': 'bg-yellow-100 text-yellow-800',
      'electrical': 'bg-red-100 text-red-800',
      'plumbing': 'bg-cyan-100 text-cyan-800',
      'hvac': 'bg-indigo-100 text-indigo-800',
    };

    const colorClass = tradeColors[trade.toLowerCase()] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={colorClass}>
        <Wrench className="h-3 w-3 mr-1" />
        {trade.charAt(0).toUpperCase() + trade.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  const handleSubmitVariation = async (variationData: any) => {
    try {
      const result = await createVariation(variationData);
      
      if (result && variationData.attachedFiles && variationData.attachedFiles.length > 0) {
        // Handle file uploads
        const { uploadAttachment } = useVariationAttachments(result.id);
        
        for (const file of variationData.attachedFiles) {
          await uploadAttachment(file);
        }
      }
      
      if (result) {
        setShowNewVariation(false);
        setEditingVariation(null);
        
        toast({
          title: "Success",
          description: "Variation created successfully!"
        });
      }
    } catch (error) {
      console.error('Error creating variation:', error);
      toast({
        title: "Error",
        description: "Failed to create variation",
        variant: "destructive"
      });
    }
  };

  const handleUpdateVariation = async (variationData: any) => {
    try {
      const result = await updateVariation(editingVariation.id, variationData);
      
      if (result && variationData.attachedFiles && variationData.attachedFiles.length > 0) {
        // Handle file uploads for updated variation
        const { uploadAttachment } = useVariationAttachments(editingVariation.id);
        
        for (const file of variationData.attachedFiles) {
          await uploadAttachment(file);
        }
      }
      
      if (result) {
        setEditingVariation(null);
        
        toast({
          title: "Success",
          description: "Variation updated successfully!"
        });
      }
    } catch (error) {
      console.error('Error updating variation:', error);
      toast({
        title: "Error",
        description: "Failed to update variation",
        variant: "destructive"
      });
    }
  };

  const handleVariationUpdate = async (id: string, updates: any) => {
    await updateVariation(id, updates);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading variations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Variation Manager</h3>
          <p className="text-gray-600">Create professional variations with detailed cost breakdowns and trade classification</p>
        </div>
        <Button onClick={() => setShowNewVariation(true)} className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          New Variation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">{variations.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'pending_approval').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              ${variations.filter(v => v.status === 'approved').reduce((sum, v) => sum + (v.total_amount || v.cost_impact), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Approved Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'approved').reduce((sum, v) => sum + v.time_impact, 0)}
            </div>
            <div className="text-sm text-gray-600">Days Extension</div>
          </CardContent>
        </Card>
      </div>

      {/* New/Edit Variation Form */}
      {(showNewVariation || editingVariation) && (
        <Card>
          <CardContent className="p-6">
            <QuotationVariationForm
              onSubmit={editingVariation ? handleUpdateVariation : handleSubmitVariation}
              onCancel={() => {
                setShowNewVariation(false);
                setEditingVariation(null);
              }}
              projectName={projectName}
              isEdit={!!editingVariation}
              initialData={editingVariation}
            />
          </CardContent>
        </Card>
      )}

      {/* Variations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Variation Register</CardTitle>
        </CardHeader>
        <CardContent>
          {variations.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Variations Yet</h3>
              <p className="text-gray-600 mb-4">Create your first variation to get started</p>
              <Button onClick={() => setShowNewVariation(true)}>
                <Calculator className="h-4 w-4 mr-2" />
                Create Variation
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Time Impact</TableHead>
                  <TableHead>EOT/NOD</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((variation) => (
                  <TableRow key={variation.id}>
                    <TableCell className="font-mono text-sm">{variation.variation_number}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {variation.title}
                    </TableCell>
                    <TableCell>
                      {getTradeBadge(variation.trade)}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span title={variation.location}>{variation.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>{variation.request_date}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      ${(variation.total_amount || variation.cost_impact).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      ${variation.gst_amount?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell>
                      {variation.time_impact > 0 ? `+${variation.time_impact}d` : variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {variation.requires_eot && (
                          <Badge variant="outline" className="text-xs">
                            EOT: {variation.eot_days}d
                          </Badge>
                        )}
                        {variation.requires_nod && (
                          <Badge variant="outline" className="text-xs">
                            NOD: {variation.nod_days}d
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(variation.status)}</TableCell>
                    <TableCell>{getPriorityBadge(variation.priority)}</TableCell>
                    <TableCell>
                      {variation.email_sent ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✓ Sent
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not sent</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View Details"
                          onClick={() => handleViewDetails(variation)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit Variation"
                            onClick={() => handleEditVariation(variation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {variation.client_email && !variation.email_sent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Send Email to Client"
                            onClick={() => handleSendEmail(variation.id)}
                            disabled={emailingSending === variation.id}
                          >
                            {emailingSending === variation.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <span>📧</span>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Variation Details Modal */}
      <EnhancedVariationDetailsModal
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={handleVariationUpdate}
        onEdit={canEdit ? handleEditVariation : undefined}
        projectName={projectName}
      />
    </div>
  );
};

export default VariationManager;
