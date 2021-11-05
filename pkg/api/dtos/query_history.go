package dtos

type QueryHistory struct {
	DataSourceUid int64  `json:"datasourceUid"`
	Queries       string `json:"queries"`
}
