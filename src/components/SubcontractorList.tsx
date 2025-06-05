
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Phone, Mail, MapPin } from 'lucide-react';

const SubcontractorList = () => {
  const subcontractors = [
    {
      id: 1,
      companyName: "Elite Electrical Services",
      contactPerson: "John Smith",
      email: "john@eliteelectrical.com",
      phone: "(555) 123-4567",
      tradeType: "Electrical",
      status: "Active",
      location: "Downtown District"
    },
    {
      id: 2,
      companyName: "ProPlumb Solutions",
      contactPerson: "Sarah Johnson",
      email: "sarah@proplumb.com",
      phone: "(555) 987-6543",
      tradeType: "Plumbing",
      status: "Active",
      location: "North Side"
    },
    {
      id: 3,
      companyName: "HVAC Masters",
      contactPerson: "Mike Wilson",
      email: "mike@hvacmasters.com",
      phone: "(555) 456-7890",
      tradeType: "HVAC",
      status: "Pending",
      location: "Industrial Zone"
    },
    {
      id: 4,
      companyName: "Drywall Experts",
      contactPerson: "Lisa Brown",
      email: "lisa@drywallexperts.com",
      phone: "(555) 321-0987",
      tradeType: "Drywall",
      status: "Under Review",
      location: "South District"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Under Review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subcontractor Directory</CardTitle>
        <CardDescription>Manage your registered subcontractors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subcontractors.map((subcontractor) => (
            <div key={subcontractor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{subcontractor.companyName}</h3>
                    <Badge className={getStatusColor(subcontractor.status)}>
                      {subcontractor.status}
                    </Badge>
                    <Badge variant="outline">{subcontractor.tradeType}</Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="font-medium">Contact: {subcontractor.contactPerson}</p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{subcontractor.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{subcontractor.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{subcontractor.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-6">
          <Button variant="outline">Load More Subcontractors</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubcontractorList;
