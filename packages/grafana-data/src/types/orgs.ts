export interface UserOrgDTO {
  orgId: number;
  name: string;
  role: OrgRole;
}

export enum OrgRole {
  None = 'None',
  Admin = 'Admin',
  Editor = 'Editor',
  Viewer = 'Viewer',
}
