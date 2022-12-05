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

				#Endpoint: {
					path: string
					type: "http" | "ping" | "dns" | "tcp"
				} @cuetsy(kind="interface")
			},
		]
	},
]
