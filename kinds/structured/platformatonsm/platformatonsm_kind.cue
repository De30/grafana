package kind

name: "Platformatonsm"
description: "A synthetic monitoring platformaton. Happy sloppy hackathoning!"

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
