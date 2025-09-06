import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type CustomField = Database['public']['Tables']['custom_fields']['Row'];
type CustomFieldInsert = Database['public']['Tables']['custom_fields']['Insert'];
type CustomFieldUpdate = Database['public']['Tables']['custom_fields']['Update'];

interface CustomFieldWithUsage extends CustomField {
  usage_count?: number;
  project_count?: number;
  task_count?: number;
  last_used?: string;
}

interface CustomFieldValue {
  field_id: string;
  value: string | number | boolean | string[] | null;
  entity_type: 'project' | 'task';
  entity_id: string;
}

type FieldType = 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'boolean';

export function useCustomFields() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [customFields, setCustomFields] = useState<CustomFieldWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomFields = useCallback(async () => {
    if (!currentWorkspace) {
      setCustomFields([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fields, error: fieldsError } = await (supabase as any)
        .from('custom_fields')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at');

      if (fieldsError) throw fieldsError;

      // Get usage statistics for each field
      const fieldsWithUsage = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fields || []).map(async (field: any) => {
          // Count project usages
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { count: projectCount } = await (supabase as any)
            .from('project_custom_fields')
            .select('*', { count: 'exact', head: true })
            .eq('field_id', field.id);

          // Count task usages
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { count: taskCount } = await (supabase as any)
            .from('task_custom_fields')
            .select('*', { count: 'exact', head: true })
            .eq('field_id', field.id);

          // Get last usage date
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: lastUsage } = await (supabase as any)
            .from('project_custom_fields')
            .select('updated_at')
            .eq('field_id', field.id)
            .order('updated_at', { ascending: false })
            .limit(1);

          return {
            ...field,
            project_count: projectCount || 0,
            task_count: taskCount || 0,
            usage_count: (projectCount || 0) + (taskCount || 0),
            last_used: lastUsage?.[0]?.updated_at || null,
          };
        })
      );

      setCustomFields(fieldsWithUsage);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch custom fields';
      setError(errorMessage);
      console.error('Error fetching custom fields:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchCustomFields();
  }, [fetchCustomFields]);

  const createCustomField = async (fieldData: {
    name: string;
    entity_type: 'project' | 'task';
    field_type: FieldType;
    options?: string[];
    required?: boolean;
  }) => {
    try {
      if (!user || !currentWorkspace) throw new Error('User or workspace not available');

      // Validate field name uniqueness within entity type
      const existingField = customFields.find(
        field => field.name.toLowerCase() === fieldData.name.toLowerCase() && 
                 field.entity_type === fieldData.entity_type
      );
      if (existingField) {
        throw new Error(`A ${fieldData.entity_type} field with this name already exists`);
      }

      const insertData: CustomFieldInsert = {
        workspace_id: currentWorkspace.id,
        name: fieldData.name,
        entity_type: fieldData.entity_type,
        field_type: fieldData.field_type,
        options: fieldData.options || [],
        required: fieldData.required || false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('custom_fields')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newField = {
        ...data,
        usage_count: 0,
        project_count: 0,
        task_count: 0,
        last_used: null,
      };

      setCustomFields(prev => [...prev, newField]);

      // Log activity
      await logActivity('created', 'custom_field', data.id, null, data);

      toast.success('Custom field created successfully!');
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create custom field';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateCustomField = async (id: string, updates: CustomFieldUpdate) => {
    try {
      const oldField = customFields.find(f => f.id === id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('custom_fields')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomFields(prev => prev.map(field =>
        field.id === id ? { ...field, ...data } : field
      ));

      // Log activity
      await logActivity('updated', 'custom_field', id, oldField, data);

      toast.success('Custom field updated successfully!');
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update custom field';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteCustomField = async (id: string) => {
    try {
      const field = customFields.find(f => f.id === id);
      
      // Check if field is in use
      if (field && field.usage_count && field.usage_count > 0) {
        const confirmDelete = confirm(
          `This field is used in ${field.usage_count} items. Deleting it will remove all associated data. Continue?`
        );
        if (!confirmDelete) return;
      }

      // Delete associated field values first
      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('project_custom_fields').delete().eq('field_id', id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('task_custom_fields').delete().eq('field_id', id),
      ]);

      // Delete the field itself
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomFields(prev => prev.filter(f => f.id !== id));

      // Log activity
      await logActivity('deleted', 'custom_field', id, field, null);

      toast.success('Custom field deleted successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete custom field';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const setFieldValue = async (
    fieldId: string,
    entityType: 'project' | 'task',
    entityId: string,
    value: string | number | boolean | string[] | null
  ) => {
    try {
      const field = customFields.find(f => f.id === fieldId);
      if (!field) throw new Error('Custom field not found');

      // Validate the value
      const validationError = validateFieldValue(field, value);
      if (validationError) throw new Error(validationError);

      const tableName = entityType === 'project' ? 'project_custom_fields' : 'task_custom_fields';
      const fieldColumn = entityType === 'project' ? 'project_id' : 'task_id';

      // Check if value already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from(tableName)
        .select('id')
        .eq('field_id', fieldId)
        .eq(fieldColumn, entityId)
        .single();

      if (existing) {
        // Update existing value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from(tableName)
          .update({ 
            value: value,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from(tableName)
          .insert({
            field_id: fieldId,
            [fieldColumn]: entityId,
            value: value,
          });

        if (error) throw error;
      }

      // Update usage statistics
      await fetchCustomFields();

      toast.success('Field value updated successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set field value';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getFieldValues = async (
    entityType: 'project' | 'task',
    entityId: string
  ): Promise<CustomFieldValue[]> => {
    try {
      const tableName = entityType === 'project' ? 'project_custom_fields' : 'task_custom_fields';
      const fieldColumn = entityType === 'project' ? 'project_id' : 'task_id';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select(`
          field_id,
          value,
          custom_fields!inner (
            name,
            field_type,
            options
          )
        `)
        .eq(fieldColumn, entityId);

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((item: any) => ({
        field_id: item.field_id,
        value: item.value,
        entity_type: entityType,
        entity_id: entityId,
      }));
    } catch (err: unknown) {
      console.error('Error fetching field values:', err);
      return [];
    }
  };

  const validateFieldValue = (field: CustomField, value: unknown): string | null => {
    // Required validation
    if (field.required && (value === null || value === undefined || value === '')) {
      return `${field.name} is required`;
    }

    if (value === null || value === undefined || value === '') {
      return null; // Skip other validations for empty values
    }

    // Type-specific validations
    switch (field.field_type) {
      case 'text':
        if (typeof value !== 'string') return `${field.name} must be text`;
        break;

      case 'number':
        if (typeof value !== 'number') return `${field.name} must be a number`;
        break;

      case 'select':
        if (typeof value !== 'string') return `${field.name} must be a string`;
        if (field.options && field.options.length > 0 && !field.options.includes(value)) {
          return `${field.name} must be one of: ${field.options.join(', ')}`;
        }
        break;

      case 'multi_select':
        if (!Array.isArray(value)) return `${field.name} must be an array`;
        if (field.options && field.options.length > 0) {
          const invalidValues = value.filter(v => !field.options.includes(v));
          if (invalidValues.length > 0) {
            return `${field.name} contains invalid values: ${invalidValues.join(', ')}`;
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') return `${field.name} must be true or false`;
        break;

      case 'date':
        if (typeof value !== 'string') return `${field.name} must be a date string`;
        if (isNaN(Date.parse(value))) return `${field.name} must be a valid date`;
        break;
    }

    return null;
  };

  const duplicateField = async (id: string, newName: string) => {
    try {
      const originalField = customFields.find(f => f.id === id);
      if (!originalField) throw new Error('Field not found');

      const fieldData = {
        name: newName,
        entity_type: originalField.entity_type,
        field_type: originalField.field_type,
        options: originalField.options,
        required: originalField.required,
      };

      return await createCustomField(fieldData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate field';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Helper function to log activities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logActivity = async (
    action: string,
    entityType: 'custom_field',
    entityId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldValues: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValues: any
  ) => {
    try {
      if (!currentWorkspace) return;
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('activity_logs').insert({
        workspace_id: currentWorkspace.id,
        user_id: user.data.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        metadata: {},
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const getFieldsByType = (fieldType: FieldType) => {
    return customFields.filter(field => field.field_type === fieldType);
  };

  const getRequiredFields = () => {
    return customFields.filter(field => field.required);
  };

  const getFieldsByEntity = (entityType: 'project' | 'task') => {
    return customFields.filter(field => field.entity_type === entityType);
  };

  const searchFields = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return customFields.filter(field =>
      field.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    customFields,
    loading,
    error,
    fetchCustomFields,
    createCustomField,
    updateCustomField,
    deleteCustomField,
    setFieldValue,
    getFieldValues,
    validateFieldValue,
    duplicateField,
    getFieldsByType,
    getRequiredFields,
    getFieldsByEntity,
    searchFields,
  };
}