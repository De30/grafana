package datasource

import "github.com/grafana/thema"

thema.#Lineage
name: "datasource"
seqs: [
    {
        schemas: [
            { // 0.0
                name: string
                type: string
                access: *"proxy" | "direct"
                url?: string // should be left up to the plugin schema?
                password: string
                user: string
                database?: string
                withCredentials: bool | *false
                isDefault: bool | *false
                jsonData?: [string]: _
                secureJsonData?: [string]: bytes
                readOnly: bool | *false

                basicAuth: bool // no longer used, now in secureJsonData
                basicAuthUser: string // no longer used, now in secureJsonData
                basicAuthPassword: string // no longer used, now in secureJsonData

                // Below fields should(?) be kept in metadata
                version: int32
                orgId: int64
                id?: int64 // TODO sequential ids are to be removed
                uid: string

                // would enforce k8s-compatible character and length constraints on uid field
                //uid: =~"^[A-Za-z][A-Za-z0-9\.-]{251}[A-Za-z]$"
            },
        ]
    },
]
