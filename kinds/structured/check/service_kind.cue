package kind

name: "Check"

lineage: seqs: [
	{
		schemas: [
			// v0.0
			{
				uid: string
				target: string
				job: string
				type: "http" | "ping" | "dns" | "tcp"
				locations: [...string]
			},
		]
	},
]
