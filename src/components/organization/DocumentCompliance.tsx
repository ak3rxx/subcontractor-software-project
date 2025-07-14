
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface ComplianceDocument {
  id: string;
  type: string;
  name: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  upload_date: string;
  expiry_date: string;
  file_url?: string;
}

interface DocumentComplianceProps {
  organizationId?: string;
}

const DocumentCompliance: React.FC<DocumentComplianceProps> = ({ organizationId }) => {
  // Mock data - in real implementation, this would come from the database
  const [documents] = useState<ComplianceDocument[]>([
    {
      id: '1',
      type: 'SWMS',
      name: 'Site Work Method Statement 2024',
      status: 'valid',
      upload_date: '2024-01-01',
      expiry_date: '2024-12-31',
      file_url: '/documents/swms-2024.pdf'
    },
    {
      id: '2',
      type: 'Insurance',
      name: 'Public Liability Insurance',
      status: 'valid',
      upload_date: '2023-11-15',
      expiry_date: '2024-11-15',
      file_url: '/documents/insurance-2024.pdf'
    },
    {
      id: '3',
      type: 'License',
      name: 'Building License NSW',
      status: 'expiring',
      upload_date: '2023-02-01',
      expiry_date: '2024-02-01',
      file_url: '/documents/license-nsw.pdf'
    },
    {
      id: '4',
      type: 'Certificate',
      name: 'Safety Certification',
      status: 'missing',
      upload_date: '',
      expiry_date: '',
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid': return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
      case 'expiring': return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      case 'missing': return <Badge variant="secondary">Missing</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expiring': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'expired': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'missing': return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default: return null;
    }
  };

  const validDocuments = documents.filter(d => d.status === 'valid').length;
  const complianceScore = Math.round((validDocuments / documents.length) * 100);

  const handleUpload = (documentType: string) => {
    // In real implementation, handle file upload
    console.log('Uploading document for:', documentType);
  };

  const handleDownload = (document: ComplianceDocument) => {
    // In real implementation, download the file
    console.log('Downloading:', document.name);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Compliance Overview</CardTitle>
          <CardDescription>
            Track compliance documents, certificates, and licenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{complianceScore}%</div>
              <div className="text-sm text-gray-600">Compliance Score</div>
            </div>
            <Progress value={complianceScore} className="w-32" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {documents.filter(d => d.status === 'valid').length}
              </div>
              <div className="text-gray-600">Valid</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {documents.filter(d => d.status === 'expiring').length}
              </div>
              <div className="text-gray-600">Expiring</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {documents.filter(d => d.status === 'expired').length}
              </div>
              <div className="text-gray-600">Expired</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-600">
                {documents.filter(d => d.status === 'missing').length}
              </div>
              <div className="text-gray-600">Missing</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {doc.upload_date || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {doc.expiry_date || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {doc.status === 'missing' ? (
                        <Button
                          size="sm"
                          onClick={() => handleUpload(doc.type)}
                          className="flex items-center gap-1"
                        >
                          <Upload className="h-3 w-3" />
                          Upload
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpload(doc.type)}
                            className="flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            Update
                          </Button>
                        </>
                      )}
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

export default DocumentCompliance;
