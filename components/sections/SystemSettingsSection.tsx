// components/sections/SystemSettingsSection.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Edit2, 
  Save, 
  X, 
  DollarSign, 
  Route, 
  Users,
  Clock,
  Loader2
} from 'lucide-react';
import { adminService } from '@/services/admin';
import type { SystemSetting, UpdateSystemSettingRequest } from '@/types/admin';

interface SystemSettingsSectionProps {
  settings: SystemSetting[];
  onSettingUpdate: (updatedSetting: SystemSetting) => void;
}

const getSettingIcon = (key: string) => {
  if (key.includes('rate') || key.includes('price')) return DollarSign;
  if (key.includes('distance')) return Route;
  if (key.includes('instructor')) return Users;
  if (key.includes('hour') || key.includes('time')) return Clock;
  return Settings;
};

const getSettingColor = (key: string) => {
  if (key.includes('rate') || key.includes('price')) return {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200'
  };
  if (key.includes('distance')) return {
    bg: 'bg-blue-50', 
    text: 'text-blue-600',
    border: 'border-blue-200'
  };
  if (key.includes('instructor')) return {
    bg: 'bg-purple-50',
    text: 'text-purple-600', 
    border: 'border-purple-200'
  };
  return {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200'
  };
};

const formatValue = (key: string, value: string) => {
  if (key.includes('rate') || key.includes('price')) {
    const numValue = parseInt(value);
    return `$${(numValue / 100).toFixed(2)} CAD`;
  }
  if (key.includes('distance')) return `${value} km`;
  if (key.includes('hour')) return `${value} km/h`;
  return value;
};

const SettingCard = ({ 
  setting, 
  onUpdate 
}: { 
  setting: SystemSetting; 
  onUpdate: (updatedSetting: SystemSetting) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(setting.value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Icon = getSettingIcon(setting.key);
  const colors = getSettingColor(setting.key);

    const handleSave = async () => {
    if (!setting.key) {
        setError('Setting key is missing');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        console.log('Updating setting with key:', setting.key, { value: editValue });
        
        const updateData: UpdateSystemSettingRequest = { 
        value: editValue.toString()
        };
        
        // Use the corrected method that finds the ID first
        const updatedSetting = await adminService.updateSystemSettingByKey(
        setting.key, 
        updateData
        );
        
        console.log('Update successful:', updatedSetting);
        onUpdate(updatedSetting);
        setIsEditing(false);
    } catch (err: any) {
        console.error('Update failed:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to update setting');
    } finally {
        setIsLoading(false);
    }
    };

  const handleCancel = () => {
    setEditValue(setting.value);
    setIsEditing(false);
    setError(null);
  };

  return (
    <Card className={`group hover:shadow-md transition-all ${colors.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Icon className={`w-4 h-4 ${colors.text}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-gray-900">
                {setting.name}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {setting.description}
              </p>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Edit clicked for setting:', setting);
                setIsEditing(true);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter value"
              className="text-sm"
              type="text"
            />
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading || editValue === setting.value}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                {formatValue(setting.key, setting.value)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {setting.key}
              </Badge>
            </div>
            {setting.updated_at && (
              <p className="text-xs text-gray-400">
                Updated {new Date(setting.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function SystemSettingsSection({ 
  settings = [],
  onSettingUpdate 
}: SystemSettingsSectionProps) {
  if (!Array.isArray(settings)) {
    console.error('Settings is not an array:', settings);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-red-600">
              <p className="font-medium">Error loading system settings</p>
              <p className="text-sm mt-1">Invalid settings data format</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No system settings found</p>
              <p className="text-sm mt-1">Settings will appear here when available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Application Configuration</CardTitle>
          <p className="text-sm text-gray-600">
            Configure core system variables that control pricing, distances, and business logic.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.map((setting) => (
              <SettingCard
                key={setting.key} // Use key instead of id
                setting={setting}
                onUpdate={onSettingUpdate}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}