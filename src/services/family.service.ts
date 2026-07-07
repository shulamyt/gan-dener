import { Parent, Child } from '@prisma/client';
import { FamilyRepository, FamilyWithMembers } from '../repositories/family.repository';

export interface FamilySearchResult {
  family: FamilyWithMembers;
  matchType: 'lastName' | 'parent' | 'child';
  matchedName: string;
}

export class FamilyService {
  constructor(private readonly familyRepo: FamilyRepository) {}

  async findByLastName(tenantId: string, lastName: string): Promise<FamilyWithMembers | null> {
    return this.familyRepo.findByTenantAndLastNameWithMembers(tenantId, lastName);
  }

  async findByName(tenantId: string, name: string): Promise<FamilySearchResult[]> {
    const families = await this.familyRepo.searchFamiliesByName(tenantId, name);
    
    const results: FamilySearchResult[] = [];

    for (const family of families) {
      // Check if name matches last name
      if (family.lastName.toLowerCase().includes(name.toLowerCase())) {
        results.push({
          family,
          matchType: 'lastName',
          matchedName: family.lastName,
        });
      }

      // Check if name matches any parent
      for (const parent of family.parents) {
        if (parent.firstName.toLowerCase().includes(name.toLowerCase())) {
          results.push({
            family,
            matchType: 'parent',
            matchedName: parent.firstName,
          });
        }
      }

      // Check if name matches any child
      for (const child of family.children) {
        if (child.firstName.toLowerCase().includes(name.toLowerCase())) {
          results.push({
            family,
            matchType: 'child',
            matchedName: child.firstName,
          });
        }
      }
    }

    return results;
  }

  async getOrCreateFamily(
    tenantId: string,
    lastName: string,
    memberData?: {
      parents?: { firstName: string; email?: string; phoneNumber?: string }[];
      children?: { firstName: string; gardenName?: string }[];
    }
  ): Promise<FamilyWithMembers> {
    // Try to find existing family
    const existing = await this.familyRepo.findByTenantAndLastNameWithMembers(tenantId, lastName);
    if (existing) {
      return existing;
    }

    // Create new family with members
    return this.familyRepo.createWithMembers({
      tenantId,
      lastName,
      parents: memberData?.parents,
      children: memberData?.children,
    });
  }

  async listByTenant(tenantId: string): Promise<FamilyWithMembers[]> {
    return this.familyRepo.findByTenantIdWithMembers(tenantId);
  }

  async addParent(
    _familyId: string,
    _parentData: { firstName: string; email?: string; phoneNumber?: string }
  ): Promise<Parent> {
    // This would require a ParentRepository method, which we'll create next
    throw new Error('Not implemented yet - need ParentRepository');
  }

  async addChild(
    _familyId: string,
    _childData: { firstName: string; gardenName?: string }
  ): Promise<Child> {
    // This would require a ChildRepository method, which we'll create next
    throw new Error('Not implemented yet - need ChildRepository');
  }

  /**
   * Find a family by any member name (parent or child first name, or family last name)
   */
  async findFamilyByMemberName(tenantId: string, memberName: string): Promise<FamilyWithMembers | null> {
    const results = await this.findByName(tenantId, memberName);
    
    if (results.length === 1) {
      return results[0].family;
    }
    
    if (results.length === 0) {
      return null;
    }

    // If multiple matches, prioritize exact matches
    const exactMatches = results.filter(r => 
      r.matchedName.toLowerCase() === memberName.toLowerCase()
    );

    if (exactMatches.length === 1) {
      return exactMatches[0].family;
    }

    // If still multiple matches, return null to indicate ambiguity
    // The calling service should handle this case
    return null;
  }

  /**
   * Get suggestions for family member names when search fails
   */
  async getFamilyMemberSuggestions(tenantId: string): Promise<string[]> {
    const families = await this.familyRepo.findByTenantIdWithMembers(tenantId);
    
    const suggestions: string[] = [];
    
    for (const family of families) {
      // Add family last name
      suggestions.push(family.lastName);
      
      // Add parent first names
      for (const parent of family.parents) {
        suggestions.push(parent.firstName);
      }
      
      // Add child first names
      for (const child of family.children) {
        suggestions.push(child.firstName);
      }
    }
    
    return [...new Set(suggestions)].sort(); // Remove duplicates and sort
  }
}