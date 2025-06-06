
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import QAITPProjectInfo from './qa-itp/QAITPProjectInfo';
import QAITPChecklistItem from './qa-itp/QAITPChecklistItem';
import QAITPSignOff from './qa-itp/QAITPSignOff';
import { templates, type ChecklistItem } from './qa-itp/QAITPTemplates';

interface QAITPFormProps {
  onClose: () => void;
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

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        <QAITPProjectInfo
          formData={formData}
          isFireDoor={isFireDoor}
          onFormDataChange={handleFormDataChange}
          onFireDoorChange={setIsFireDoor}
          onTemplateChange={handleTemplateChange}
        />

        {/* Inspection Checklist */}
        {filteredChecklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspection Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredChecklist.map((item) => (
                <QAITPChecklistItem
                  key={item.id}
                  item={item}
                  onChecklistChange={handleChecklistChange}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <QAITPSignOff
          formData={formData}
          onFormDataChange={handleFormDataChange}
        />

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
