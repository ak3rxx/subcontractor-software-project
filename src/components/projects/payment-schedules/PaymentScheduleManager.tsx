
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Calendar,
  DollarSign,
  Building2
} from 'lucide-react';
import { format, differenceInBusinessDays } from 'date-fns';
import { usePaymentClaims } from '@/hooks/usePaymentClaims';
import { usePaymentSchedules } from '@/hooks/usePaymentSchedules';
import PaymentClaimForm from './PaymentClaimForm';
import PaymentScheduleForm from './PaymentScheduleForm';

interface PaymentScheduleManagerProps {
  projectName: string;
  projectId: string;
}

const PaymentScheduleManager: React.FC<PaymentScheduleManagerProps> = ({
  projectName,
  projectId
}) => {
  const { claims, loading: claimsLoading } = usePaymentClaims(projectId);
  const { schedules, loading: schedulesLoading } = usePaymentSchedules(projectId);
  const [activeTab, setActiveTab] = useState('claims');
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const getDeadlineStatus = (claimDate: string) => {
    const deadline = new Date(claimDate);
    deadline.setDate(deadline.getDate() + 14); // Approximate 10 business days
    const daysRemaining = differenceInBusinessDays(deadline, new Date());
    
    if (daysRemaining < 0) return { status: 'overdue', label: 'OVERDUE', color: 'destructive' };
    if (daysRemaining <= 1) return { status: 'urgent', label: '1 DAY LEFT', color: 'destructive' };
    if (daysRemaining <= 3) return { status: 'soon', label: `${daysRemaining} DAYS LEFT`, color: 'default' };
    return { status: 'ok', label: `${daysRemaining} days`, color: 'secondary' };
  };

  const handleCreateSchedule = (claim: any) => {
    setSelectedClaim(claim);
    setShowScheduleForm(true);
  };

  if (showClaimForm) {
    return (
      <PaymentClaimForm
        projectId={projectId}
        onClose={() => setShowClaimForm(false)}
        onSuccess={() => setShowClaimForm(false)}
      />
    );
  }

  if (showScheduleForm && selectedClaim) {
    return (
      <PaymentScheduleForm
        projectId={projectId}
        paymentClaim={selectedClaim}
        onClose={() => {
          setShowScheduleForm(false);
          setSelectedClaim(null);
        }}
        onSuccess={() => {
          setShowScheduleForm(false);
          setSelectedClaim(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                ACT Payment Schedule Management
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {projectName} - Security of Payment Act 2009 Compliance
              </p>
            </div>
            <Button onClick={() => setShowClaimForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Record New Claim
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{claims.length}</div>
            <div className="text-sm text-gray-600">Total Claims</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">{schedules.length}</div>
            <div className="text-sm text-gray-600">Schedules Issued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">
              {claims.filter(c => getDeadlineStatus(c.claim_received_date).status === 'urgent').length}
            </div>
            <div className="text-sm text-gray-600">Urgent Responses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold">
              {claims.filter(c => getDeadlineStatus(c.claim_received_date).status === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="claims" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Payment Claims
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Payment Schedules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-4">
          {claimsLoading ? (
            <div className="text-center py-8">Loading claims...</div>
          ) : claims.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Claims</h3>
                <p className="text-gray-600 mb-4">
                  Record payment claims received to start the legal compliance workflow
                </p>
                <Button onClick={() => setShowClaimForm(true)}>
                  Record First Claim
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => {
                const deadlineStatus = getDeadlineStatus(claim.claim_received_date);
                const hasSchedule = schedules.some(s => s.payment_claim_id === claim.id);
                
                return (
                  <Card key={claim.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{claim.claim_number}</h3>
                          <p className="text-gray-600">{claim.claimant_company_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={deadlineStatus.color as any}>
                            {deadlineStatus.label}
                          </Badge>
                          {hasSchedule && (
                            <Badge variant="outline" className="text-green-600">
                              Schedule Issued
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Claim Amount</Label>
                          <div className="text-lg font-semibold">${claim.claim_amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Received Date</Label>
                          <div>{format(new Date(claim.claim_received_date), 'PPP')}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status</Label>
                          <div className="capitalize">{claim.status}</div>
                        </div>
                      </div>

                      {!hasSchedule && (
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => handleCreateSchedule(claim)}
                            variant={deadlineStatus.status === 'overdue' ? 'destructive' : 'default'}
                          >
                            Create Payment Schedule
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          {schedulesLoading ? (
            <div className="text-center py-8">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Schedules</h3>
                <p className="text-gray-600">
                  Payment schedules will appear here once you respond to claims
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{schedule.schedule_number}</h3>
                        <p className="text-gray-600">{schedule.respondent_company_name}</p>
                      </div>
                      <Badge variant={schedule.status === 'sent' ? 'default' : 'secondary'}>
                        {schedule.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Scheduled Amount</Label>
                        <div className="text-lg font-semibold text-green-600">
                          ${schedule.scheduled_amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Withheld Amount</Label>
                        <div className="text-lg font-semibold text-red-600">
                          ${schedule.withheld_amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Legal Deadline</Label>
                        <div>{format(new Date(schedule.legal_deadline), 'PPP')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentScheduleManager;
