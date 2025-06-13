/**
 * Base component schema for Media Kit Builder
 * Defines the common structure for all components
 */
export const componentSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique identifier for the component'
  },
  type: {
    type: 'string',
    required: true,
    enum: ['biography', 'topics', 'social', 'logo', 'questions'],
    description: 'Component type'
  },
  content: {
    type: 'object',
    required: true,
    description: 'Component-specific content'
  },
  styles: {
    type: 'object',
    required: false,
    properties: {
      backgroundColor: { type: 'string' },
      textColor: { type: 'string' },
      padding: { type: 'string' },
      margin: { type: 'string' },
      borderRadius: { type: 'string' },
      borderWidth: { type: 'string' },
      borderColor: { type: 'string' },
      borderStyle: { type: 'string' },
      boxShadow: { type: 'string' },
      fontFamily: { type: 'string' },
      fontSize: { type: 'string' },
      fontWeight: { type: 'string' },
      textAlign: { type: 'string' },
      lineHeight: { type: 'string' }
    },
    description: 'Component styling'
  },
  metadata: {
    type: 'object',
    required: false,
    properties: {
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      version: { type: 'string' },
      author: { type: 'string' }
    },
    description: 'Component metadata'
  }
};

/**
 * Biography component schema
 */
export const biographySchema = {
  ...componentSchema,
  content: {
    type: 'object',
    required: true,
    properties: {
      text: { type: 'string', required: true },
      headline: { type: 'string', required: false },
      image: { 
        type: 'object', 
        required: false,
        properties: {
          url: { type: 'string', required: true },
          alt: { type: 'string', required: false },
          width: { type: 'number', required: false },
          height: { type: 'number', required: false }
        }
      }
    }
  }
};

/**
 * Topics component schema
 */
export const topicsSchema = {
  ...componentSchema,
  content: {
    type: 'object',
    required: true,
    properties: {
      title: { type: 'string', required: false },
      topics: { 
        type: 'array', 
        required: true,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', required: true },
            title: { type: 'string', required: true },
            description: { type: 'string', required: false }
          }
        }
      }
    }
  }
};

/**
 * Social component schema
 */
export const socialSchema = {
  ...componentSchema,
  content: {
    type: 'object',
    required: true,
    properties: {
      title: { type: 'string', required: false },
      platforms: { 
        type: 'array', 
        required: true,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', required: true },
            platform: { type: 'string', required: true },
            url: { type: 'string', required: true },
            username: { type: 'string', required: false },
            icon: { type: 'string', required: false }
          }
        }
      }
    }
  }
};

/**
 * Logo component schema
 */
export const logoSchema = {
  ...componentSchema,
  content: {
    type: 'object',
    required: true,
    properties: {
      title: { type: 'string', required: false },
      logo: { 
        type: 'object', 
        required: true,
        properties: {
          url: { type: 'string', required: true },
          alt: { type: 'string', required: false },
          width: { type: 'number', required: false },
          height: { type: 'number', required: false }
        }
      },
      description: { type: 'string', required: false }
    }
  }
};

/**
 * Questions component schema
 */
export const questionsSchema = {
  ...componentSchema,
  content: {
    type: 'object',
    required: true,
    properties: {
      title: { type: 'string', required: false },
      questions: { 
        type: 'array', 
        required: true,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', required: true },
            question: { type: 'string', required: true },
            answer: { type: 'string', required: true }
          }
        }
      }
    }
  }
};

// Map of component types to schemas
export const componentSchemas = {
  biography: biographySchema,
  topics: topicsSchema,
  social: socialSchema,
  logo: logoSchema,
  questions: questionsSchema
};
