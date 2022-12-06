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

				// hack this in body b/c kindsys doesn't support meta yet
				// codegen here is buggy - value type IS always a string, you can safely assert that in your code
				labels: [string]: string

				type: "http" | "ping" | "dns" | "tcp"
				locations: [...string]
			},
		]
	},
]
