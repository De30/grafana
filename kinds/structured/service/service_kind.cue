package kind

name: "Service"
description: "Service is a logical representation of a single 'service' within an org. Happy sloppy hackathoning!"

lineage: seqs: [
	{
		schemas: [
			// v0.0
			{
				uid: string
				// name of the service
				name: string
				endpoints?: [...#Endpoint]

				// hack this in body b/c kindsys doesn't support meta yet.
				// codegen here is buggy - value type IS always a string, you can safely assert that in your code
				labels: [string]: string

				#Endpoint: {
					path: string
					type: "http" | "ping" | "dns" | "tcp"
				} @cuetsy(kind="interface")
			},
		]
	},
]
