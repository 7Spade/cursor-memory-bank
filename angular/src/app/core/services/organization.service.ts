import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  collection,
  collectionData,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  DocumentData
} from '@angular/fire/firestore';
import { Observable, map, switchMap, combineLatest, of } from 'rxjs';
import { 
  Organization, 
  OrganizationMember, 
  Team,
  TeamMember,
  OrgRole,
  TeamRole 
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private firestore = inject(Firestore);

  async createOrganization(
    name: string,
    login: string,
    ownerId: string
  ): Promise<string> {
    const orgId = doc(collection(this.firestore, 'accounts')).id;

    await setDoc(doc(this.firestore, `accounts/${orgId}`), {
      id: orgId,
      type: 'organization',
      login,
      name,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        defaultMemberRole: OrgRole.MEMBER,
        visibility: 'private'
      }
    });

    await this.addOrganizationMember(orgId, ownerId, OrgRole.OWNER);
    return orgId;
  }

  getOrganization(orgId: string): Observable<Organization | undefined> {
    const orgDoc = doc(this.firestore, `accounts/${orgId}`);
    return docData(orgDoc, { idField: 'id' }).pipe(
      map(data => {
        if (data && (data as DocumentData)['type'] === 'organization') {
          return data as Organization;
        }
        return undefined;
      })
    );
  }

  getOrganizationMembers(orgId: string): Observable<OrganizationMember[]> {
    const membersCol = collection(this.firestore, `accounts/${orgId}/members`);
    return collectionData(membersCol, { idField: 'id' }) as Observable<OrganizationMember[]>;
  }

  async addOrganizationMember(
    orgId: string,
    userId: string,
    role: OrgRole,
    invitedBy?: string
  ): Promise<void> {
    const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    await setDoc(memberRef, {
      id: userId,
      organizationId: orgId,
      userId,
      role,
      joinedAt: new Date(),
      invitedBy
    });
  }

  async updateMemberRole(
    orgId: string,
    userId: string,
    newRole: OrgRole
  ): Promise<void> {
    const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    await updateDoc(memberRef, { role: newRole });
  }

  async removeOrganizationMember(orgId: string, userId: string): Promise<void> {
    const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    await deleteDoc(memberRef);
  }

  async createTeam(
    orgId: string,
    name: string,
    slug: string,
    description?: string
  ): Promise<string> {
    const teamRef = await addDoc(
      collection(this.firestore, `accounts/${orgId}/teams`),
      {
        organizationId: orgId,
        name,
        slug,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          repository: { read: true, write: false, admin: false },
          issues: { read: true, write: false, delete: false },
          pullRequests: { read: true, write: false, merge: false }
        }
      }
    );
    return teamRef.id;
  }

  getOrganizationTeams(orgId: string): Observable<Team[]> {
    const teamsCol = collection(this.firestore, `accounts/${orgId}/teams`);
    return collectionData(teamsCol, { idField: 'id' }) as Observable<Team[]>;
  }

  getTeamMembers(orgId: string, teamId: string): Observable<TeamMember[]> {
    const membersCol = collection(
      this.firestore,
      `accounts/${orgId}/teams/${teamId}/members`
    );
    return collectionData(membersCol, { idField: 'id' }) as Observable<TeamMember[]>;
  }

  getUserTeams(orgId: string, userId: string): Observable<Team[]> {
    return this.getOrganizationTeams(orgId).pipe(
      switchMap(teams => {
        if (teams.length === 0) return of([]);

        const teamObservables = teams.map(team =>
          this.getTeamMembers(orgId, team.id).pipe(
            map(members => ({
              team,
              isMember: members.some(m => m.userId === userId)
            }))
          )
        );
        return combineLatest(teamObservables);
      }),
      map(results => results.filter(r => r.isMember).map(r => r.team))
    );
  }
}


