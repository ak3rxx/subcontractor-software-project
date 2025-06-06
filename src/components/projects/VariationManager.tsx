
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, Clock, AlertTriangle, FileText, Download } from 'lucide-react';

interface VariationManagerProps {
  projectName: string;
}

const VariationManager: React.FC<VariationManagerProps> = ({ projectName }) => {
  const { toast } = useToast();
  const [showNewVariation, setShowNewVariation] = useState(false);
  const [newVariation, setNewVariation] = useState({
    title: '',
    description: '',
    submittedBy: '',
    costImpact: '',
    timeImpact: '',
    category: '',
    priority: 'normal',
    clientEmail: '',
    justification: ''
  });

  // Sample variations data
  const variations = [
    {
      id: 'VAR-001',
      title: 'Additional Electrical Points - Unit 3A',
      description: 'Client requested 4 additional power points in living area',
      submittedBy: 'Sarah Johnson',
      submittedDate: '2024-01-10',
      costImpact: 1250,
      timeImpact: 2,
      status: 'approved',
      category: 'electrical',
      priority: 'normal'
    },
    {
      id: 'VAR-002',
      title: 'Upgrade Bathroom Fixtures',
      description: 'Change standard fixtures to premium range as per client selection',
      submittedBy: 'Mike Davis',
      submittedDate: '2024-01-08',
      costImpact: 3500,
      timeImpact: 0,
      status: 'pending',
      category: 'fixtures',
      priority: 'low'
    },
    {
      id: 'VAR-003',
      title: 'Structural Beam Modification',
      description: 'Modify beam size due to engineering requirement',
      submittedBy: 'John Smith',
      submittedDate: '2024-01-05',
      costImpact: -800,
      timeImpact: 5,
      status: 'rejected',
      category: 'structural',
      priority: 'high'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
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
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  const handleSubmitVariation = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New Variation:', newVariation);
    
    toast({
      title: "Variation Submitted",
      description: `${newVariation.title} has been submitted for approval. PDF will be generated and sent to client.`,
    });

    setNewVariation({
      title: '',
      description: '',
      submittedBy: '',
      costImpact: '',
      timeImpact: '',
      category: '',
      priority: 'normal',
      clientEmail: '',
      justification: ''
    });
    setShowNewVariation(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Variation Manager</h3>
          <p className="text-gray-600">Track project variations and cost impacts</p>
        </div>
        <Button onClick={() => setShowNewVariation(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Variation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              ${variations.filter(v => v.status === 'approved').reduce((sum, v) => sum + v.costImpact, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Approved Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'approved').reduce((sum, v) => sum + v.timeImpact, 0)}
            </div>
            <div className="text-sm text-gray-600">Days Extension</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">
              {variations.filter(v => v.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">{variations.length}</div>
            <div className="text-sm text-gray-600">Total Variations</div>
          </CardContent>
        </Card>
      </div>

      {/* New Variation Form */}
      {showNewVariation && (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Variation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitVariation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variationTitle">Variation Title</Label>
                  <Input
                    id="variationTitle"
                    value={newVariation.title}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of variation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submittedBy">Submitted By</Label>
                  <Input
                    id="submittedBy"
                    value={newVariation.submittedBy}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, submittedBy: e.target.value }))}
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={newVariation.description}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the variation including scope and requirements"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costImpact">Cost Impact ($)</Label>
                  <Input
                    id="costImpact"
                    type="number"
                    value={newVariation.costImpact}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, costImpact: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeImpact">Time Impact (days)</Label>
                  <Input
                    id="timeImpact"
                    type="number"
                    value={newVariation.timeImpact}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, timeImpact: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newVariation.priority} onValueChange={(value) => setNewVariation(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newVariation.category} onValueChange={(value) => setNewVariation(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="structural">Structural</SelectItem>
                      <SelectItem value="fixtures">Fixtures & Fittings</SelectItem>
                      <SelectItem value="finishes">Finishes</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={newVariation.clientEmail}
                    onChange={(e) => setNewVariation(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="client@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification / Reason for Variation</Label>
                <Textarea
                  id="justification"
                  value={newVariation.justification}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, justification: e.target.value }))}
                  placeholder="Explain why this variation is necessary or requested"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-4">
                <Button type="submit">Submit Variation</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewVariation(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Variations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Variation Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Cost Impact</TableHead>
                <TableHead>Time Impact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variations.map((variation) => (
                <TableRow key={variation.id}>
                  <TableCell className="font-mono text-sm">{variation.id}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {variation.title}
                  </TableCell>
                  <TableCell>{variation.submittedBy}</TableCell>
                  <TableCell>{variation.submittedDate}</TableCell>
                  <TableCell className={variation.costImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(variation.costImpact)}
                  </TableCell>
                  <TableCell>
                    {variation.timeImpact > 0 ? `+${variation.timeImpact}d` : variation.timeImpact === 0 ? '0d' : `${variation.timeImpact}d`}
                  </TableCell>
                  <TableCell>{getStatusBadge(variation.status)}</TableCell>
                  <TableCell>{getPriorityBadge(variation.priority)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" title="View Details">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VariationManager;
