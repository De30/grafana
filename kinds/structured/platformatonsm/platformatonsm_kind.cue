package kind

name: "PlatformatonSM"
description: "A synthetic monitoring platformaton. Happy sloppy hackathoning!"

summaryHandler: "generic"

lineage: seqs: [
	{
		schemas: [
			{
				generateFor: {
					"http": bool | *true
					"ping": bool | *false
					"dns": bool | *false
					"tcp": bool | *false
				}
			}
		]
	}
]
