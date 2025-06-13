/**
 * Schema validator for Media Kit Builder
 * Validates data against schemas to ensure consistency
 */
export function validateAgainstSchema(data, schema) {
  const errors = [];
  
  // Check for required fields
  for (const [key, definition] of Object.entries(schema)) {
    if (definition.required && !data.hasOwnProperty(key)) {
      errors.push(`Missing required field: ${key}`);
    }
  }
  
  // Check types and additional validations
  for (const [key, value] of Object.entries(data)) {
    const definition = schema[key];
    
    // Skip if no definition found for this key
    if (!definition) continue;
    
    // Type validation
    if (definition.type) {
      let valid = false;
      
      switch (definition.type) {
        case 'string':
          valid = typeof value === 'string';
          break;
        case 'number':
          valid = typeof value === 'number';
          break;
        case 'boolean':
          valid = typeof value === 'boolean';
          break;
        case 'object':
          valid = typeof value === 'object' && value !== null && !Array.isArray(value);
          break;
        case 'array':
          valid = Array.isArray(value);
          break;
      }
      
      if (!valid) {
        errors.push(`Invalid type for ${key}: expected ${definition.type}, got ${typeof value}`);
      }
    }
    
    // Enum validation
    if (definition.enum && Array.isArray(definition.enum) && !definition.enum.includes(value)) {
      errors.push(`Invalid value for ${key}: must be one of [${definition.enum.join(', ')}]`);
    }
    
    // Pattern validation
    if (definition.pattern && typeof value === 'string') {
      const regex = new RegExp(definition.pattern);
      if (!regex.test(value)) {
        errors.push(`Invalid format for ${key}: must match pattern ${definition.pattern}`);
      }
    }
    
    // Min/max validation for strings and arrays
    if (definition.minLength && (typeof value === 'string' || Array.isArray(value))) {
      if (value.length < definition.minLength) {
        errors.push(`Invalid length for ${key}: must be at least ${definition.minLength} characters`);
      }
    }
    
    if (definition.maxLength && (typeof value === 'string' || Array.isArray(value))) {
      if (value.length > definition.maxLength) {
        errors.push(`Invalid length for ${key}: must be at most ${definition.maxLength} characters`);
      }
    }
    
    // Nested object validation
    if (definition.properties && typeof value === 'object' && value !== null) {
      const nestedValidation = validateAgainstSchema(value, definition.properties);
      if (!nestedValidation.valid) {
        errors.push(...nestedValidation.errors.map(error => `${key}.${error}`));
      }
    }
    
    // Array item validation
    if (definition.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        const itemValidation = validateAgainstSchema(item, definition.items);
        if (!itemValidation.valid) {
          errors.push(...itemValidation.errors.map(error => `${key}[${index}].${error}`));
        }
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
