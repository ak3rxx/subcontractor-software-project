import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';

interface QATrackerFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  inspectionTypeFilter: string;
  setInspectionTypeFilter: (value: string) => void;
  templateTypeFilter: string;
  setTemplateTypeFilter: (value: string) => void;
  inspectorFilter: string;
  setInspectorFilter: (value: string) => void;
  dateRangeFilter: string;
  setDateRangeFilter: (value: string) => void;
  buildingFilter: string;
  setBuildingFilter: (value: string) => void;
  levelFilter: string;
  setLevelFilter: (value: string) => void;
  taskFilter: string;
  setTaskFilter: (value: string) => void;
  tradeFilter: string;
  setTradeFilter: (value: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (value: boolean) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  statusCounts: Record<string, number>;
  uniqueInspectors: string[];
  uniqueBuildings: string[];
  uniqueLevels: string[];
  uniqueTasks: string[];
  uniqueTrades: string[];
}

const QATrackerFilters: React.FC<QATrackerFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  inspectionTypeFilter,
  setInspectionTypeFilter,
  templateTypeFilter,
  setTemplateTypeFilter,
  inspectorFilter,
  setInspectorFilter,
  dateRangeFilter,
  setDateRangeFilter,
  buildingFilter,
  setBuildingFilter,
  levelFilter,
  setLevelFilter,
  taskFilter,
  setTaskFilter,
  tradeFilter,
  setTradeFilter,
  showAdvancedFilters,
  setShowAdvancedFilters,
  hasActiveFilters,
  clearFilters,
  statusCounts,
  uniqueInspectors,
  uniqueBuildings,
  uniqueLevels,
  uniqueTasks,
  uniqueTrades
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inspections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && <Badge variant="secondary" className="ml-1">Active</Badge>}
            </Button>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Quick Status Filters */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={statusFilter === 'pass' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter(statusFilter === 'pass' ? 'all' : 'pass')}
              className={statusFilter === 'pass' ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-200 text-green-700 hover:bg-green-50'}
            >
              ✅ Passed ({statusCounts.pass || 0})
            </Button>
            <Button 
              variant={statusFilter === 'incomplete-in-progress' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter(statusFilter === 'incomplete-in-progress' ? 'all' : 'incomplete-in-progress')}
              className={statusFilter === 'incomplete-in-progress' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'}
            >
              ⏳ In Progress ({statusCounts['incomplete-in-progress'] || 0})
            </Button>
            <Button 
              variant={statusFilter === 'pending-reinspection' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter(statusFilter === 'pending-reinspection' ? 'all' : 'pending-reinspection')}
              className={statusFilter === 'pending-reinspection' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-200 text-orange-700 hover:bg-orange-50'}
            >
              🔄 Pending ({statusCounts['pending-reinspection'] || 0})
            </Button>
            <Button 
              variant={statusFilter === 'fail' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter(statusFilter === 'fail' ? 'all' : 'fail')}
              className={statusFilter === 'fail' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-200 text-red-700 hover:bg-red-50'}
            >
              ❌ Failed ({statusCounts.fail || 0})
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Advanced Filters</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Building</label>
                  <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Buildings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Buildings</SelectItem>
                      {uniqueBuildings.map((building) => (
                        <SelectItem key={building} value={building}>
                          {building}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Level</label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {uniqueLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Task</label>
                  <Select value={taskFilter} onValueChange={setTaskFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Tasks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      {uniqueTasks.map((task) => (
                        <SelectItem key={task} value={task}>
                          {task}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Trade</label>
                  <Select value={tradeFilter} onValueChange={setTradeFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Trades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trades</SelectItem>
                      {uniqueTrades.map((trade) => (
                        <SelectItem key={trade} value={trade}>
                          {trade?.replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Inspector</label>
                  <Select value={inspectorFilter} onValueChange={setInspectorFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Inspectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Inspectors</SelectItem>
                      {uniqueInspectors.map((inspector) => (
                        <SelectItem key={inspector} value={inspector}>
                          {inspector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QATrackerFilters;