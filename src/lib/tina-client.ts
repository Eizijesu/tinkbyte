// src/libs/tina-client.ts - ENHANCED VERSION

import { client } from '../../tina/__generated__/client';

export { client };

export function isEditMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.search.includes('tina-admin=true');
}

// ENHANCED: Better TinaCMS data fetching with error handling
export async function getTinaPost(relativePath: string) {
  try {
    console.log('🦙 Fetching TinaCMS data for:', relativePath);
    
    const response = await client.queries.blog({ 
      relativePath: relativePath 
    });
    
    console.log('🦙 TinaCMS Response:', {
      hasData: !!response.data,
      dataStructure: response.data ? Object.keys(response.data) : [],
      blogData: response.data?.blog,
      hasBody: !!response.data?.blog?.body,
      bodyStructure: response.data?.blog?.body ? Object.keys(response.data.blog.body) : []
    });
    
    return response;
  } catch (error) {
    console.warn('Failed to fetch TinaCMS data:', error);
    return null;
  }
}

// ENHANCED: Helper to get body content from TinaCMS data
export function extractBodyContent(tinaData: any) {
  if (!tinaData) return null;
  
  // Try different possible locations for body content
  const possiblePaths = [
    tinaData.blog?.body,
    tinaData.body,
    tinaData.content,
    tinaData.richText
  ];
  
  for (const path of possiblePaths) {
    if (path && (path.children || typeof path === 'string')) {
      return path;
    }
  }
  
  return null;
}