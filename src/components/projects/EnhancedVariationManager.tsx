
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Download, 
  MapPin, 
  MessageSquare, 
  Calculator,
  Link2,
  TrendingUp
} from 'lucide-react';
import { useEnhancedVariations } from '@/hooks/useEnhancedVariations';
import { useVariationIntegration } from '@/hooks/useVariationIntegration';
import VariationDetailsModal from './VariationDetailsModal';
import QuotationVariationForm from './variations/QuotationVariationForm';
import VariationIntegrationPanel from './variations/VariationIntegrationPanel';

interface EnhancedVariationManagerProps {
  projectName: string;
  projectId: string;
}

const EnhancedVariationManager: React.FC<EnhancedVariationManagerProps> = ({ 
  projectName, 
  projectId 
}) => {
  const { toast } = useToast();
  const { variations, loading, createVariation, updateVariation } = useEnhancedVariations(projectId);
  const { projectImpact } = useVariationIntegration(projectId);
  const [showNewVariation, setShowNewVariation] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);

  const handleViewDetails = (variation: any) => {
    setSelectedVariation(variation);
    setShowDetailsModal(true);
  };

  const handleViewIntegration = (variation: any) => {
    setSelectedVariation(variation);
    setShowIntegrationPanel(true);
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

  const getIntegrationBadge = (status: string) => {
    switch (status) {
      case 'linked':
        return <Badge className="bg-blue-100 text-blue-800">🔗 Linked</Badge>;
      case 'applied':
        return <Badge className="bg-green-100 text-green-800">✅ Applied</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">⏳ Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSubmitVariation = async (variationData: any) => {
    const result = await createVariation(variationData);
    
    if (result) {
      setShowNewVariation(false);
      toast({
        title: "Success",
        description: "Enhanced variation created successfully!"
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
        <p className="mt-4 text-gray-600">Loading enhanced variations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Enhanced Variation Manager</h3>
          <p className="text-gray-600">
            Integrated variation management with finance and programme tracking
          </p>
        </div>
        <Button onClick={() => setShowNewVariation(true)} className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          New Integrated Variation
        </Button>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">{variations.length}</div>
            <div className="text-sm text-gray-600">Total Variations</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Link2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.integrationStatus === 'linked').length}
            </div>
            <div className="text-sm text-gray-600">Integrated</div>
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
              ${projectImpact?.total_approved_cost?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Approved Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">
              ${projectImpact?.total_pending_cost?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Pending Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              {projectImpact?.total_time_impact || 0}
            </div>
            <div className="text-sm text-gray-600">Days Extension</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList>
          <TabsTrigger value="register">Variation Register</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="integration">Integration Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Variation Register</CardTitle>
            </CardHeader>
            <CardContent>
              {variations.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Variations Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first integrated variation</p>
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
                      <TableHead>Location</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Time Impact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Integration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variations.map((variation) => (
                      <TableRow key={variation.id}>
                        <TableCell className="font-mono text-sm">
                          {variation.variation_number}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {variation.title}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span title={variation.location}>{variation.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${variation.total_amount?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell>
                          {variation.time_impact > 0 
                            ? `+${variation.time_impact}d` 
                            : variation.time_impact === 0 
                              ? '0d' 
                              : `${variation.time_impact}d`}
                        </TableCell>
                        <TableCell>{getStatusBadge(variation.status)}</TableCell>
                        <TableCell>{getPriorityBadge(variation.priority)}</TableCell>
                        <TableCell>{getIntegrationBadge(variation.integrationStatus || 'pending')}</TableCell>
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Integration Panel"
                              onClick={() => handleViewIntegration(variation)}
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Create New Integrated Variation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuotationVariationForm
                onSubmit={handleSubmitVariation}
                onCancel={() => setShowNewVariation(false)}
                projectName={projectName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Variations:</span>
                    <span className="font-bold">{variations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integrated Variations:</span>
                    <span className="font-bold text-blue-600">
                      {variations.filter(v => v.integrationStatus === 'linked').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Integration:</span>
                    <span className="font-bold text-yellow-600">
                      {variations.filter(v => v.integrationStatus === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integration Rate:</span>
                    <span className="font-bold text-green-600">
                      {variations.length > 0 
                        ? Math.round((variations.filter(v => v.integrationStatus === 'linked').length / variations.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Approved Cost Impact:</span>
                    <span className="font-bold text-green-600">
                      ${projectImpact?.total_approved_cost?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Cost Impact:</span>
                    <span className="font-bold text-yellow-600">
                      ${projectImpact?.total_pending_cost?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Time Extension:</span>
                    <span className="font-bold text-blue-600">
                      {projectImpact?.total_time_impact || 0} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <VariationDetailsModal
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={handleVariationUpdate}
      />

      {/* Integration Panel Modal */}
      {showIntegrationPanel && selectedVariation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Integration Panel - {selectedVariation.variation_number}
              </h2>
              <Button variant="ghost" onClick={() => setShowIntegrationPanel(false)}>
                ✕
              </Button>
            </div>
            <VariationIntegrationPanel
              variation={selectedVariation}
              projectId={projectId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVariationManager;
