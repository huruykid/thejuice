import { useState } from 'react';
import { validateUsername, validateProfileData } from '@/lib/security';

export interface ProfileFormData {
  username: string;
  dateOfBirth: string;
  city: string;
  relationshipStatus: string;
  phoneNumber: string;
}

export interface ProfileFormValidation {
  isValid: boolean;
  errors: string[];
  fieldErrors: {
    username?: string;
    dateOfBirth?: string;
    city?: string;
    relationshipStatus?: string;
    phoneNumber?: string;
  };
}

export const useProfileForm = () => {
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    dateOfBirth: '',
    city: '',
    relationshipStatus: '',
    phoneNumber: '',
  });

  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateUsername = (value: string) => {
    // Clean the input
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    updateField('username', cleaned);
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateForm = (isUsernameAvailable: boolean): ProfileFormValidation => {
    const errors: string[] = [];
    const fieldErrors: ProfileFormValidation['fieldErrors'] = {};

    // Username validation
    if (!formData.username) {
      errors.push('Username is required');
      fieldErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username).isValid) {
      errors.push('Username must be 3-20 characters, alphanumeric with _ or -, and not reserved');
      fieldErrors.username = 'Invalid username format';
    } else if (!isUsernameAvailable) {
      errors.push('Username is not available');
      fieldErrors.username = 'Username is not available';
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      errors.push('Date of birth is required');
      fieldErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        errors.push('You must be 18 or older to join');
        fieldErrors.dateOfBirth = 'Must be 18 or older';
      }
    }

    // City validation
    if (!formData.city.trim()) {
      errors.push('City is required');
      fieldErrors.city = 'City is required';
    }

    // Relationship status validation
    if (!formData.relationshipStatus) {
      errors.push('Relationship status is required');
      fieldErrors.relationshipStatus = 'Relationship status is required';
    }

    // Profile data validation (includes phone number)
    const profileValidation = validateProfileData({
      anonymous_username: formData.username,
      phone_number: formData.phoneNumber,
      city: formData.city,
      relationship_status: formData.relationshipStatus
    });

    if (!profileValidation.isValid) {
      errors.push(...profileValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  };

  const resetForm = () => {
    setFormData({
      username: '',
      dateOfBirth: '',
      city: '',
      relationshipStatus: '',
      phoneNumber: '',
    });
  };

  return {
    formData,
    updateField,
    updateUsername,
    calculateAge,
    validateForm,
    resetForm
  };
};