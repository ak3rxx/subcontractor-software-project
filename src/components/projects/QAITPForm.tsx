
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, FileText } from 'lucide-react';

interface QAITPFormProps {
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  description: string;
  requirements: string;
  status: 'pass' | 'fail' | 'na' | '';
  comments: string;
  evidence?: File[];
  isFireDoorOnly?: boolean;
}

const QAITPForm: React.FC<QAITPFormProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    projectName: '',
    taskArea: '',
    locationReference: '',
    inspectionType: '',
    template: '',
    inspectorName: '',
    inspectionDate: '',
    digitalSignature: '',
    overallStatus: ''
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isFireDoor, setIsFireDoor] = useState(false);

  const templates = {
    'doors-jambs-hardware': {
      name: 'Doors, Door jambs & Door hardware',
      items: [
        {
          id: '1',
          description: 'Door jamb ordered as per Door scheduled',
          requirements: '1.4 Gauge for standard jambs, 1.5 Gauge for SEC/Fire rated jambs',
          status: '' as const,
          comments: ''
        },
        {
          id: '2',
          description: 'Door jambs Back Filling',
          requirements: 'Install door jamb with Back fillings as per AS1905.1-2015',
          status: '' as const,
          comments: ''
        },
        {
          id: '3',
          description: 'All door jambs delivered to partitions & signed off',
          requirements: 'Doors to be taken to the floors required and handed over to other trades for sign off',
          status: '' as const,
          comments: ''
        },
        {
          id: '4',
          description: 'Door jamb installed as per BCA Including plumb/Level/Enwind/Parallel Including back filling (AS1530.4)',
          requirements: 'Including plumb/Level/Enwind/Parallel Including back filling (AS1530.4) Any gap to structural opening less then 15mm Allowance for mastic or grout fill. AS1530.4 As per door schedule & BCA Fire rated door jambs to structural openings Bogged and filled and sanded down',
          status: '' as const,
          comments: ''
        },
        {
          id: '5',
          description: 'Doors are painted Top & Bottom before installation',
          requirements: 'Doors are painted on the top and bottom, fully sealed. Photos taken for evidence.',
          status: '' as const,
          comments: ''
        },
        {
          id: '6',
          description: 'Doors margins are 3mm and no more then 5mm',
          requirements: 'Gaps & Margins are within BCA/Compliance standards of 3mm and no more then 5mm. Photo taken for evidence.',
          status: '' as const,
          comments: ''
        },
        {
          id: '7',
          description: 'Fire door clearance to floor/threshold is between 3mm and no more then 10mm Surface is flat and level (by others) including swing zone',
          requirements: 'Meets AS1905.5-2015 And AS1530.4-2014 and BCA Requirements',
          status: '' as const,
          comments: '',
          isFireDoorOnly: true
        },
        {
          id: '8',
          description: 'Hardware is correct and install as per manufacturers specification and door schedule/Door hardware schedule',
          requirements: 'Installed as Manufacturer\'s specification, Installed as per door hardware/Door schedule.',
          status: '' as const,
          comments: ''
        }
      ]
    },
    'skirting': {
      name: 'Skirting',
      items: [
        {
          id: '1',
          description: 'Material inspection',
          requirements: 'Ensuring that the timber skirting/Wall moulding is of the correct type, size, and quality',
          status: '' as const,
          comments: ''
        },
        {
          id: '2',
          description: 'Installation inspection - Correct specification and floor levels',
          requirements: 'Verifying that the skirting boards/Wall moulding are installed correctly, according to specifications. Floor levels are considered and height is correct',
          status: '' as const,
          comments: ''
        },
        {
          id: '3',
          description: 'Level, plumb and square check',
          requirements: 'That they are level, plumb and square and the set out of skirting & wall moulding is correct',
          status: '' as const,
          comments: ''
        },
        {
          id: '4',
          description: 'Joints and scribing',
          requirements: 'Joints are mitred and where required scribed to suit',
          status: '' as const,
          comments: ''
        },
        {
          id: '5',
          description: 'Final inspection',
          requirements: 'Timber trims are free of gaps and nailed off securely',
          status: '' as const,
          comments: ''
        }
      ]
    }
  };

  const handleTemplateChange = (templateKey: string) => {
    setFormData(prev => ({ ...prev, template: templateKey }));
    if (templateKey && templates[templateKey as keyof typeof templates]) {
      setChecklist(templates[templateKey as keyof typeof templates].items);
    } else {
      setChecklist([]);
    }
  };

  const handleChecklistChange = (id: string, field: string, value: any) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.digitalSignature.trim()) {
      toast({
        title: "Digital Signature Required",
        description: "Please provide your digital signature before submitting.",
        variant: "destructive"
      });
      return;
    }

    console.log('QA/ITP Submission:', { formData, checklist });
    
    toast({
      title: "QA Inspection Submitted",
      description: "Inspection has been recorded and notifications sent to relevant team members.",
    });

    onClose();
  };

  const filteredChecklist = checklist.filter(item => 
    !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">New QA/ITP Inspection</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project & Task Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project & Task Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskArea">Task/Area being inspected</Label>
                <Input
                  id="taskArea"
                  placeholder="e.g. Framing, Waterproofing"
                  value={formData.taskArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskArea: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationReference">Location/Grid Reference</Label>
                <Input
                  id="locationReference"
                  value={formData.locationReference}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationReference: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspectionType">Inspection Type</Label>
                <Select value={formData.inspectionType} onValueChange={(value) => setFormData(prev => ({ ...prev, inspectionType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select inspection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post-installation">Post-installation</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">ITP Template</Label>
              <Select value={formData.template} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inspection template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doors-jambs-hardware">Doors, Door jambs & Door hardware</SelectItem>
                  <SelectItem value="skirting">Skirting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fire Door Checkbox - only show for doors template */}
            {formData.template === 'doors-jambs-hardware' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFireDoor"
                  checked={isFireDoor}
                  onCheckedChange={(checked) => setIsFireDoor(checked as boolean)}
                />
                <Label htmlFor="isFireDoor">This is a Fire Door installation</Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspection Checklist */}
        {filteredChecklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspection Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredChecklist.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-medium">{item.description}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.requirements}</p>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.id}-pass`}
                        checked={item.status === 'pass'}
                        onCheckedChange={(checked) => 
                          handleChecklistChange(item.id, 'status', checked ? 'pass' : '')
                        }
                      />
                      <Label htmlFor={`${item.id}-pass`} className="text-green-600">Pass</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.id}-fail`}
                        checked={item.status === 'fail'}
                        onCheckedChange={(checked) => 
                          handleChecklistChange(item.id, 'status', checked ? 'fail' : '')
                        }
                      />
                      <Label htmlFor={`${item.id}-fail`} className="text-red-600">Fail</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.id}-na`}
                        checked={item.status === 'na'}
                        onCheckedChange={(checked) => 
                          handleChecklistChange(item.id, 'status', checked ? 'na' : '')
                        }
                      />
                      <Label htmlFor={`${item.id}-na`} className="text-gray-600">N/A</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${item.id}-comments`}>Comments (Optional)</Label>
                    <Textarea
                      id={`${item.id}-comments`}
                      value={item.comments}
                      onChange={(e) => handleChecklistChange(item.id, 'comments', e.target.value)}
                      placeholder="Add any additional comments..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Evidence Photos</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Attach clear, timestamped photos for inspection evidence
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click to browse or drag files here
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sign-Off Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign-Off Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspectorName">Inspector Name</Label>
                <Input
                  id="inspectorName"
                  value={formData.inspectorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspectorName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspectionDate">Inspection Date</Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspectionDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="digitalSignature">Digital Signature *</Label>
              <Textarea
                id="digitalSignature"
                placeholder="Type your full legal name here as your digital signature"
                value={formData.digitalSignature}
                onChange={(e) => setFormData(prev => ({ ...prev, digitalSignature: e.target.value }))}
                className="min-h-[80px] font-cursive italic border-2 border-blue-200 bg-blue-50"
                required
              />
              <p className="text-xs text-gray-600">
                By typing your name above, you are providing a legally binding digital signature
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overallStatus">Overall Status</Label>
              <Select value={formData.overallStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, overallStatus: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select overall status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="pending-reinspection">Pending Reinspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Submit QA Inspection
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QAITPForm;
