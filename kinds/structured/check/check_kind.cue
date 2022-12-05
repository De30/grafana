package kind

name: "Check"
description: "Check represents a single Synthetic Monitoring endpoint to be checked. Happy sloppy hackathon!"

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
