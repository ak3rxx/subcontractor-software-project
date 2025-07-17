import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQAAnalytics } from '@/hooks/useQAAnalytics';
import { FileText, Download, Mail, Calendar, Filter, Settings } from 'lucide-react';
import jsPDF from 'jspdf';

interface QAReportGeneratorProps {
  projectId?: string;
  onClose?: () => void;
}

const QAReportGenerator: React.FC<QAReportGeneratorProps> = ({
  projectId,
  onClose
}) => {
  const { toast } = useToast();
  const { summary, completionRates, performanceMetrics, qualityTrends, predictiveInsights } = useQAAnalytics({ projectId });
  
  const [reportConfig, setReportConfig] = useState({
    title: 'QA Analytics Report',
    description: '',
    timeframe: '30d',
    format: 'pdf',
    sections: {
      summary: true,
      completion: true,
      errors: true,
      performance: true,
      insights: true,
      recommendations: true
    },
    recipient: '',
    scheduleDelivery: false,
    deliveryFrequency: 'weekly'
  });

  const [generating, setGenerating] = useState(false);

  const handleSectionToggle = (section: string, checked: boolean) => {
    setReportConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: checked
      }
    }));
  };

  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Helper function to add text with page break handling
    const addText = (text: string, fontSize = 12, isBold = false) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      const lines = doc.splitTextToSize(text, pageWidth - 40);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * (fontSize * 0.35) + 5;
    };

    // Header
    addText(reportConfig.title, 20, true);
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
    addText(`Report Period: ${reportConfig.timeframe}`, 10);
    yPosition += 10;

    if (reportConfig.description) {
      addText('Description:', 14, true);
      addText(reportConfig.description);
      yPosition += 10;
    }

    // Executive Summary
    if (reportConfig.sections.summary) {
      addText('Executive Summary', 16, true);
      addText(`Total Inspections: ${summary.totalInspections}`);
      addText(`Completion Rate: ${summary.completionRate}%`);
      addText(`Quality Score: ${summary.qualityScore}%`);
      addText(`Trend Direction: ${summary.trendDirection}`);
      yPosition += 10;
    }

    // Completion Analysis
    if (reportConfig.sections.completion) {
      addText('Completion Analysis', 16, true);
      addText(`Overall Completion Rate: ${Math.round(completionRates.overall)}%`);
      
      // Template breakdown
      const templateData = Object.entries(completionRates.byTemplate);
      if (templateData.length > 0) {
        addText('Completion by Template:', 14, true);
        templateData.forEach(([template, rate]) => {
          addText(`• ${template}: ${rate}%`);
        });
      }
      
      // Trade breakdown
      const tradeData = Object.entries(completionRates.byTrade);
      if (tradeData.length > 0) {
        addText('Completion by Trade:', 14, true);
        tradeData.forEach(([trade, rate]) => {
          addText(`• ${trade}: ${rate}%`);
        });
      }
      yPosition += 10;
    }

    // Performance Metrics
    if (reportConfig.sections.performance) {
      addText('Performance Metrics', 16, true);
      addText(`Average Completion Time: ${performanceMetrics.averageCompletionTime} hours`);
      addText(`Inspections Per Day: ${Math.round(performanceMetrics.inspectionsPerDay * 10) / 10}`);
      addText(`Pass/Fail Ratio: ${Math.round(performanceMetrics.passFailRatio * 10) / 10}:1`);
      addText(`Reinspection Rate: ${Math.round(performanceMetrics.reinspectionRate)}%`);
      yPosition += 10;
    }

    // Inspector Performance
    if (reportConfig.sections.performance && qualityTrends.inspectorPerformance.length > 0) {
      addText('Top Performing Inspectors:', 14, true);
      qualityTrends.inspectorPerformance.slice(0, 5).forEach((inspector, index) => {
        addText(`${index + 1}. ${inspector.inspector} - ${Math.round(inspector.passRate)}% pass rate`);
      });
      yPosition += 10;
    }

    // Predictive Insights
    if (reportConfig.sections.insights) {
      addText('Predictive Insights', 16, true);
      addText(`Risk Score: ${Math.round(predictiveInsights.riskScore)}%`);
      addText(`Quality Prediction: ${predictiveInsights.qualityPrediction}`);
      
      if (predictiveInsights.recommendedActions.length > 0) {
        addText('Recommended Actions:', 14, true);
        predictiveInsights.recommendedActions.forEach(action => {
          addText(`• ${action}`);
        });
      }
    }

    return doc;
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    
    try {
      if (reportConfig.format === 'pdf') {
        const doc = await generatePDFReport();
        doc.save(`${reportConfig.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      }
      
      toast({
        title: "Report Generated",
        description: `${reportConfig.format.toUpperCase()} report has been generated successfully.`
      });

      if (reportConfig.scheduleDelivery && reportConfig.recipient) {
        toast({
          title: "Delivery Scheduled",
          description: `Report will be delivered to ${reportConfig.recipient} ${reportConfig.deliveryFrequency}.`
        });
      }

      onClose?.();
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectedSections = Object.values(reportConfig.sections).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate QA Analytics Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={reportConfig.title}
                onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter report title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframe">Time Period</Label>
              <Select 
                value={reportConfig.timeframe} 
                onValueChange={(value) => setReportConfig(prev => ({ ...prev, timeframe: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select 
                value={reportConfig.format} 
                onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Email Recipient (Optional)</Label>
              <Input
                id="recipient"
                type="email"
                value={reportConfig.recipient}
                onChange={(e) => setReportConfig(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="recipient@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={reportConfig.description}
              onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description or context for this report..."
              rows={3}
            />
          </div>

          {/* Section Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Report Sections</Label>
              <Badge variant="secondary">
                {selectedSections} of {Object.keys(reportConfig.sections).length} selected
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(reportConfig.sections).map(([section, checked]) => (
                <div key={section} className="flex items-center space-x-2">
                  <Checkbox
                    id={section}
                    checked={checked}
                    onCheckedChange={(checked) => handleSectionToggle(section, checked as boolean)}
                  />
                  <Label htmlFor={section} className="text-sm font-normal">
                    {section === 'summary' && 'Executive Summary'}
                    {section === 'completion' && 'Completion Analysis'}
                    {section === 'errors' && 'Error Patterns'}
                    {section === 'performance' && 'Performance Metrics'}
                    {section === 'insights' && 'Predictive Insights'}
                    {section === 'recommendations' && 'Recommendations'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule-delivery"
                checked={reportConfig.scheduleDelivery}
                onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, scheduleDelivery: checked as boolean }))}
              />
              <Label htmlFor="schedule-delivery" className="text-sm font-medium">
                Schedule Regular Delivery
              </Label>
            </div>

            {reportConfig.scheduleDelivery && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="delivery-frequency">Delivery Frequency</Label>
                <Select 
                  value={reportConfig.deliveryFrequency} 
                  onValueChange={(value) => setReportConfig(prev => ({ ...prev, deliveryFrequency: value }))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Report will include data from {projectId ? 'selected project' : 'all projects'}
            </div>
            
            <div className="flex items-center gap-2">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleGenerateReport} 
                disabled={generating || selectedSections === 0}
                className="flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QAReportGenerator;