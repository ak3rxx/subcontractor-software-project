
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, MessageSquare, User, Calendar, Clock } from 'lucide-react';

interface TeamNotesProps {
  projectName: string;
}

const TeamNotes: React.FC<TeamNotesProps> = ({ projectName }) => {
  const { toast } = useToast();
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNote, setNewNote] = useState({
    message: '',
    author: '',
    category: 'general',
    linkedTask: '',
    priority: 'normal'
  });

  // Sample team notes/messages
  const teamNotes = [
    {
      id: 1,
      message: 'Concrete pour for Level 3 completed successfully. No issues reported. Final inspection scheduled for tomorrow.',
      author: 'Sarah Johnson',
      date: '2024-01-15',
      time: '14:30',
      category: 'site-update',
      linkedTask: 'Concrete pour Level 3',
      priority: 'normal'
    },
    {
      id: 2,
      message: 'Weather delay expected tomorrow due to heavy rain forecast. Rescheduling external work to Thursday.',
      author: 'Mike Davis',
      date: '2024-01-15',
      time: '09:15',
      category: 'alert',
      linkedTask: '',
      priority: 'high'
    },
    {
      id: 3,
      message: 'Client confirmed additional electrical points variation. Can proceed with implementation next week.',
      author: 'John Smith',
      date: '2024-01-14',
      time: '16:45',
      category: 'client-update',
      linkedTask: 'VAR-001',
      priority: 'normal'
    },
    {
      id: 4,
      message: 'New safety officer starting Monday. Please ensure all team members attend the briefing at 8:00 AM.',
      author: 'Lisa Wang',
      date: '2024-01-14',
      time: '11:20',
      category: 'team-update',
      linkedTask: '',
      priority: 'high'
    },
    {
      id: 5,
      message: 'Timber delivery for framing arrived early. Quality check completed - all materials in good condition.',
      author: 'Tom Wilson',
      date: '2024-01-13',
      time: '13:10',
      category: 'delivery',
      linkedTask: 'DEL-20240113-TIM1',
      priority: 'normal'
    }
  ];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'site-update':
        return <Badge className="bg-blue-100 text-blue-800">🏗️ Site Update</Badge>;
      case 'alert':
        return <Badge className="bg-red-100 text-red-800">⚠️ Alert</Badge>;
      case 'client-update':
        return <Badge className="bg-green-100 text-green-800">👤 Client Update</Badge>;
      case 'team-update':
        return <Badge className="bg-purple-100 text-purple-800">👥 Team Update</Badge>;
      case 'delivery':
        return <Badge className="bg-yellow-100 text-yellow-800">📦 Delivery</Badge>;
      case 'safety':
        return <Badge className="bg-orange-100 text-orange-800">🦺 Safety</Badge>;
      case 'general':
        return <Badge className="bg-gray-100 text-gray-800">💬 General</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    if (priority === 'high') {
      return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
    }
    return null;
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New Team Note:', newNote);
    
    toast({
      title: "Note Added",
      description: "Your message has been added to the project team notes.",
    });

    setNewNote({
      message: '',
      author: '',
      category: 'general',
      linkedTask: '',
      priority: 'normal'
    });
    setShowNewNote(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Team Communication</h3>
          <p className="text-gray-600">Internal project notes and team messages</p>
        </div>
        <Button onClick={() => setShowNewNote(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{teamNotes.length}</div>
            <div className="text-sm text-gray-600">Total Messages</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              {teamNotes.filter(n => n.date === '2024-01-15').length}
            </div>
            <div className="text-sm text-gray-600">Today</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">
              {new Set(teamNotes.map(n => n.author)).size}
            </div>
            <div className="text-sm text-gray-600">Team Members</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">
              {teamNotes.filter(n => n.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardContent>
        </Card>
      </div>

      {/* New Note Form */}
      {showNewNote && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={newNote.message}
                  onChange={(e) => setNewNote(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Share updates, alerts, or information with the team..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={newNote.author}
                    onChange={(e) => setNewNote(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newNote.category} onValueChange={(value) => setNewNote(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">💬 General</SelectItem>
                      <SelectItem value="site-update">🏗️ Site Update</SelectItem>
                      <SelectItem value="alert">⚠️ Alert</SelectItem>
                      <SelectItem value="client-update">👤 Client Update</SelectItem>
                      <SelectItem value="team-update">👥 Team Update</SelectItem>
                      <SelectItem value="delivery">📦 Delivery</SelectItem>
                      <SelectItem value="safety">🦺 Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newNote.priority} onValueChange={(value) => setNewNote(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedTask">Linked Task/Reference (Optional)</Label>
                <Input
                  id="linkedTask"
                  value={newNote.linkedTask}
                  onChange={(e) => setNewNote(prev => ({ ...prev, linkedTask: e.target.value }))}
                  placeholder="e.g. TASK-001, VAR-002, DEL-123"
                />
              </div>
              
              <div className="flex gap-4">
                <Button type="submit">Add Note</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewNote(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Team Notes Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Project Team Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamNotes.map((note) => (
            <div key={note.id} className="border-l-4 border-blue-200 pl-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityIndicator(note.priority)}
                    {getCategoryBadge(note.category)}
                    {note.linkedTask && (
                      <Badge variant="outline" className="text-xs">
                        Ref: {note.linkedTask}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-900 mb-2">{note.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {note.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {note.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {note.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Best Practices:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Use clear, concise messages</li>
                <li>• Tag relevant task/reference IDs</li>
                <li>• Mark priority messages appropriately</li>
                <li>• Include timestamps for urgent updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Categories:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Alert:</strong> Urgent issues requiring immediate attention</li>
                <li>• <strong>Site Update:</strong> Daily progress and status updates</li>
                <li>• <strong>Client Update:</strong> Client communications and decisions</li>
                <li>• <strong>Safety:</strong> Safety incidents and procedures</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamNotes;
