
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Save, CheckSquare } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  completed: boolean;
}

const MasterChecklist: React.FC = () => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      title: 'Architectural Drawings',
      description: 'Complete set of architectural drawings uploaded',
      category: 'Drawings',
      required: true,
      completed: true
    },
    {
      id: '2',
      title: 'Structural Drawings',
      description: 'Structural engineering drawings uploaded',
      category: 'Drawings',
      required: true,
      completed: true
    },
    {
      id: '3',
      title: 'Technical Specifications',
      description: 'Detailed technical specifications documentation',
      category: 'Specifications',
      required: true,
      completed: false
    },
    {
      id: '4',
      title: 'Material Specifications',
      description: 'Material standards and specifications',
      category: 'Specifications',
      required: true,
      completed: false
    },
    {
      id: '5',
      title: 'Scope of Works Document',
      description: 'Comprehensive scope of works uploaded',
      category: 'Scope of Works',
      required: true,
      completed: true
    },
    {
      id: '6',
      title: 'Work Method Statements',
      description: 'SWMS for all high-risk activities',
      category: 'Safety',
      required: true,
      completed: false
    }
  ]);

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const categories = [...new Set(checklistItems.map(item => item.category))];
  const completedItems = checklistItems.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedItems / checklistItems.length) * 100);

  const toggleCompleted = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const toggleRequired = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, required: !item.required } : item
      )
    );
  };

  const addItem = () => {
    if (newItemTitle.trim() && newItemCategory.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        title: newItemTitle.trim(),
        description: newItemDescription.trim(),
        category: newItemCategory.trim(),
        required: false,
        completed: false
      };
      setChecklistItems([...checklistItems, newItem]);
      setNewItemTitle('');
      setNewItemDescription('');
      setNewItemCategory('');
    }
  };

  const removeItem = (id: string) => {
    setChecklistItems(items => items.filter(item => item.id !== id));
  };

  const saveChecklist = () => {
    // In real implementation, save to database
    console.log('Saving master checklist:', checklistItems);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Master Project Checklist
          </CardTitle>
          <CardDescription>
            Define the essential documents and requirements for every project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <Progress value={completionPercentage} className="w-32" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{completedItems}</div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {checklistItems.length - completedItems}
              </div>
              <div className="text-gray-600">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {checklistItems.filter(item => item.required && !item.completed).length}
              </div>
              <div className="text-gray-600">Required Missing</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-600">{categories.length}</div>
              <div className="text-gray-600">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map(category => (
            <div key={category} className="space-y-3">
              <div className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                {category}
              </div>
              <div className="space-y-2 ml-4">
                {checklistItems
                  .filter(item => item.category === category)
                  .map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => toggleCompleted(item.id)}
                        />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {item.title}
                            {item.required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{item.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleRequired(item.id)}
                          className="text-xs"
                        >
                          {item.required ? 'Optional' : 'Required'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="border-t pt-4 space-y-3">
            <div className="text-sm font-medium">Add New Checklist Item</div>
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Item title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
              />
              <Input
                placeholder="Category"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
              />
              <Input
                placeholder="Description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
              />
            </div>
            <Button onClick={addItem} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveChecklist} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Master Checklist
        </Button>
      </div>
    </div>
  );
};

export default MasterChecklist;
