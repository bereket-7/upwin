#!/usr/bin/env ts-node

/**
 * RAG Seeding Script for AI Gateway
 * 
 * Seeds Qdrant collections with proposal examples and writing templates
 * Uses gemini-embedding-001 for vector generation
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-rag.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

// Types
interface ProposalExample {
  title: string;
  content: string;
  industry: string;
  tone: string;
}

interface WritingTemplate {
  title: string;
  content: string;
  tone: string;
  section: string;
}

interface SeedPoint {
  id: string;
  vector: number[];
  payload: {
    type: 'proposal_example' | 'writing_template';
    title: string;
    content: string;
    metadata: {
      tone: string;
      industry?: string;
      section?: string;
    };
  };
}

// Configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize clients
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

// Seed Data
const PROPOSAL_EXAMPLES: ProposalExample[] = [
  {
    title: 'Full Stack Web Application Development',
    content: 'Hello, I specialize in building scalable full-stack web applications using React, Node.js, and PostgreSQL. I can develop your platform with secure authentication, responsive UI, and optimized backend APIs. My approach includes agile delivery, weekly updates, and clean architecture for long-term maintainability.',
    industry: 'software',
    tone: 'professional',
  },
  {
    title: 'SaaS MVP Development',
    content: 'I will help you launch your SaaS MVP quickly and efficiently. Using modern cloud-native architecture, I will build a scalable backend, intuitive frontend, and secure payment integration. My focus is speed, reliability, and product-market validation.',
    industry: 'startup',
    tone: 'professional',
  },
  {
    title: 'AI Feature Integration',
    content: 'I can integrate AI-powered features such as recommendation engines, chatbots, and document summarization into your existing system. Using modern LLM APIs and vector databases, I ensure intelligent automation and measurable efficiency improvements.',
    industry: 'ai',
    tone: 'professional',
  },
  {
    title: 'Cross-Platform Mobile App',
    content: 'I will develop a high-performance mobile application using React Native or Flutter. The app will support iOS and Android with a single codebase, ensuring smooth UX and strong backend integration.',
    industry: 'mobile',
    tone: 'professional',
  },
  {
    title: 'E-commerce Platform Development',
    content: 'I can build a secure and scalable e-commerce platform with product management, payment integration, order tracking, and analytics dashboard. The solution will be optimized for performance and SEO.',
    industry: 'ecommerce',
    tone: 'professional',
  },
  {
    title: 'REST API Development',
    content: 'I specialize in designing clean, well-documented REST APIs using NestJS and PostgreSQL. The API will follow best practices including JWT authentication, validation, and scalable architecture.',
    industry: 'backend',
    tone: 'professional',
  },
  {
    title: 'DevOps & CI/CD Setup',
    content: 'I will set up CI/CD pipelines, Dockerized environments, and cloud deployment using AWS or GCP. The goal is automated, reliable, and secure deployments.',
    industry: 'devops',
    tone: 'professional',
  },
  {
    title: 'UI/UX Design Enhancement',
    content: 'I will redesign your application interface focusing on usability, accessibility, and modern design standards. The outcome will be visually appealing and conversion-optimized.',
    industry: 'design',
    tone: 'professional',
  },
];

const WRITING_TEMPLATES: WritingTemplate[] = [
  {
    title: 'Professional Proposal Tone',
    content: 'Structure the proposal formally. Start with understanding the client\'s problem. Provide a clear solution. Highlight experience. End with a confident call-to-action.',
    tone: 'professional',
    section: 'general',
  },
  {
    title: 'Concise Proposal Style',
    content: 'Keep the proposal short and direct. Focus on value delivery and measurable results. Avoid unnecessary details.',
    tone: 'professional',
    section: 'body',
  },
  {
    title: 'Technical Deep Dive Style',
    content: 'Provide technical details about architecture, tools, scalability, and performance. Mention frameworks and justify design decisions.',
    tone: 'professional',
    section: 'body',
  },
  {
    title: 'Startup-Focused Proposal Style',
    content: 'Emphasize speed, MVP validation, iteration cycles, and long-term scalability. Show enthusiasm and product thinking.',
    tone: 'professional',
    section: 'intro',
  },
];

// Helper Functions
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    
    if (!result.embedding || !result.embedding.values) {
      throw new Error('Failed to generate embedding');
    }

    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function checkCollectionExists(collectionName: string): Promise<boolean> {
  try {
    const collections = await qdrantClient.getCollections();
    return collections.collections.some((col: any) => col.name === collectionName);
  } catch (error) {
    console.error(`Error checking collection ${collectionName}:`, error);
    return false;
  }
}

async function seedProposalExamples(): Promise<void> {
  console.log('\n📝 Seeding proposal examples...');
  
  const collectionName = 'proposal_examples';
  
  // Check if collection exists
  const exists = await checkCollectionExists(collectionName);
  if (!exists) {
    console.error(`❌ Collection '${collectionName}' does not exist. Run the service first to create collections.`);
    return;
  }

  const points: SeedPoint[] = [];

  for (let i = 0; i < PROPOSAL_EXAMPLES.length; i++) {
    const example = PROPOSAL_EXAMPLES[i];
    
    try {
      console.log(`  [${i + 1}/${PROPOSAL_EXAMPLES.length}] Generating embedding for: ${example.title}`);
      
      // Generate embedding
      const vector = await generateEmbedding(example.content);
      
      // Create point
      const point: SeedPoint = {
        id: uuidv4(),
        vector,
        payload: {
          type: 'proposal_example',
          title: example.title,
          content: example.content,
          metadata: {
            tone: example.tone,
            industry: example.industry,
          },
        },
      };
      
      points.push(point);
      console.log(`  ✓ Embedded: ${example.title} (${vector.length} dimensions)`);
    } catch (error) {
      console.error(`  ✗ Failed to process: ${example.title}`, error);
    }
  }

  // Upsert points (will not duplicate if run multiple times)
  if (points.length > 0) {
    try {
      console.log(`\n  Upserting ${points.length} points to '${collectionName}'...`);
      await qdrantClient.upsert(collectionName, {
        wait: true,
        points,
      });
      console.log(`  ✓ Successfully upserted ${points.length} proposal examples`);
    } catch (error) {
      console.error(`  ✗ Failed to upsert points:`, error);
    }
  }
}

async function seedWritingTemplates(): Promise<void> {
  console.log('\n📚 Seeding writing templates...');
  
  const collectionName = 'writing_templates';
  
  // Check if collection exists
  const exists = await checkCollectionExists(collectionName);
  if (!exists) {
    console.error(`❌ Collection '${collectionName}' does not exist. Run the service first to create collections.`);
    return;
  }

  const points: SeedPoint[] = [];

  for (let i = 0; i < WRITING_TEMPLATES.length; i++) {
    const template = WRITING_TEMPLATES[i];
    
    try {
      console.log(`  [${i + 1}/${WRITING_TEMPLATES.length}] Generating embedding for: ${template.title}`);
      
      // Generate embedding
      const vector = await generateEmbedding(template.content);
      
      // Create point
      const point: SeedPoint = {
        id: uuidv4(),
        vector,
        payload: {
          type: 'writing_template',
          title: template.title,
          content: template.content,
          metadata: {
            tone: template.tone,
            section: template.section,
          },
        },
      };
      
      points.push(point);
      console.log(`  ✓ Embedded: ${template.title} (${vector.length} dimensions)`);
    } catch (error) {
      console.error(`  ✗ Failed to process: ${template.title}`, error);
    }
  }

  // Upsert points (will not duplicate if run multiple times)
  if (points.length > 0) {
    try {
      console.log(`\n  Upserting ${points.length} points to '${collectionName}'...`);
      await qdrantClient.upsert(collectionName, {
        wait: true,
        points,
      });
      console.log(`  ✓ Successfully upserted ${points.length} writing templates`);
    } catch (error) {
      console.error(`  ✗ Failed to upsert points:`, error);
    }
  }
}

async function getCollectionStats(): Promise<void> {
  console.log('\n📊 Collection Statistics:');
  
  try {
    const proposalInfo = await qdrantClient.getCollection('proposal_examples');
    console.log(`  proposal_examples: ${proposalInfo.points_count} points`);
  } catch (error) {
    console.log(`  proposal_examples: Collection not found or error`);
  }

  try {
    const templateInfo = await qdrantClient.getCollection('writing_templates');
    console.log(`  writing_templates: ${templateInfo.points_count} points`);
  } catch (error) {
    console.log(`  writing_templates: Collection not found or error`);
  }
}

// Main execution
async function main() {
  console.log('🚀 RAG Seeding Script');
  console.log('='.repeat(50));
  console.log(`Qdrant URL: ${QDRANT_URL}`);
  console.log(`Embedding Model: gemini-embedding-001`);
  console.log(`Vector Dimensions: 3072`);
  console.log('='.repeat(50));

  try {
    // Test Qdrant connection
    console.log('\n🔌 Testing Qdrant connection...');
    await qdrantClient.getCollections();
    console.log('✓ Connected to Qdrant');

    // Seed data
    await seedProposalExamples();
    await seedWritingTemplates();

    // Show stats
    await getCollectionStats();

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nYou can now use RAG-enhanced proposal generation.');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
