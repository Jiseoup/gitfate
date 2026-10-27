import { githubGraphql } from './client';

export interface Profile {
  id: string;
  login: string;
  name: string | null;
  avatarUrl: string;
  createdAt: string;
  isOrganization: boolean;
  location: string | null;
}

const PROFILE_REVALIDATE = 604800;

const QUERY = `
query Profile($login: String!) {
  repositoryOwner(login: $login) {
    __typename
    id
    login
    avatarUrl
    ... on User { name createdAt location }
    ... on Organization { name createdAt location }
  }
}`;

interface OwnerNode {
  __typename: string;
  id: string;
  login: string;
  avatarUrl: string;
  name: string | null;
  createdAt: string;
  location: string | null;
}

export async function fetchProfile(login: string): Promise<Profile | null> {
  const data = await githubGraphql<{ repositoryOwner: OwnerNode | null }>(
    QUERY,
    { login },
    PROFILE_REVALIDATE,
  );
  const o = data.repositoryOwner;
  if (!o) return null;
  return {
    id: o.id,
    login: o.login,
    name: o.name || null,
    avatarUrl: o.avatarUrl,
    createdAt: o.createdAt,
    isOrganization: o.__typename === 'Organization',
    location: o.location || null,
  };
}
