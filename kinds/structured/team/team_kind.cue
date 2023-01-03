package kind

name: "Team"
maturity: "merged"

lineage: seqs: [
	{
		schemas: [
			// v0.0
			{
				// OrgId is the ID of an organisation the team belongs to.
				orgId: int64 @grafanamaturity(ToMetadata="sys")
				// Name of the team.
				name: string
				// Email of the team.
				email?: string
				// AvatarUrl is the team's avatar URL.
				avatarUrl?: string @grafanamaturity(MaybeRemove)
				// MemberCount is the number of the team members.
				memberCount: int64 @grafanamaturity(ToMetadata="kind")
				// TODO - it seems it's a team_member.permission, unlikely it should belong to the team kind
				permission: #Permission @grafanamaturity(ToMetadata="kind", MaybeRemove)
				// AccessControl metadata associated with a given resource.
				accessControl?: [string]: bool @grafanamaturity(ToMetadata="sys")
				// Created indicates when the team was created.
				created: int64 @grafanamaturity(ToMetadata="sys")
				// Updated indicates when the team was updated.
				updated: int64 @grafanamaturity(ToMetadata="sys")

				#Permission: 1 | 2 | 4 @cuetsy(kind="enum",memberNames="Viewer|Editor|Admin")
			},
		]
	},
]
