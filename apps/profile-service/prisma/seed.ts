import { PrismaClient, PreferenceCategory } from '../src/generated/prisma';

const prisma = new PrismaClient();

const initialPreferences = [
  // Tones
  {
    category: PreferenceCategory.TONE,
    name: 'Professional',
    value: 'professional',
    description: 'Formal and business-appropriate tone',
    isDefault: true,
    sortOrder: 1,
  },
  {
    category: PreferenceCategory.TONE,
    name: 'Friendly',
    value: 'friendly',
    description: 'Warm and approachable tone',
    isDefault: false,
    sortOrder: 2,
  },
  {
    category: PreferenceCategory.TONE,
    name: 'Enthusiastic',
    value: 'enthusiastic',
    description: 'Energetic and passionate tone',
    isDefault: false,
    sortOrder: 3,
  },
  {
    category: PreferenceCategory.TONE,
    name: 'Formal',
    value: 'formal',
    description: 'Highly professional and structured tone',
    isDefault: false,
    sortOrder: 4,
  },
  {
    category: PreferenceCategory.TONE,
    name: 'Casual',
    value: 'casual',
    description: 'Relaxed and conversational tone',
    isDefault: false,
    sortOrder: 5,
  },
  {
    category: PreferenceCategory.TONE,
    name: 'Confident',
    value: 'confident',
    description: 'Assertive and self-assured tone',
    isDefault: false,
    sortOrder: 6,
  },

  // Writing Styles
  {
    category: PreferenceCategory.WRITING_STYLE,
    name: 'Concise',
    value: 'concise',
    description: 'Brief and to-the-point writing',
    isDefault: true,
    sortOrder: 1,
  },
  {
    category: PreferenceCategory.WRITING_STYLE,
    name: 'Detailed',
    value: 'detailed',
    description: 'Comprehensive and thorough writing',
    isDefault: false,
    sortOrder: 2,
  },
  {
    category: PreferenceCategory.WRITING_STYLE,
    name: 'Storytelling',
    value: 'storytelling',
    description: 'Narrative-driven and engaging writing',
    isDefault: false,
    sortOrder: 3,
  },
  {
    category: PreferenceCategory.WRITING_STYLE,
    name: 'Technical',
    value: 'technical',
    description: 'Precise and technical writing',
    isDefault: false,
    sortOrder: 4,
  },
  {
    category: PreferenceCategory.WRITING_STYLE,
    name: 'Persuasive',
    value: 'persuasive',
    description: 'Compelling and convincing writing',
    isDefault: false,
    sortOrder: 5,
  },

  // Lengths
  {
    category: PreferenceCategory.LENGTH,
    name: 'Short',
    value: 'short',
    description: '200-300 words',
    isDefault: false,
    sortOrder: 1,
  },
  {
    category: PreferenceCategory.LENGTH,
    name: 'Medium',
    value: 'medium',
    description: '300-500 words',
    isDefault: true,
    sortOrder: 2,
  },
  {
    category: PreferenceCategory.LENGTH,
    name: 'Long',
    value: 'long',
    description: '500-700 words',
    isDefault: false,
    sortOrder: 3,
  },
];

async function main() {
  console.log('🌱 Seeding AI Preferences...');

  for (const pref of initialPreferences) {
    await prisma.aIPreference.upsert({
      where: {
        category_name: {
          category: pref.category,
          name: pref.name,
        },
      },
      update: {
        value: pref.value,
        description: pref.description,
        isDefault: pref.isDefault,
        sortOrder: pref.sortOrder,
      },
      create: pref,
    });
    console.log(`✓ Created/Updated: ${pref.category} - ${pref.name}`);
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
