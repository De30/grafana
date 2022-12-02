package kind

name: "Service"

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
