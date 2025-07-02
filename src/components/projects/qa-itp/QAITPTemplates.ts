
import { UploadedFile } from '@/hooks/useFileUpload';

export interface ChecklistItem {
  id: string;
  description: string;
  requirements: string;
  status?: 'pass' | 'fail' | 'na';
  comments?: string;
  evidenceFiles?: UploadedFile[];
  isFireDoorOnly?: boolean;
}

interface Template {
  name: string;
  items: ChecklistItem[];
}

export const templates: Record<string, Template> = {
  'doors-jambs-hardware': {
    name: 'Doors, Door jambs & Door hardware',
    items: [
      {
        id: '1',
        description: 'Door jamb ordered as per Door scheduled',
        requirements: '1.4 Gauge for standard jambs, 1.5 Gauge for SEC/Fire rated jambs',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '2',
        description: 'Door jambs Back Filling',
        requirements: 'Install door jamb with Back fillings as per AS1905.1-2015',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '3',
        description: 'All door jambs delivered to partitions & signed off',
        requirements: 'Doors to be taken to the floors required and handed over to other trades for sign off',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '4',
        description: 'Door jamb installed as per BCA Including plumb/Level/Enwind/Parallel Including back filling (AS1530.4)',
        requirements: 'Including plumb/Level/Enwind/Parallel Including back filling (AS1530.4) Any gap to structural opening less then 15mm Allowance for mastic or grout fill. AS1530.4 As per door schedule & BCA Fire rated door jambs to structural openings Bogged and filled and sanded down',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '5',
        description: 'Doors are painted Top & Bottom before installation',
        requirements: 'Doors are painted on the top and bottom, fully sealed. Photos taken for evidence.',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '6',
        description: 'Doors margins are 3mm and no more then 5mm',
        requirements: 'Gaps & Margins are within BCA/Compliance standards of 3mm and no more then 5mm. Photo taken for evidence.',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '7',
        description: 'Fire door clearance to floor/threshold is between 3mm and no more then 10mm Surface is flat and level (by others) including swing zone',
        requirements: 'Meets AS1905.5-2015 And AS1530.4-2014 and BCA Requirements',
        status: undefined,
        comments: '',
        evidenceFiles: [],
        isFireDoorOnly: true
      },
      {
        id: '8',
        description: 'Hardware is correct and install as per manufacturers specification and door schedule/Door hardware schedule',
        requirements: 'Installed as Manufacturer\'s specification, Installed as per door hardware/Door schedule.',
        status: undefined,
        comments: '',
        evidenceFiles: []
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
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '2',
        description: 'Installation inspection - Correct specification and floor levels',
        requirements: 'Verifying that the skirting boards/Wall moulding are installed correctly, according to specifications. Floor levels are considered and height is correct',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '3',
        description: 'Level, plumb and square check',
        requirements: 'That they are level, plumb and square and the set out of skirting & wall moulding is correct',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '4',
        description: 'Joints and scribing',
        requirements: 'Joints are mitred and where required scribed to suit',
        status: undefined,
        comments: '',
        evidenceFiles: []
      },
      {
        id: '5',
        description: 'Final inspection',
        requirements: 'Timber trims are free of gaps and nailed off securely',
        status: undefined,
        comments: '',
        evidenceFiles: []
      }
    ]
  }
};

// Export for backward compatibility
export const TEMPLATE_CHECKLISTS = templates;

export type { Template };
