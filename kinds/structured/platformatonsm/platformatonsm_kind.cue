package kind

name: "PlatformatonSM"

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
