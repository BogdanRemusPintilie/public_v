import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Settings, Plus, Minus, BarChart3, Shield, AlertTriangle, Banknote, TrendingUp } from 'lucide-react';

interface StructureComponent {
  id: string;
  name: string;
  type: string;
  size: number;
  riskWeight: number;
  costBps: number;
  rating: string;
  maturity: number;
  creditEnhancement: number;
  liquidity: string;
  isActive: boolean;
}

interface StructureModificationProps {
  onStructureChange?: (components: StructureComponent[]) => void;
}

export function StructureModificationComponent({ onStructureChange }: StructureModificationProps) {
  const [components, setComponents] = useState<StructureComponent[]>([
    {
      id: '1',
      name: 'Senior Tranche A',
      type: 'senior',
      size: 70,
      riskWeight: 20,
      costBps: 125,
      rating: 'AAA',
      maturity: 5,
      creditEnhancement: 30,
      liquidity: 'high',
      isActive: true,
    },
    {
      id: '2',
      name: 'Mezzanine Tranche B',
      type: 'mezzanine',
      size: 20,
      riskWeight: 50,
      costBps: 275,
      rating: 'BBB',
      maturity: 7,
      creditEnhancement: 10,
      liquidity: 'medium',
      isActive: true,
    },
    {
      id: '3',
      name: 'Subordinate Equity',
      type: 'equity',
      size: 10,
      riskWeight: 100,
      costBps: 650,
      rating: 'Unrated',
      maturity: 10,
      creditEnhancement: 0,
      liquidity: 'low',
      isActive: true,
    },
  ]);

  const [selectedComponent, setSelectedComponent] = useState<StructureComponent | null>(null);

  const addComponent = () => {
    const newComponent: StructureComponent = {
      id: Date.now().toString(),
      name: `New Component ${components.length + 1}`,
      type: 'senior',
      size: 0,
      riskWeight: 20,
      costBps: 100,
      rating: 'A',
      maturity: 5,
      creditEnhancement: 0,
      liquidity: 'medium',
      isActive: true,
    };
    const updatedComponents = [...components, newComponent];
    setComponents(updatedComponents);
    onStructureChange?.(updatedComponents);
  };

  const removeComponent = (id: string) => {
    const updatedComponents = components.filter(c => c.id !== id);
    setComponents(updatedComponents);
    onStructureChange?.(updatedComponents);
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  };

  const updateComponent = (id: string, updates: Partial<StructureComponent>) => {
    const updatedComponents = components.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    setComponents(updatedComponents);
    onStructureChange?.(updatedComponents);
    
    if (selectedComponent?.id === id) {
      setSelectedComponent({ ...selectedComponent, ...updates });
    }
  };

  const getTrancheColor = (type: string) => {
    switch (type) {
      case 'senior': return 'bg-emerald-500';
      case 'mezzanine': return 'bg-amber-500';
      case 'equity': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getRatingColor = (rating: string) => {
    if (rating.startsWith('AAA') || rating.startsWith('AA')) return 'bg-emerald-100 text-emerald-800';
    if (rating.startsWith('A')) return 'bg-blue-100 text-blue-800';
    if (rating.startsWith('BBB') || rating.startsWith('BB')) return 'bg-amber-100 text-amber-800';
    if (rating.startsWith('B') || rating.startsWith('CCC')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const totalSize = components.reduce((sum, c) => sum + c.size, 0);
  const weightedAvgCost = components.reduce((sum, c) => sum + (c.costBps * c.size), 0) / totalSize || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Structure Visualisation
        </CardTitle>
        <CardDescription>
          Customize and configure the various components of your securitization structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Structure Visualization */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Structure Visualization
              </h4>
              <div className="relative bg-muted/50 rounded-lg overflow-hidden h-48">
                {components.map((component, index) => {
                  const height = (component.size / 100) * 100;
                  const startPosition = components
                    .slice(0, index)
                    .reduce((sum, c) => sum + c.size, 0);
                  const bottom = (startPosition / 100) * 100;

                  return (
                    <div
                      key={component.id}
                      className={`absolute w-full ${getTrancheColor(component.type)} flex items-center justify-center text-white font-medium text-xs cursor-pointer hover:opacity-80 transition-opacity`}
                      style={{
                        height: `${height}%`,
                        bottom: `${bottom}%`,
                      }}
                      onClick={() => setSelectedComponent(component)}
                    >
                      <div className="text-center">
                        <div className="font-semibold">{component.name}</div>
                        <div>{component.size}% | {component.costBps} bps</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-primary">{components.length}</div>
                <div className="text-xs text-muted-foreground">Components</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-primary">{totalSize}%</div>
                <div className="text-xs text-muted-foreground">Total Size</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-primary">{weightedAvgCost.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Avg Cost (bps)</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-primary">
                  {components.filter(c => c.isActive).length}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button onClick={addComponent} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Component
              </Button>
              <Button 
                onClick={() => {
                  // Auto-balance sizes to 100%
                  const activeComponents = components.filter(c => c.isActive);
                  const equalSize = 100 / activeComponents.length;
                  const balanced = components.map(c => 
                    c.isActive ? { ...c, size: Math.round(equalSize * 100) / 100 } : c
                  );
                  setComponents(balanced);
                  onStructureChange?.(balanced);
                }}
                size="sm" 
                variant="outline"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Auto-Balance
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Component List</h4>
              <Button onClick={addComponent} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Component
              </Button>
            </div>

            <div className="space-y-2">
              {components.map((component, index) => (
                <div
                  key={component.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedComponent?.id === component.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedComponent(component)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded ${getTrancheColor(component.type)}`}></div>
                      <div>
                        <div className="font-medium">{component.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {component.type} • {component.size}% • {component.costBps} bps
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRatingColor(component.rating)} variant="secondary">
                        {component.rating}
                      </Badge>
                      <Switch
                        checked={component.isActive}
                        onCheckedChange={(checked) => 
                          updateComponent(component.id, { isActive: checked })
                        }
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeComponent(component.id);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {selectedComponent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">Editing: {selectedComponent.name}</h4>
                  <div className={`w-3 h-3 rounded ${getTrancheColor(selectedComponent.type)}`}></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Component Name</Label>
                    <Input
                      value={selectedComponent.name}
                      onChange={(e) => updateComponent(selectedComponent.id, { name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={selectedComponent.type}
                      onValueChange={(value) => updateComponent(selectedComponent.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="mezzanine">Mezzanine</SelectItem>
                        <SelectItem value="equity">Equity/Subordinate</SelectItem>
                        <SelectItem value="overcollateralization">Over-collateralization</SelectItem>
                        <SelectItem value="reserve">Reserve Fund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Size (%)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[selectedComponent.size]}
                        onValueChange={([value]) => updateComponent(selectedComponent.id, { size: value })}
                        max={100}
                        step={0.1}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        value={selectedComponent.size}
                        onChange={(e) => updateComponent(selectedComponent.id, { size: parseFloat(e.target.value) || 0 })}
                        step="0.1"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cost (bps)</Label>
                    <Input
                      type="number"
                      value={selectedComponent.costBps}
                      onChange={(e) => updateComponent(selectedComponent.id, { costBps: parseFloat(e.target.value) || 0 })}
                      step="1"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Credit Rating</Label>
                    <Select
                      value={selectedComponent.rating}
                      onValueChange={(value) => updateComponent(selectedComponent.id, { rating: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AAA">AAA</SelectItem>
                        <SelectItem value="AA+">AA+</SelectItem>
                        <SelectItem value="AA">AA</SelectItem>
                        <SelectItem value="AA-">AA-</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="BBB+">BBB+</SelectItem>
                        <SelectItem value="BBB">BBB</SelectItem>
                        <SelectItem value="BBB-">BBB-</SelectItem>
                        <SelectItem value="BB+">BB+</SelectItem>
                        <SelectItem value="BB">BB</SelectItem>
                        <SelectItem value="BB-">BB-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="CCC+">CCC+</SelectItem>
                        <SelectItem value="CCC">CCC</SelectItem>
                        <SelectItem value="CCC-">CCC-</SelectItem>
                        <SelectItem value="Unrated">Unrated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Risk Weight (%)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[selectedComponent.riskWeight]}
                        onValueChange={([value]) => updateComponent(selectedComponent.id, { riskWeight: value })}
                        max={200}
                        step={5}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        value={selectedComponent.riskWeight}
                        onChange={(e) => updateComponent(selectedComponent.id, { riskWeight: parseFloat(e.target.value) || 0 })}
                        step="5"
                        min="0"
                        max="200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Maturity (years)</Label>
                    <Input
                      type="number"
                      value={selectedComponent.maturity}
                      onChange={(e) => updateComponent(selectedComponent.id, { maturity: parseFloat(e.target.value) || 0 })}
                      step="0.5"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Credit Enhancement (%)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[selectedComponent.creditEnhancement]}
                        onValueChange={([value]) => updateComponent(selectedComponent.id, { creditEnhancement: value })}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        value={selectedComponent.creditEnhancement}
                        onChange={(e) => updateComponent(selectedComponent.id, { creditEnhancement: parseFloat(e.target.value) || 0 })}
                        step="1"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Liquidity</Label>
                    <Select
                      value={selectedComponent.liquidity}
                      onValueChange={(value) => updateComponent(selectedComponent.id, { liquidity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="illiquid">Illiquid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span>Protection: {selectedComponent.creditEnhancement}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Risk Weight: {selectedComponent.riskWeight}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-blue-500" />
                    <span>Cost: {selectedComponent.costBps} bps</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a component from the Components tab to edit its details</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}