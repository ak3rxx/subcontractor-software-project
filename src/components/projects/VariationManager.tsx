
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Search, Filter, Eye, Edit, Send, 
  DollarSign, Clock, MapPin, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { useVariations } from '@/hooks/useVariations';
import QuotationVariationForm from './variations/QuotationVariationForm';
import VariationDetailsModal from './VariationDetailsModal';
import { useToast } from '@/hooks/use-toast';

interface VariationManagerProps {
  projectName: string;
  projectId: string;
}

const VariationManager: React.FC<VariationManagerProps> = ({ projectName, projectId }) => {
  const { variations, loading, createVariation, updateVariation, sendVariationEmail } = useVariations(projectId);
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredVariations = variations.filter(variation => {
    const matchesSearch = variation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variation.variation_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || variation.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || variation.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateVariation = async (data: any) => {
    try {
      await createVariation(data);
      toast({
        title: "Success",
        description: "Variation created successfully"
      });
      setShowForm(false);
      setEditingVariation(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create variation",
        variant: "destructive"
      });
    }
  };

  const handleUpdateVariation = async (data: any) => {
    if (!editingVariation) return;
    
    try {
      await updateVariation(editingVariation.id, data);
      toast({
        title: "Success",
        description: "Variation updated successfully"
      });
      setShowForm(false);
      setEditingVariation(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update variation",
        variant: "destructive"
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (editingVariation) {
      await handleUpdateVariation(data);
    } else {
      await handleCreateVariation(data);
    }
  };

  const handleEdit = (variation: any) => {
    setEditingVariation(variation);
    setShowForm(true);
  };

  const handleViewDetails = (variation: any) => {
    setSelectedVariation(variation);
    setShowDetailsModal(true);
  };

  const handleSendEmail = async (variationId: string) => {
    try {
      const success = await sendVariationEmail(variationId);
      if (success) {
        toast({
          title: "Success",
          description: "Variation email sent successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send variation email",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Variations</h2>
          <p className="text-gray-600">Manage project variations and change orders</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Variation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Variations</p>
                <p className="text-2xl font-bold">{variations.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${variations
                    .filter(v => v.status === 'approved')
                    .reduce((sum, v) => sum + (v.total_amount || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {variations.filter(v => v.status === 'pending_approval').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {variations.filter(v => v.priority === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search variations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Variations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Variations List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVariations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No variations found</p>
              <Button onClick={() => setShowForm(true)}>
                Create First Variation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVariations.map((variation) => (
                    <TableRow key={variation.id}>
                      <TableCell className="font-medium">
                        {variation.variation_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{variation.title}</div>
                          {variation.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {variation.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(variation.status)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(variation.priority)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          (variation.total_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(variation.total_amount || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{variation.location || 'Not specified'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(variation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(variation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {variation.client_email && !variation.email_sent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendEmail(variation.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <QuotationVariationForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingVariation(null);
        }}
        onSubmit={handleFormSubmit}
        projectName={projectName}
        editingVariation={editingVariation}
      />

      <VariationDetailsModal
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedVariation(null);
        }}
        onUpdate={updateVariation}
      />
    </div>
  );
};

export default VariationManager;
