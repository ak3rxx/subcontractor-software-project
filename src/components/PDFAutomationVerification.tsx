
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Download, Scan } from 'lucide-react';

const PDFAutomationVerification = () => {
  const { toast } = useToast();
  const [processingDoc, setProcessingDoc] = useState<string | null>(null);

  const documents = [
    {
      id: 1,
      subcontractor: "Elite Electrical Services",
      docType: "Business License",
      fileName: "business_license_elite.pdf",
      uploadDate: "2024-06-05",
      verificationStatus: "verified",
      automationScore: 98,
      issues: [],
      extractedData: {
        licenseNumber: "EL-2024-001",
        expiryDate: "2025-12-31",
        businessName: "Elite Electrical Services LLC"
      }
    },
    {
      id: 2,
      subcontractor: "ProPlumb Solutions",
      docType: "Insurance Certificate",
      fileName: "insurance_proplumb.pdf",
      uploadDate: "2024-06-04",
      verificationStatus: "processing",
      automationScore: 85,
      issues: ["Date format unclear"],
      extractedData: null
    },
    {
      id: 3,
      subcontractor: "HVAC Masters",
      docType: "Safety Certification",
      fileName: "safety_cert_hvac.pdf",
      uploadDate: "2024-06-03",
      verificationStatus: "failed",
      automationScore: 45,
      issues: ["Poor image quality", "Missing signature", "Incomplete data"],
      extractedData: null
    },
    {
      id: 4,
      subcontractor: "Drywall Experts",
      docType: "W-9 Form",
      fileName: "w9_drywall_experts.pdf",
      uploadDate: "2024-06-02",
      verificationStatus: "manual_review",
      automationScore: 72,
      issues: ["Handwritten sections need review"],
      extractedData: {
        tin: "XX-XXX1234",
        businessName: "Drywall Experts Inc"
      }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'manual_review': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'manual_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleReprocess = (docId: number, fileName: string) => {
    setProcessingDoc(fileName);
    
    setTimeout(() => {
      setProcessingDoc(null);
      toast({
        title: "Document Reprocessed",
        description: `${fileName} has been reprocessed successfully.`,
      });
    }, 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Automation & Verification</CardTitle>
        <CardDescription>Automated document processing and verification results</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-green-600">Verified</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-blue-600">Processing</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">5</div>
              <div className="text-sm text-yellow-600">Manual Review</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">2</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold">{doc.fileName}</h3>
                      <Badge className={getStatusColor(doc.verificationStatus)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(doc.verificationStatus)}
                          {doc.verificationStatus.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Subcontractor</p>
                        <p className="text-gray-600">{doc.subcontractor}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Document Type</p>
                        <p className="text-gray-600">{doc.docType}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Upload Date</p>
                        <p className="text-gray-600">{doc.uploadDate}</p>
                      </div>
                    </div>

                    {/* Automation Score */}
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">Automation Score:</span>
                        <span className={`text-sm font-bold ${getScoreColor(doc.automationScore)}`}>
                          {doc.automationScore}%
                        </span>
                      </div>
                      <Progress value={doc.automationScore} className="h-2" />
                    </div>

                    {/* Issues */}
                    {doc.issues.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-600 mb-1">Issues Found:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {doc.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extracted Data */}
                    {doc.extractedData && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Extracted Data:</p>
                        <div className="text-sm space-y-1">
                          {Object.entries(doc.extractedData).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    {doc.verificationStatus === 'failed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReprocess(doc.id, doc.fileName)}
                        disabled={processingDoc === doc.fileName}
                      >
                        <Scan className="w-4 h-4 mr-1" />
                        {processingDoc === doc.fileName ? 'Processing...' : 'Reprocess'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFAutomationVerification;
